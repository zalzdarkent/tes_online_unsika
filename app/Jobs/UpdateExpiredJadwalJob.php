<?php

namespace App\Jobs;

use App\Models\Jadwal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateExpiredJadwalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;

    /**
     * Create a new job instance.
     */
    public function __construct($userId = null)
    {
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $now = \Carbon\Carbon::now();
            
            $query = Jadwal::where('status', 'Buka')
                ->where('tanggal_berakhir', '<', $now);
            
            // Jika userId diberikan, hanya update jadwal milik user tersebut
            if ($this->userId) {
                $query->where('user_id', $this->userId);
            }
            
            $expiredCount = $query->update(['status' => 'Tutup']);
            
            if ($expiredCount > 0) {
                Log::info("Background job: Updated {$expiredCount} expired jadwal" . 
                    ($this->userId ? " for user {$this->userId}" : ""));
            }
        } catch (\Exception $e) {
            Log::error("Failed to update expired jadwal: " . $e->getMessage());
        }
    }
}
