<?php

namespace App\Console\Commands;

use App\Models\AdminBypassSession;
use Illuminate\Console\Command;

class CleanupExpiredBypassSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bypass:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired admin bypass sessions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $deletedCount = AdminBypassSession::cleanupExpired();

        $this->info("Cleaned up {$deletedCount} expired admin bypass sessions.");

        return 0;
    }
}
