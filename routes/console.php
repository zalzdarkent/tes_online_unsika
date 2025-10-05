<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule expired jadwal update every hour
Schedule::command('jadwal:update-expired')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Schedule session cleanup daily at 2 AM (untuk Cloudflare optimization)
Schedule::command('session:cleanup --hours=48')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground();
