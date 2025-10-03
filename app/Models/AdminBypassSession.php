<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AdminBypassSession extends Model
{
    protected $fillable = [
        'session_id',
        'user_id',
        'ip_address',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime'
    ];

    /**
     * Check if a session ID has valid bypass access
     */
    public static function hasValidBypass($sessionId, $ipAddress = null)
    {
        $query = self::where('session_id', $sessionId)
                    ->where('expires_at', '>', now());

        if ($ipAddress) {
            $query->where('ip_address', $ipAddress);
        }

        return $query->exists();
    }

    /**
     * Create a new bypass session
     */
    public static function createBypass($userId, $sessionId, $ipAddress, $hours = 24)
    {
        // Clean up expired sessions first
        self::cleanupExpired();

        // Remove any existing bypass for this user
        self::where('user_id', $userId)->delete();

        return self::create([
            'session_id' => $sessionId,
            'user_id' => $userId,
            'ip_address' => $ipAddress,
            'expires_at' => now()->addHours($hours)
        ]);
    }

    /**
     * Clean up expired bypass sessions
     */
    public static function cleanupExpired()
    {
        return self::where('expires_at', '<', now())->delete();
    }

    /**
     * Deactivate bypass for user
     */
    public static function deactivateBypass($userId)
    {
        return self::where('user_id', $userId)->delete();
    }
}
