<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// System Access Control
try {
    // Get database config from .env file
    $envFile = __DIR__.'/../.env';
    $dbHost = 'localhost';
    $dbName = 'tes_online_unsika';
    $dbUser = 'root';
    $dbPass = '';

    // Try to read .env for database config
    if (file_exists($envFile)) {
        $envContent = file_get_contents($envFile);
        if (preg_match('/DB_HOST=(.*)/', $envContent, $matches)) {
            $dbHost = trim($matches[1]);
        }
        if (preg_match('/DB_DATABASE=(.*)/', $envContent, $matches)) {
            $dbName = trim($matches[1]);
        }
        if (preg_match('/DB_USERNAME=(.*)/', $envContent, $matches)) {
            $dbUser = trim($matches[1]);
        }
        if (preg_match('/DB_PASSWORD=(.*)/', $envContent, $matches)) {
            $dbPass = trim($matches[1]);
        }
    }

    // Try to connect and check system settings
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName}",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 2]
    );

    // Check if table exists first
    $tableExists = $pdo->query("SHOW TABLES LIKE 'system_settings'")->rowCount() > 0;

    if ($tableExists) {
        $stmt = $pdo->query("SELECT access FROM system_settings ORDER BY id DESC LIMIT 1");
        $systemSetting = $stmt->fetch(PDO::FETCH_ASSOC);
        $accessMode = $systemSetting ? $systemSetting['access'] : 'public';

        // Get client IP address with better detection
        $clientIP = 'unknown';
        $ipSources = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',            // Proxy
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        ];

        foreach ($ipSources as $source) {
            if (!empty($_SERVER[$source])) {
                $clientIP = $_SERVER[$source];
                break;
            }
        }

        // Handle comma-separated IPs (from proxies) - take the first one
        if (strpos($clientIP, ',') !== false) {
            $ips = explode(',', $clientIP);
            $clientIP = trim($ips[0]);
        }

        // Remove port if present
        if (strpos($clientIP, ':') !== false && substr_count($clientIP, ':') == 1) {
            $clientIP = explode(':', $clientIP)[0];
        }

        // Debug logging - write to a log file for debugging
        $debugLog = __DIR__.'/../storage/logs/ip_access.log';
        $logEntry = date('Y-m-d H:i:s') . " - Access Mode: {$accessMode}, Client IP: {$clientIP}" . PHP_EOL;
        if (is_writable(dirname($debugLog))) {
            file_put_contents($debugLog, $logEntry, FILE_APPEND | LOCK_EX);
        }

        // Check current request URI
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $isAdminBypassRoute = (
            strpos($requestUri, '/admin-bypass') === 0 ||
            strpos($requestUri, '/admin-bypass/') === 0
        );

        // If this is an admin bypass route, skip all IP checking and allow access
        if ($isAdminBypassRoute) {
            // Log bypass route access
            $debugLog = __DIR__.'/../storage/logs/ip_access.log';
            $logEntry = date('Y-m-d H:i:s') . " - ADMIN BYPASS ROUTE ACCESS: {$clientIP} -> {$requestUri}" . PHP_EOL;
            if (is_writable(dirname($debugLog))) {
                file_put_contents($debugLog, $logEntry, FILE_APPEND | LOCK_EX);
            }
            // Continue to Laravel without IP checking
        } else {
            // Determine if IP check is needed based on system mode or per-jadwal mode
            $needsIPCheck = false;
            $checkReason = '';

            // First check: if system is in global private mode
            if ($accessMode === 'private') {
                $needsIPCheck = true;
                $checkReason = 'System Global Private Mode';
            }

            // Second check: if this is a tes route, check jadwal-specific access mode
            if (preg_match('/\/peserta\/tes\/(\d+)\/soal/', $requestUri, $matches)) {
                $jadwalId = $matches[1];

                try {
                    // Check if jadwal table exists and get jadwal access_mode
                    $jadwalStmt = $pdo->prepare("SELECT access_mode FROM jadwal WHERE id = ? LIMIT 1");
                    $jadwalStmt->execute([$jadwalId]);
                    $jadwalData = $jadwalStmt->fetch(PDO::FETCH_ASSOC);

                    if ($jadwalData && $jadwalData['access_mode'] === 'offline') {
                        $needsIPCheck = true;
                        $checkReason = "Jadwal ID {$jadwalId} - Offline Mode";
                    } elseif ($jadwalData && $jadwalData['access_mode'] === 'online') {
                        // Override global private mode for this specific jadwal
                        $needsIPCheck = false;
                        $checkReason = "Jadwal ID {$jadwalId} - Online Mode (overrides global)";
                    }
                } catch (Exception $e) {
                    // If there's error checking jadwal, fall back to global system mode
                    $logEntry = date('Y-m-d H:i:s') . " - ERROR checking jadwal access_mode: " . $e->getMessage() . PHP_EOL;
                    if (is_writable(dirname(__DIR__.'/storage/logs/ip_access_error.log'))) {
                        file_put_contents(__DIR__.'/../storage/logs/ip_access_error.log', $logEntry, FILE_APPEND | LOCK_EX);
                    }
                }
            }

            // Log the decision
            $debugLog = __DIR__.'/../storage/logs/ip_access.log';
            $logEntry = date('Y-m-d H:i:s') . " - Access Check Decision: " . ($needsIPCheck ? 'REQUIRED' : 'SKIPPED') . " - Reason: {$checkReason} - URL: {$requestUri}" . PHP_EOL;
            if (is_writable(dirname($debugLog))) {
                file_put_contents($debugLog, $logEntry, FILE_APPEND | LOCK_EX);
            }

            // Only perform IP checking if needed
            if ($needsIPCheck) {
                // Check if admin bypass is active via database
                $isAdminLoggedIn = false;

                // Check for admin bypass cookie and validate against database
                if (isset($_COOKIE['admin_bypass_session'])) {
                    $sessionId = $_COOKIE['admin_bypass_session'];

                    try {
                        // Check if admin_bypass_sessions table exists
                        $tableExists = $pdo->query("SHOW TABLES LIKE 'admin_bypass_sessions'")->rowCount() > 0;

                        if ($tableExists) {
                            // Check database for valid bypass session
                            $stmt = $pdo->prepare("
                                SELECT COUNT(*) as count
                                FROM admin_bypass_sessions
                                WHERE session_id = ? AND expires_at > NOW()
                            ");
                            $stmt->execute([$sessionId]);
                            $result = $stmt->fetch(PDO::FETCH_ASSOC);

                            if ($result && $result['count'] > 0) {
                                $isAdminLoggedIn = true;
                            }
                        }
                    } catch (Exception $e) {
                        // If table doesn't exist or query fails, continue without bypass
                    }
                }

                $allowedIPs = array(
                    '::1','127.0.0.1',
                    '103.121.197.1','36.50.94.1','103.121.197.2','36.50.94.2','103.121.197.3','36.50.94.3',
                    '103.121.197.4','36.50.94.4','103.121.197.5','36.50.94.5','103.121.197.6','36.50.94.6',
                    '103.121.197.7','36.50.94.7','103.121.197.8','36.50.94.8','103.121.197.9','36.50.94.9',
                    '103.121.197.10','36.50.94.10','103.121.197.11','36.50.94.11','103.121.197.12','36.50.94.12',
                    '103.121.197.13','36.50.94.13','103.121.197.14','36.50.94.14','103.121.197.15','36.50.94.15',
                    '103.121.197.16','36.50.94.16','103.121.197.17','36.50.94.17','103.121.197.18','36.50.94.18',
                    '103.121.197.19','36.50.94.19','103.121.197.20','36.50.94.20','103.121.197.21','36.50.94.21',
                    '103.121.197.22','36.50.94.22','103.121.197.23','36.50.94.23','103.121.197.24','36.50.94.24',
                    '103.121.197.25','36.50.94.25','103.121.197.26','36.50.94.26','103.121.197.27','36.50.94.27',
                    '103.121.197.28','36.50.94.28','103.121.197.29','36.50.94.29','103.121.197.30','36.50.94.30',
                    '103.121.197.31','36.50.94.31','103.121.197.32','36.50.94.32','103.121.197.33','36.50.94.33',
                    '103.121.197.34','36.50.94.34','103.121.197.35','36.50.94.35','103.121.197.36','36.50.94.36',
                    '103.121.197.37','36.50.94.37','103.121.197.38','36.50.94.38','103.121.197.39','36.50.94.39',
                    '103.121.197.40','36.50.94.40','103.121.197.41','36.50.94.41','103.121.197.42','36.50.94.42',
                    '103.121.197.43','36.50.94.43','103.121.197.44','36.50.94.44','103.121.197.45','36.50.94.45',
                    '103.121.197.46','36.50.94.46','103.121.197.47','36.50.94.47','103.121.197.48','36.50.94.48',
                    '103.121.197.49','36.50.94.49','103.121.197.50','36.50.94.50','103.121.197.51','36.50.94.51',
                    '103.121.197.52','36.50.94.52','103.121.197.53','36.50.94.53','103.121.197.54','36.50.94.54',
                    '103.121.197.55','36.50.94.55','103.121.197.56','36.50.94.56','103.121.197.57','36.50.94.57',
                    '103.121.197.58','36.50.94.58','103.121.197.59','36.50.94.59','103.121.197.60','36.50.94.60',
                    '103.121.197.61','36.50.94.61','103.121.197.62','36.50.94.62','103.121.197.63','36.50.94.63',
                    '103.121.197.64','36.50.94.64','103.121.197.65','36.50.94.65','103.121.197.66','36.50.94.66',
                    '103.121.197.67','36.50.94.67','103.121.197.68','36.50.94.68','103.121.197.69','36.50.94.69',
                    '103.121.197.70','36.50.94.70','103.121.197.71','36.50.94.71','103.121.197.72','36.50.94.72',
                    '103.121.197.73','36.50.94.73','103.121.197.74','36.50.94.74','103.121.197.75','36.50.94.75',
                    '103.121.197.76','36.50.94.76','103.121.197.77','36.50.94.77','103.121.197.78','36.50.94.78',
                    '103.121.197.79','36.50.94.79','103.121.197.80','36.50.94.80','103.121.197.81','36.50.94.81',
                    '103.121.197.82','36.50.94.82','103.121.197.83','36.50.94.83','103.121.197.84','36.50.94.84',
                    '103.121.197.85','36.50.94.85','103.121.197.86','36.50.94.86','103.121.197.87','36.50.94.87',
                    '103.121.197.88','36.50.94.88','103.121.197.89','36.50.94.89','103.121.197.90','36.50.94.90',
                    '103.121.197.91','36.50.94.91','103.121.197.92','36.50.94.92','103.121.197.93','36.50.94.93',
                    '103.121.197.94','36.50.94.94','103.121.197.95','36.50.94.95','103.121.197.96','36.50.94.96',
                    '103.121.197.97','36.50.94.97','103.121.197.98','36.50.94.98','103.121.197.99','36.50.94.99',
                    '103.121.197.100','36.50.94.100','103.121.197.101','36.50.94.101','103.121.197.102','36.50.94.102',
                    '103.121.197.103','36.50.94.103','103.121.197.104','36.50.94.104','103.121.197.105','36.50.94.105',
                    '103.121.197.106','36.50.94.106','103.121.197.107','36.50.94.107','103.121.197.108','36.50.94.108',
                    '103.121.197.109','36.50.94.109','103.121.197.110','36.50.94.110','103.121.197.111','36.50.94.111',
                    '103.121.197.112','36.50.94.112','103.121.197.113','36.50.94.113','103.121.197.114','36.50.94.114',
                    '103.121.197.115','36.50.94.115','103.121.197.116','36.50.94.116','103.121.197.117','36.50.94.117',
                    '103.121.197.118','36.50.94.118','103.121.197.119','36.50.94.119','103.121.197.120','36.50.94.120',
                    '103.121.197.121','36.50.94.121','103.121.197.122','36.50.94.122','103.121.197.123','36.50.94.123',
                    '103.121.197.124','36.50.94.124','103.121.197.125','36.50.94.125','103.121.197.126','36.50.94.126',
                    '103.121.197.127','36.50.94.127','103.121.197.128','36.50.94.128','103.121.197.129','36.50.94.129',
                    '103.121.197.130','36.50.94.130','103.121.197.131','36.50.94.131','103.121.197.132','36.50.94.132',
                    '103.121.197.133','36.50.94.133','103.121.197.134','36.50.94.134','103.121.197.135','36.50.94.135',
                    '103.121.197.136','36.50.94.136','103.121.197.137','36.50.94.137','103.121.197.138','36.50.94.138',
                    '103.121.197.139','36.50.94.139','103.121.197.140','36.50.94.140','103.121.197.141','36.50.94.141',
                    '103.121.197.142','36.50.94.142','103.121.197.143','36.50.94.143','103.121.197.144','36.50.94.144',
                    '103.121.197.145','36.50.94.145','103.121.197.146','36.50.94.146','103.121.197.147','36.50.94.147',
                    '103.121.197.148','36.50.94.148','103.121.197.149','36.50.94.149','103.121.197.150','36.50.94.150',
                    '103.121.197.151','36.50.94.151','103.121.197.152','36.50.94.152','103.121.197.153','36.50.94.153',
                    '103.121.197.154','36.50.94.154','103.121.197.155','36.50.94.155','103.121.197.156','36.50.94.156',
                    '103.121.197.157','36.50.94.157','103.121.197.158','36.50.94.158','103.121.197.159','36.50.94.159',
                    '103.121.197.160','36.50.94.160','103.121.197.161','36.50.94.161','103.121.197.162','36.50.94.162',
                    '103.121.197.163','36.50.94.163','103.121.197.164','36.50.94.164','103.121.197.165','36.50.94.165',
                    '103.121.197.166','36.50.94.166','103.121.197.167','36.50.94.167','103.121.197.168','36.50.94.168',
                    '103.121.197.169','36.50.94.169','103.121.197.170','36.50.94.170','103.121.197.171','36.50.94.171',
                    '103.121.197.172','36.50.94.172','103.121.197.173','36.50.94.173','103.121.197.174','36.50.94.174',
                    '103.121.197.175','36.50.94.175','103.121.197.176','36.50.94.176','103.121.197.177','36.50.94.177',
                    '103.121.197.178','36.50.94.178','103.121.197.179','36.50.94.179','103.121.197.180','36.50.94.180',
                    '103.121.197.181','36.50.94.181','103.121.197.182','36.50.94.182','103.121.197.183','36.50.94.183',
                    '103.121.197.184','36.50.94.184','103.121.197.185','36.50.94.185','103.121.197.186','36.50.94.186',
                    '103.121.197.187','36.50.94.187','103.121.197.188','36.50.94.188','103.121.197.189','36.50.94.189',
                    '103.121.197.190','36.50.94.190','103.121.197.191','36.50.94.191','103.121.197.192','36.50.94.192',
                    '103.121.197.193','36.50.94.193','103.121.197.194','36.50.94.194','103.121.197.195','36.50.94.195',
                    '103.121.197.196','36.50.94.196','103.121.197.197','36.50.94.197','103.121.197.198','36.50.94.198',
                    '103.121.197.199','36.50.94.199','103.121.197.200','36.50.94.200','103.121.197.201','36.50.94.201',
                    '103.121.197.202','36.50.94.202','103.121.197.203','36.50.94.203','103.121.197.204','36.50.94.204',
                    '103.121.197.205','36.50.94.205','103.121.197.206','36.50.94.206','103.121.197.207','36.50.94.207',
                    '103.121.197.208','36.50.94.208','103.121.197.209','36.50.94.209','103.121.197.210','36.50.94.210',
                    '103.121.197.211','36.50.94.211','103.121.197.212','36.50.94.212','103.121.197.213','36.50.94.213',
                    '103.121.197.214','36.50.94.214','103.121.197.215','36.50.94.215','103.121.197.216','36.50.94.216',
                    '103.121.197.217','36.50.94.217','103.121.197.218','36.50.94.218','103.121.197.219','36.50.94.219',
                    '103.121.197.220','36.50.94.220','103.121.197.221','36.50.94.221','103.121.197.222','36.50.94.222',
                    '103.121.197.223','36.50.94.223','103.121.197.224','36.50.94.224','103.121.197.225','36.50.94.225',
                    '103.121.197.226','36.50.94.226','103.121.197.227','36.50.94.227','103.121.197.228','36.50.94.228',
                    '103.121.197.229','36.50.94.229','103.121.197.230','36.50.94.230','103.121.197.231','36.50.94.231',
                    '103.121.197.232','36.50.94.232','103.121.197.233','36.50.94.233','103.121.197.234','36.50.94.234',
                    '103.121.197.235','36.50.94.235','103.121.197.236','36.50.94.236','103.121.197.237','36.50.94.237',
                    '103.121.197.238','36.50.94.238','103.121.197.239','36.50.94.239','103.121.197.240','36.50.94.240',
                    '103.121.197.241','36.50.94.241','103.121.197.242','36.50.94.242','103.121.197.243','36.50.94.243',
                    '103.121.197.244','36.50.94.244','103.121.197.245','36.50.94.245','103.121.197.246','36.50.94.246',
                    '103.121.197.247','36.50.94.247','103.121.197.248','36.50.94.248','103.121.197.249','36.50.94.249',
                    '103.121.197.250','36.50.94.250','103.121.197.251','36.50.94.251','103.121.197.252','36.50.94.252',
                    '103.121.197.253','36.50.94.253','103.121.197.254','36.50.94.254'
                );

                // Log IP check result
                $isAllowed = in_array($clientIP, $allowedIPs) || $isAdminLoggedIn;
                $logEntry = date('Y-m-d H:i:s') . " - IP Check: {$clientIP} " . ($isAllowed ? 'ALLOWED' : 'DENIED') .
                           ($isAdminLoggedIn ? ' (ADMIN BYPASS)' : '') . " - Reason: {$checkReason}" . PHP_EOL;
                if (is_writable(dirname($debugLog))) {
                    file_put_contents($debugLog, $logEntry, FILE_APPEND | LOCK_EX);
                }

                // Check if client IP is allowed OR if admin bypass is active
                if (!$isAllowed) {
                    http_response_code(403);

                    // Determine if this is for a specific test or global system
                    $restrictionType = (strpos($checkReason, 'Jadwal ID') !== false) ? 'tes tertentu' : 'sistem';
                    $restrictionMessage = (strpos($checkReason, 'Jadwal ID') !== false)
                        ? 'Tes ini diatur untuk <strong>mode offline</strong> dan hanya dapat diakses dari jaringan universitas.'
                        : 'Sistem ini sedang dalam <strong>mode private</strong> dan hanya dapat diakses dari jaringan universitas.';

                    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Akses Ditolak</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #dc3545; margin-bottom: 20px; }
        p { color: #6c757d; line-height: 1.6; margin-bottom: 15px; }
        .ip-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .admin-info { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .test-info { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Akses Ditolak</h1>
        <p>' . $restrictionMessage . '</p>
        <p>Alamat IP Anda <strong>' . htmlspecialchars($clientIP) . '</strong> tidak memiliki izin untuk mengakses ' . $restrictionType . ' ini.</p>
        <div class="ip-info">
            <strong>IP Range yang Diizinkan:</strong><br>
            • 103.121.197.1 - 103.121.197.254<br>
            • 36.50.94.1 - 36.50.94.254
        </div>' .
        (strpos($checkReason, 'Jadwal ID') !== false ?
            '<div class="test-info">
                <strong>Informasi Tes:</strong><br>
                Tes ini dikonfigurasi untuk mode offline. Jika Anda perlu mengakses dari luar kampus,
                hubungi penyelenggara tes untuk mengubah ke mode online.
            </div>' : '') .
        '<div class="admin-info">
            <strong>Administrator?</strong><br>
            Jika Anda administrator sistem yang mencoba mengakses dari luar jaringan universitas,
            <a href="/admin-bypass" style="color: #0066cc; text-decoration: underline;">klik di sini untuk aktivasi admin bypass</a>.
        </div>
        <p>Silakan hubungi administrator sistem jika Anda yakin ini adalah kesalahan.</p>
    </div>
</body>
</html>';
                    exit;
                }
            } // End of IP checking
        } // End of access control check
    } // End of table exists check
} catch (Exception $e) {
    // Log the exception for debugging
    $errorLog = __DIR__.'/../storage/logs/ip_access_error.log';
    $logEntry = date('Y-m-d H:i:s') . " - ERROR: " . $e->getMessage() . PHP_EOL;
    if (is_writable(dirname($errorLog))) {
        file_put_contents($errorLog, $logEntry, FILE_APPEND | LOCK_EX);
    }
    // If there's any error accessing the database, default to public access
    // This ensures the system remains accessible during initial setup or database issues
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
