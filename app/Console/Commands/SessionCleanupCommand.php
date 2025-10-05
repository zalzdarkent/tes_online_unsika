<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SessionCleanupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'session:cleanup
                            {--hours=24 : Hours to keep sessions (default: 24)}
                            {--dry-run : Show what would be deleted without actually deleting}
                            {--stats : Show session statistics}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired sessions and show session statistics for Cloudflare session optimization';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');
        $showStats = $this->option('stats');

        $this->info("🧹 Session Cleanup Tool for Cloudflare Optimization");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        if ($showStats) {
            $this->showSessionStatistics();
            return;
        }

        // Calculate cutoff timestamp
        $cutoffTime = now()->subHours($hours)->timestamp;
        $cutoffDate = now()->subHours($hours);

        $this->info("⏰ Cleaning sessions older than: {$cutoffDate->format('Y-m-d H:i:s')}");
        $this->info("🕐 Cutoff timestamp: {$cutoffTime}");

        // Count sessions to be deleted
        $expiredCount = DB::table('sessions')
            ->where('last_activity', '<', $cutoffTime)
            ->count();

        if ($expiredCount === 0) {
            $this->info("✅ No expired sessions found. All sessions are fresh!");
            return;
        }

        $this->warn("🗑️  Found {$expiredCount} expired sessions to clean up");

        if ($dryRun) {
            $this->info("🏃‍♂️ DRY RUN MODE - No sessions will be deleted");

            // Show sample expired sessions
            $sampleSessions = DB::table('sessions')
                ->where('last_activity', '<', $cutoffTime)
                ->limit(5)
                ->get(['id', 'user_id', 'last_activity', 'ip_address']);

            if ($sampleSessions->count() > 0) {
                $this->info("\n📋 Sample expired sessions:");
                $this->table(
                    ['Session ID', 'User ID', 'Last Activity', 'IP Address'],
                    $sampleSessions->map(function ($session) {
                        return [
                            substr($session->id, 0, 16) . '...',
                            $session->user_id ?? 'Guest',
                            date('Y-m-d H:i:s', $session->last_activity),
                            $session->ip_address ?? 'Unknown'
                        ];
                    })->toArray()
                );
            }

            $this->info("\n💡 To actually delete these sessions, run without --dry-run flag");
            return;
        }

        // Confirm deletion
        if (!$this->confirm("Are you sure you want to delete {$expiredCount} expired sessions?")) {
            $this->info("❌ Operation cancelled");
            return;
        }

        // Perform cleanup
        $this->info("🧹 Cleaning up expired sessions...");

        $deletedCount = DB::table('sessions')
            ->where('last_activity', '<', $cutoffTime)
            ->delete();

        $this->info("✅ Successfully deleted {$deletedCount} expired sessions");

        // Log the cleanup
        Log::info("Session cleanup completed", [
            'deleted_count' => $deletedCount,
            'cutoff_hours' => $hours,
            'cutoff_time' => $cutoffDate->toISOString()
        ]);

        // Show remaining session stats
        $this->info("\n📊 Remaining sessions:");
        $this->showSessionStatistics();
    }

    private function showSessionStatistics()
    {
        $this->info("\n📊 Session Statistics");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━");

        // Total sessions
        $totalSessions = DB::table('sessions')->count();
        $this->info("📈 Total active sessions: {$totalSessions}");

        // Sessions by user status
        $authenticatedSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->count();
        $guestSessions = $totalSessions - $authenticatedSessions;

        $this->info("👤 Authenticated sessions: {$authenticatedSessions}");
        $this->info("👥 Guest sessions: {$guestSessions}");

        // Sessions by age
        $now = now()->timestamp;
        $last1Hour = DB::table('sessions')
            ->where('last_activity', '>=', $now - 3600)
            ->count();
        $last24Hours = DB::table('sessions')
            ->where('last_activity', '>=', $now - 86400)
            ->count();
        $last7Days = DB::table('sessions')
            ->where('last_activity', '>=', $now - 604800)
            ->count();

        $this->info("\n⏱️  Sessions by activity:");
        $this->info("   Last 1 hour: {$last1Hour}");
        $this->info("   Last 24 hours: {$last24Hours}");
        $this->info("   Last 7 days: {$last7Days}");

        // Sessions with keep-alive data
        $keepAliveSessions = DB::table('sessions')
            ->where('payload', 'like', '%keep_alive_count%')
            ->count();

        $this->info("\n💓 Sessions with keep-alive activity: {$keepAliveSessions}");

        // Most active users
        $activeUsers = DB::table('sessions')
            ->select('user_id', DB::raw('COUNT(*) as session_count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderBy('session_count', 'desc')
            ->limit(5)
            ->get();

        if ($activeUsers->count() > 0) {
            $this->info("\n🏆 Top 5 users by session count:");
            foreach ($activeUsers as $user) {
                $userData = DB::table('users')->where('id', $user->user_id)->first();
                $userName = $userData ? $userData->nama : 'Unknown';
                $this->info("   User {$user->user_id} ({$userName}): {$user->session_count} sessions");
            }
        }

        // Session size analysis
        $avgSize = DB::table('sessions')
            ->selectRaw('AVG(LENGTH(payload)) as avg_size')
            ->first();

        if ($avgSize && $avgSize->avg_size) {
            $avgSizeKB = round($avgSize->avg_size / 1024, 2);
            $this->info("\n💾 Average session payload size: {$avgSizeKB} KB");
        }

        // Cloudflare optimization status
        $this->info("\n☁️  Cloudflare Optimization Status:");
        $this->info("   Session lifetime: " . config('session.lifetime') . " minutes");
        $this->info("   Session driver: " . config('session.driver'));
        $this->info("   Secure cookies: " . (config('session.secure') ? 'Yes' : 'No'));
        $this->info("   HTTP only: " . (config('session.http_only') ? 'Yes' : 'No'));
        $this->info("   Same site: " . config('session.same_site'));
    }
}
