<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class SessionKeepAliveController extends Controller
{
    /**
     * Handle session keep-alive ping
     * Endpoint ini dipanggil secara berkala dari frontend untuk menjaga session tetap aktif
     * dan mencegah Cloudflare verification yang berulang kali
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function ping(Request $request): JsonResponse
    {
        try {
            // Validasi request
            $request->validate([
                'timestamp' => 'required|integer',
                'user_agent' => 'sometimes|string',
                'page_url' => 'sometimes|string|url'
            ]);

            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $user = Auth::user();
            $timestamp = $request->input('timestamp');
            $userAgent = $request->input('user_agent', $request->userAgent());
            $pageUrl = $request->input('page_url', $request->url());

            // Update user's last activity timestamp
            $user->update([
                'updated_at' => now()
            ]);

            // Regenerate session to extend lifetime
            Session::regenerate(false); // false = don't destroy old session data

            // Update session last activity
            Session::put('last_keep_alive', now()->timestamp);
            Session::put('keep_alive_count', Session::get('keep_alive_count', 0) + 1);

            // Log untuk debugging (hanya di development)
            if (app()->environment('local')) {
                Log::info('Session keep-alive ping', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'timestamp' => $timestamp,
                    'page_url' => $pageUrl,
                    'session_id' => Session::getId(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $userAgent
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Session keep-alive successful',
                'data' => [
                    'session_id' => Session::getId(),
                    'user_id' => $user->id,
                    'timestamp' => now()->timestamp,
                    'session_lifetime' => config('session.lifetime'),
                    'keep_alive_count' => Session::get('keep_alive_count', 1)
                ]
            ]);

        } catch (\Throwable $e) {
            Log::error('Session keep-alive error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Keep-alive ping failed',
                'error' => app()->environment('local') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get session information untuk debugging
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function info(Request $request): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => Session::getId(),
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'session_lifetime' => config('session.lifetime'),
                'session_driver' => config('session.driver'),
                'last_keep_alive' => Session::get('last_keep_alive'),
                'keep_alive_count' => Session::get('keep_alive_count', 0),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'current_time' => now()->timestamp,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'csrf_token' => csrf_token()
            ]
        ]);
    }

    /**
     * Test endpoint untuk cek apakah session masih aktif
     *
     * @return JsonResponse
     */
    public function test(): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Session not active',
                'authenticated' => false
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Session is active',
            'authenticated' => true,
            'user' => [
                'id' => Auth::id(),
                'email' => Auth::user()->email,
                'role' => Auth::user()->role
            ],
            'timestamp' => now()->timestamp
        ]);
    }
}
