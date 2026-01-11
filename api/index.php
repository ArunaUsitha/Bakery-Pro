<?php

use Illuminate\Http\Request;

// Register the Composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';

/*
|--------------------------------------------------------------------------
| Vercel Serverless Configuration
|--------------------------------------------------------------------------
| Vercel has a read-only filesystem. We must redirect all storage-related
| writes to the /tmp directory.
*/

if (isset($_SERVER['VERCEL_URL'])) {
    $app->useStoragePath('/tmp/storage');

    // Ensure necessary directories exist in /tmp
    $dirs = [
        '/tmp/storage/framework/views',
        '/tmp/storage/framework/cache',
        '/tmp/storage/framework/sessions',
        '/tmp/storage/logs',
    ];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// Handle the request
$app->handleRequest(Request::capture());
