<?php

use App\Http\Controllers\JadwalController;
use App\Http\Controllers\KategoriTesController;
use App\Http\Controllers\KoreksiController;
use App\Http\Controllers\SoalController;
use App\Http\Controllers\PesertaTesController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
    Route::get('/', [DashboardController::class, 'index'])->name('home');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Routes yang hanya bisa diakses admin dan teacher
    Route::middleware(['role:admin,teacher'])->group(function () {
        // Definisikan route spesifik sebelum resource route
        // Route::get('jadwal/kategori', function () {
        //     return Inertia::render('jadwal/kategori');
        // })->name('jadwal.kategori');
        Route::get('jadwal/{jadwal}/soal', [JadwalController::class, 'soal'])->name('jadwal.soal');

        // Resource route harus ditempatkan setelah route spesifik
        Route::resource('jadwal', JadwalController::class);
        Route::resource('kategori', KategoriTesController::class);
        Route::post('kategori/bulk-destroy', [KategoriTesController::class, 'bulkDestroy'])->name('kategori.bulk-destroy');
        Route::post('jadwal/soal', [SoalController::class, 'store'])->name('jadwal.soal.store');
        Route::post('jadwal/bulk-destroy', [JadwalController::class, 'bulkDestroy'])->name('jadwal.bulk-destroy');

        // Soal delete & bulk delete (dalam prefix /jadwal)
        Route::delete('jadwal/soal/{id}', [SoalController::class, 'destroy'])->name('soal.destroy');
        Route::post('jadwal/soal/bulk-delete', [SoalController::class, 'bulkDelete'])->name('soal.bulkDelete');

        Route::get('koreksi', [App\Http\Controllers\KoreksiController::class, 'index'])->name('koreksi');
        Route::get('koreksi/{userId}/{jadwalId}', [App\Http\Controllers\KoreksiController::class, 'show'])->name('koreksi.detail');
        Route::post('koreksi/{userId}/{jadwalId}', [App\Http\Controllers\KoreksiController::class, 'update'])->name('koreksi.update');
    });

    // Routes yang hanya bisa diakses admin
    Route::middleware(['role:admin'])->group(function () {
        Route::get('admin', function () {
            return Inertia::render('admin-panel');
        })->name('admin');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
