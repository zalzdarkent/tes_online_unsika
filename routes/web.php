<?php

use App\Http\Controllers\JadwalController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', function () {
        return Inertia::render('dashboard');
    })->name('home');

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Routes yang hanya bisa diakses admin dan teacher
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::resource('jadwal', JadwalController::class);
        Route::get('jadwal/{jadwal}/soal', [JadwalController::class, 'soal'])->name('jadwal.soal');
        Route::post('jadwal/bulk-destroy', [JadwalController::class, 'bulkDestroy'])->name('jadwal.bulk-destroy');

        Route::get('koreksi', function () {
            return Inertia::render('koreksi/koreksi');
        })->name('koreksi');
    });

    // Routes yang hanya bisa diakses admin
    Route::middleware(['role:admin'])->group(function () {
        Route::get('admin', function () {
            return Inertia::render('admin-panel');
        })->name('admin');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
