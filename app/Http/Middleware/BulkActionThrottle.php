<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class BulkActionThrottle
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Apply rate limiting untuk bulk actions
        $key = 'bulk_action_' . ($request->user()?->id ?? $request->ip());
        
        if (RateLimiter::tooManyAttempts($key, 10)) { // 10 attempts per minute
            return response()->json([
                'error' => 'Terlalu banyak permintaan bulk action. Silakan tunggu sebentar.'
            ], 429);
        }

        RateLimiter::hit($key, 60); // 60 seconds decay

        return $next($request);
    }
}
