<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Jadwal;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class UpdateJadwalStatusJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        // Job ini tidak memerlukan parameter
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Starting jadwal status update job...');

        $now = Carbon::now();

        // Cari jadwal yang statusnya masih "Buka" tapi sudah melewati tanggal berakhir
        $jadwalToUpdate = Jadwal::where('status', 'Buka')
            ->where('tanggal_berakhir', '<', $now)
            ->get();

        if ($jadwalToUpdate->isEmpty()) {
            Log::info('No jadwal found that needs status update.');
            return;
        }

        $updatedCount = 0;

        foreach ($jadwalToUpdate as $jadwal) {
            try {
                $jadwal->update(['status' => 'Tutup']);
                $updatedCount++;

                Log::info("Jadwal '{$jadwal->nama_jadwal}' (ID: {$jadwal->id}) status updated to Tutup");
            } catch (\Exception $e) {
                Log::error("Failed to update jadwal '{$jadwal->nama_jadwal}' (ID: {$jadwal->id}): " . $e->getMessage());
            }
        }

        Log::info("Jadwal status update completed! {$updatedCount} jadwal updated from {$jadwalToUpdate->count()} found.");
    }
}
