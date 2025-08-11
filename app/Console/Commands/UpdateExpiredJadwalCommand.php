<?php

namespace App\Console\Commands;

use App\Jobs\UpdateExpiredJadwalJob;
use Illuminate\Console\Command;

class UpdateExpiredJadwalCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jadwal:update-expired {--user-id= : Update untuk user ID tertentu saja}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update status jadwal yang sudah expired menjadi Tutup';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user-id');
        
        $this->info('Dispatching job to update expired jadwal...');
        
        UpdateExpiredJadwalJob::dispatch($userId);
        
        $this->info('Job dispatched successfully!');
        
        if ($userId) {
            $this->info("Updating expired jadwal for user ID: {$userId}");
        } else {
            $this->info('Updating all expired jadwal');
        }
        
        return Command::SUCCESS;
    }
}
