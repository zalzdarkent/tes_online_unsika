<?php
// Debug script untuk cek IP detection
header('Content-Type: text/html; charset=UTF-8');

echo "<h2>IP Debug Information</h2>";

// Get all possible IP sources
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

echo "<h3>All IP Headers:</h3>";
echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
echo "<tr><th>Header</th><th>Value</th></tr>";

foreach ($ipSources as $source) {
    $value = $_SERVER[$source] ?? 'Not Set';
    echo "<tr><td>{$source}</td><td>{$value}</td></tr>";
}
echo "</table>";

// Determine the final IP
$clientIP = 'unknown';
foreach ($ipSources as $source) {
    if (!empty($_SERVER[$source])) {
        $clientIP = $_SERVER[$source];
        echo "<p><strong>Selected IP Source: {$source}</strong></p>";
        break;
    }
}

// Handle comma-separated IPs (from proxies) - take the first one
if (strpos($clientIP, ',') !== false) {
    $ips = explode(',', $clientIP);
    echo "<p>Multiple IPs found: " . implode(', ', $ips) . "</p>";
    $clientIP = trim($ips[0]);
    echo "<p>Using first IP: {$clientIP}</p>";
}

// Remove port if present
if (strpos($clientIP, ':') !== false && substr_count($clientIP, ':') == 1) {
    $parts = explode(':', $clientIP);
    echo "<p>IP with port found: {$clientIP}, removing port</p>";
    $clientIP = $parts[0];
}

echo "<h3>Final Detected IP: <span style='color: blue; font-size: 1.2em;'>{$clientIP}</span></h3>";

// Check if it's in allowed ranges
$allowedRanges = ['103.121.197', '36.50.94'];
$isInRange = false;

foreach ($allowedRanges as $range) {
    if (strpos($clientIP, $range) === 0) {
        $isInRange = true;
        echo "<p style='color: green;'>✓ IP is in allowed range: {$range}.x</p>";
        break;
    }
}

if (!$isInRange) {
    echo "<p style='color: red;'>✗ IP is NOT in allowed ranges</p>";
}

// Show all $_SERVER variables for debugging
echo "<h3>All $_SERVER Variables:</h3>";
echo "<textarea rows='20' cols='100'>";
foreach ($_SERVER as $key => $value) {
    echo $key . " = " . $value . "\n";
}
echo "</textarea>";

// Try database connection
echo "<h3>Database Connection Test:</h3>";
try {
    // Try to read .env file
    $envFile = __DIR__.'/../.env';
    if (file_exists($envFile)) {
        echo "<p>✓ .env file found</p>";
        $envContent = file_get_contents($envFile);

        // Extract database config
        $dbHost = 'localhost';
        $dbName = 'tes_online_unsika';
        $dbUser = 'root';
        $dbPass = '';

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

        echo "<p>DB Config: Host={$dbHost}, DB={$dbName}, User={$dbUser}</p>";

        // Try to connect
        $pdo = new PDO(
            "mysql:host={$dbHost};dbname={$dbName}",
            $dbUser,
            $dbPass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        echo "<p style='color: green;'>✓ Database connection successful</p>";

        // Check system_settings table
        $tableExists = $pdo->query("SHOW TABLES LIKE 'system_settings'")->rowCount() > 0;
        if ($tableExists) {
            echo "<p>✓ system_settings table exists</p>";

            $stmt = $pdo->query("SELECT * FROM system_settings ORDER BY id DESC LIMIT 1");
            $setting = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($setting) {
                echo "<p>Current setting: <strong>" . $setting['access'] . "</strong></p>";
                echo "<p>Full record: " . json_encode($setting) . "</p>";
            } else {
                echo "<p style='color: orange;'>⚠ No records in system_settings table</p>";
            }
        } else {
            echo "<p style='color: red;'>✗ system_settings table does not exist</p>";
        }

    } else {
        echo "<p style='color: orange;'>⚠ .env file not found, using defaults</p>";
    }

} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Database error: " . $e->getMessage() . "</p>";
}

?>
