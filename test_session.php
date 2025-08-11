<?php

// Test file untuk cek session database
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Simulate a simple request
$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

// Check database
$pdo = new PDO('sqlite:' . database_path('database.sqlite'));
$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'");
$table_exists = $stmt->fetch() !== false;

echo "Sessions table exists: " . ($table_exists ? "YES" : "NO") . "\n";

if ($table_exists) {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sessions");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Current sessions count: " . $result['count'] . "\n";

    $stmt = $pdo->query("SELECT id, user_id, ip_address, last_activity FROM sessions LIMIT 5");
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Recent sessions:\n";
    foreach ($sessions as $session) {
        echo "- ID: " . $session['id'] . ", User ID: " . ($session['user_id'] ?? 'NULL') . ", IP: " . ($session['ip_address'] ?? 'NULL') . ", Last Activity: " . date('Y-m-d H:i:s', $session['last_activity']) . "\n";
    }
}

$kernel->terminate($request, $response);
