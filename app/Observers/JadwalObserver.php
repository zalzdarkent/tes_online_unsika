<?php

namespace App\Observers;

use App\Models\Jadwal;

class JadwalObserver
{
    /**
     * Handle the Jadwal "created" event.
     */
    public function created(Jadwal $jadwal): void
    {
        //
    }

    /**
     * Handle the Jadwal "updated" event.
     */
    public function updated(Jadwal $jadwal): void
    {
        //
    }

    /**
     * Handle the Jadwal "deleted" event.
     */
    public function deleted(Jadwal $jadwal): void
    {
        //
    }

    /**
     * Handle the Jadwal "restored" event.
     */
    public function restored(Jadwal $jadwal): void
    {
        //
    }

    /**
     * Handle the Jadwal "force deleted" event.
     */
    public function forceDeleted(Jadwal $jadwal): void
    {
        //
    }
}
