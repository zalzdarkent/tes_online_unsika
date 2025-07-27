<?php

use App\Http\Controllers\JadwalController;
use App\Http\Controllers\KategoriTesController;
use App\Http\Controllers\SoalController;
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
        // Definisikan route spesifik sebelum resource route
        // Route::get('jadwal/kategori', function () {
        //     return Inertia::render('jadwal/kategori');
        // })->name('jadwal.kategori');
        Route::get('jadwal/{jadwal}/soal', [JadwalController::class, 'soal'])->name('jadwal.soal');

        // Resource route harus ditempatkan setelah route spesifik
        Route::resource('jadwal', JadwalController::class);
        Route::resource('kategori', KategoriTesController::class);
        Route::post('kategori/bulk-destroy', [KategoriTesController::class, 'bulkDestroy'])->name('kategori.bulk-destroy');
        Route::post('jadwal/soal', [SoalController::class,'store'])->name('jadwal.soal.store');
        Route::post('jadwal/bulk-destroy', [JadwalController::class, 'bulkDestroy'])->name('jadwal.bulk-destroy');

        // Soal delete & bulk delete (dalam prefix /jadwal)
        Route::delete('jadwal/soal/{id}', [SoalController::class, 'destroy'])->name('soal.destroy');
        Route::post('jadwal/soal/bulk-delete', [SoalController::class, 'bulkDelete'])->name('soal.bulkDelete');

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
