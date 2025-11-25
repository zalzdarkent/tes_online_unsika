<?php

use App\Http\Controllers\AdminBypassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\JadwalPesertaController;
use App\Http\Controllers\KategoriTesController;
use App\Http\Controllers\KoreksiController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PesertaTesController;
use App\Http\Controllers\QuestionBankController;
use App\Http\Controllers\SoalController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ViolationController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Root route - redirect to dashboard if authenticated, otherwise to login
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('root');

// Developer info page - accessible without authentication
Route::get('/dev', function () {
    return Inertia::render('dev');
})->name('dev');

// Admin IP Bypass routes - accessible without normal authentication but requires special bypass
Route::prefix('admin-bypass')->name('admin.bypass.')->group(function () {
    Route::get('/', [AdminBypassController::class, 'showBypassForm'])->name('form');
    Route::post('activate', [AdminBypassController::class, 'handleBypass'])->name('handle');
    Route::post('deactivate', [AdminBypassController::class, 'deactivateBypass'])->name('deactivate');
});

// Protected routes - requires authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard routes
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('home', [DashboardController::class, 'index'])->name('home'); // alias

    // PESERTA ROUTES
    Route::middleware(['role:peserta'])->prefix('peserta')->name('peserta.')->group(function () {
        Route::get('daftar-tes', [PesertaTesController::class, 'index'])->name('daftar-tes');
        Route::post('start', [PesertaTesController::class, 'startTest'])->name('start');
        Route::get('tes/{id}/soal', [PesertaTesController::class, 'soal'])->name('soal');
        Route::post('save-answer', [PesertaTesController::class, 'saveAnswer'])->name('save');
        Route::post('submit', [PesertaTesController::class, 'submit'])->name('submit');
        Route::post('lanjutkan-tes', [PesertaTesController::class, 'lanjutkanTes'])->name('lanjutkan-tes');
        Route::get('riwayat', [PesertaTesController::class, 'riwayat'])->name('riwayat');

        // Violation reporting
        Route::post('report-violation', [ViolationController::class, 'reportViolation'])->name('report-violation');

        // Pendaftaran tes
        Route::post('daftar', [JadwalPesertaController::class, 'daftar'])->name('daftar');
    });

    // ADMIN & TEACHER ROUTES
    Route::middleware(['role:admin,teacher'])->group(function () {

        // Kategori Tes Management
        Route::resource('kategori', KategoriTesController::class);
        Route::post('kategori/bulk-destroy', [KategoriTesController::class, 'bulkDestroy'])
            ->name('kategori.bulk-destroy')
            ->middleware('bulk.throttle');

        // Bank Soal Management
        Route::resource('bank-soal', QuestionBankController::class);
        Route::post('bank-soal/bulk-destroy', [QuestionBankController::class, 'bulkDestroy'])
            ->name('bank-soal.bulk-destroy')
            ->middleware('bulk.throttle');

        // Jadwal Management
        Route::get('jadwal', [JadwalController::class, 'index'])->name('jadwal.index');
        Route::get('jadwal/create', [JadwalController::class, 'create'])->name('jadwal.create');
        Route::post('jadwal', [JadwalController::class, 'store'])->name('jadwal.store');
        Route::get('jadwal/{jadwal}', [JadwalController::class, 'show'])->name('jadwal.show');
        Route::get('jadwal/{jadwal}/edit', [JadwalController::class, 'edit'])->name('jadwal.edit');
        Route::put('jadwal/{jadwal}', [JadwalController::class, 'update'])->name('jadwal.update');
        Route::delete('jadwal/{jadwal}', [JadwalController::class, 'destroy'])->name('jadwal.destroy');
        Route::put('/jadwal/{jadwal}/shuffle', [JadwalController::class, 'shuffle'])->name('jadwal.shuffle');
        Route::put('/jadwal/{jadwal}/shuffle-answers', [JadwalController::class, 'shuffleAnswers'])->name('jadwal.shuffle-answers');


        Route::get('jadwal/{jadwal}/soal', [JadwalController::class, 'soal'])->name('jadwal.soal');
        Route::post('jadwal/bulk-destroy', [JadwalController::class, 'bulkDestroy'])
            ->name('jadwal.bulk-destroy')
            ->middleware('bulk.throttle');

        // Jadwal Peserta Management (untuk admin & teacher)
        Route::prefix('jadwal/{jadwal}')->name('jadwal.peserta.')->group(function () {
            Route::get('peserta', [JadwalPesertaController::class, 'index'])->name('index');
            Route::post('peserta/daftarkan', [JadwalPesertaController::class, 'daftarkanPeserta'])->name('daftarkan');
            Route::post('peserta/{registration}/approve', [JadwalPesertaController::class, 'approve'])->name('approve');
            Route::post('peserta/{registration}/reject', [JadwalPesertaController::class, 'reject'])->name('reject');
            Route::post('peserta/{registration}/izinkan-lanjut', [JadwalPesertaController::class, 'izinkanLanjut'])->name('izinkan-lanjut');
            Route::post('peserta/bulk-approve', [JadwalPesertaController::class, 'bulkApprove'])->name('bulk-approve');
            Route::post('peserta/bulk-reject', [JadwalPesertaController::class, 'bulkReject'])->name('bulk-reject');
            Route::post('peserta/bulk-delete', [JadwalPesertaController::class, 'bulkDelete'])->name('bulk-delete');
            Route::delete('peserta/{registration}', [JadwalPesertaController::class, 'destroy'])->name('destroy');

            // Violation reporting for admin
            Route::get('violations', [ViolationController::class, 'getJadwalViolations'])->name('violations');
        });

        // Violation management routes
        Route::prefix('violations')->name('violations.')->group(function () {
            Route::get('summary', [ViolationController::class, 'getViolationSummary'])->name('summary');
        });

        // Soal Management (nested under jadwal)
        Route::prefix('jadwal')->name('jadwal.soal.')->group(function () {
            Route::post('soal', [SoalController::class, 'store'])->name('store');
            Route::put('soal/{id}', [SoalController::class, 'update'])->name('update');
            Route::delete('soal/{id}', [SoalController::class, 'destroy'])->name('destroy');
            Route::post('soal/bulk-delete', [SoalController::class, 'bulkDelete'])
                ->name('bulk-delete')
                ->middleware('bulk.throttle');
        });

        // Soal Import Route
        Route::post('soal/import', [SoalController::class, 'import'])->name('soal.import');
        Route::get('template-soal', [SoalController::class, 'downloadTemplate'])->name('soal.template');

        // Koreksi Management
        Route::prefix('koreksi')->name('koreksi.')->group(function () {
            Route::get('/', [KoreksiController::class, 'index'])->name('index');
            Route::get('jadwal/{jadwalId}/peserta', [KoreksiController::class, 'peserta'])->name('peserta');
            Route::get('jadwal/{jadwalId}/statistik', [KoreksiController::class, 'statistik'])->name('statistik');
            Route::get('{userId}/{jadwalId}', [KoreksiController::class, 'show'])->name('detail');
            Route::post('{userId}/{jadwalId}', [KoreksiController::class, 'update'])->name('update');
            Route::delete('{userId}/{jadwalId}', [KoreksiController::class, 'destroy'])->name('destroy');
            Route::post('batch-submit', [KoreksiController::class, 'batchSubmit'])
                ->name('batch-submit')
                ->middleware('bulk.throttle');
            Route::post('bulk-destroy', [KoreksiController::class, 'bulkDestroy'])
                ->name('bulk-destroy')
                ->middleware('bulk.throttle');
        });
    });

    // ADMIN ONLY ROUTES
    Route::middleware(['role:admin'])->group(function () {

        // Admin redirect
        Route::redirect('admin', 'users')->name('admin');

        // User Management
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('users/bulk-destroy', [UserController::class, 'bulkDestroy'])
            ->name('users.bulk-destroy')
            ->middleware('bulk.throttle');
        Route::post('users/import', [UserController::class, 'import'])->name('users.import');
        Route::get('template-user', [UserController::class, 'downloadTemplate'])->name('users.template');
    });
});

// Include additional route files
require __DIR__ . '/auth.php';
require __DIR__ . '/settings.php';

// Catchall route for 404 - MUST be at the very end
Route::any('{catchall}', [PageController::class, 'notfound'])->where('catchall', '.*');
