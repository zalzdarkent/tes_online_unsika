<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\SystemSettingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('settings/profile', [ProfileController::class, 'update'])->name('profile.update.post');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/academic', [ProfileController::class, 'academic'])->name('academic.edit');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // System Settings - Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::get('settings/system', [SystemSettingController::class, 'index'])->name('system.settings');
        Route::post('settings/system/update-access', [SystemSettingController::class, 'updateAccess'])->name('system.update-access');
    });
});
