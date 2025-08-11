<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\KategoriTesController;
use App\Http\Controllers\KoreksiController;
use App\Http\Controllers\PesertaTesController;
use App\Http\Controllers\SoalController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Developer info page - accessible without authentication
Route::get('/dev', function () {
    return Inertia::render('dev');
})->name('dev');

// peserta routes
Route::middleware(['auth', 'role:peserta'])->group(function () {
    Route::get('/daftar-tes', [PesertaTesController::class, 'index'])->name('peserta.daftar-tes');
    // Route::post('/tes/soal', [PesertaTesController::class, 'startTest'])->name('peserta.soal');
    Route::post('/peserta/start', [PesertaTesController::class, 'startTest'])->name('peserta.start');
    Route::get('/tes/{id}/soal', [PesertaTesController::class, 'soal'])->name('peserta.soal');
    Route::post('/save', [PesertaTesController::class, 'saveAnswer'])->name('peserta.save');
    Route::post('/submit', [PesertaTesController::class, 'submit'])->name('peserta.submit');
    Route::get('/riwayat', [PesertaTesController::class, 'riwayat'])->name('peserta.riwayat');
});

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard route
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('home', [DashboardController::class, 'index'])->name('home'); // alias

    // PESERTA ROUTES
    Route::middleware(['role:peserta'])->prefix('peserta')->name('peserta.')->group(function () {
        Route::get('daftar-tes', [PesertaTesController::class, 'index'])->name('daftar-tes');
        Route::post('start', [PesertaTesController::class, 'startTest'])->name('start');
        Route::get('tes/{id}/soal', [PesertaTesController::class, 'soal'])->name('soal');
        Route::post('save-answer', [PesertaTesController::class, 'saveAnswer'])->name('save');
        Route::post('submit', [PesertaTesController::class, 'submit'])->name('submit');
        Route::get('riwayat', [PesertaTesController::class, 'riwayat'])->name('riwayat');
    });

    // ADMIN & TEACHER ROUTES
    Route::middleware(['role:admin,teacher'])->group(function () {

        // Kategori Tes Management
        Route::resource('kategori', KategoriTesController::class);
        Route::post('kategori/bulk-destroy', [KategoriTesController::class, 'bulkDestroy'])->name('kategori.bulk-destroy');

        // Jadwal Management
        Route::resource('jadwal', JadwalController::class);
        Route::get('jadwal/{jadwal}/soal', [JadwalController::class, 'soal'])->name('jadwal.soal');
        Route::post('jadwal/bulk-destroy', [JadwalController::class, 'bulkDestroy'])->name('jadwal.bulk-destroy');

        // Soal Management (nested under jadwal)
        Route::prefix('jadwal')->name('jadwal.soal.')->group(function () {
            Route::post('soal', [SoalController::class, 'store'])->name('store');
            Route::put('soal/{id}', [SoalController::class, 'update'])->name('update');
            Route::delete('soal/{id}', [SoalController::class, 'destroy'])->name('destroy');
            Route::post('soal/bulk-delete', [SoalController::class, 'bulkDelete'])->name('bulk-delete');
        });

        // Koreksi Management
        Route::prefix('koreksi')->name('koreksi')->group(function () {
            Route::get('/', [KoreksiController::class, 'index']);
            Route::get('{userId}/{jadwalId}', [KoreksiController::class, 'show'])->name('.detail');
            Route::post('{userId}/{jadwalId}', [KoreksiController::class, 'update'])->name('.update');
        });
    });

    // ADMIN ONLY ROUTES
    Route::middleware(['role:admin'])->group(function () {

        // Admin redirect
        Route::redirect('admin', 'users')->name('admin');

        // User Management
        Route::resource('users', UserController::class)->except(['show', 'create', 'edit']);
        Route::post('users/bulk-destroy', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
    });
});

// Include additional route files
require __DIR__ . '/auth.php';
require __DIR__ . '/settings.php';
