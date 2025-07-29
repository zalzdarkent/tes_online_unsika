<?php

namespace App\Providers;

use App\Models\Soal;
use App\Observers\SoalObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Soal::observe(SoalObserver::class);
    }
}
