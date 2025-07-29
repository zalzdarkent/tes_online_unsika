<?php

namespace App\Observers;

use App\Models\Soal;

class SoalObserver
{
    /**
     * Handle the Soal "deleted" event.
     */
    public function deleted(Soal $soal): void
    {
        $soal->deleteMedia();
    }

    /**
     * Handle the Soal "updated" event.
     */
    public function updated(Soal $soal): void
    {
        // If media has changed, delete the old media
        if ($soal->wasChanged('media')) {
            // Get the original media value before the update
            $oldMedia = $soal->getOriginal('media');
            if ($oldMedia) {
                $path = storage_path('app/public/' . $oldMedia);
                if (file_exists($path)) {
                    unlink($path);
                }
            }
        }
    }
}
