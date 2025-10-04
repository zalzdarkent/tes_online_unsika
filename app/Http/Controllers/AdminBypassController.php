<?php

namespace App\Http\Controllers;

use App\Models\AdminBypassSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AdminBypassController extends Controller
{
    /**
     * Show admin bypass form
     */
    public function showBypassForm()
    {
        return view('auth.admin-bypass');
    }

    /**
     * Handle admin bypass request
     */
    public function handleBypass(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'bypass_code' => 'required'
        ]);

        // Check bypass code
        $validBypassCode = config('app.admin_bypass_code', 'unsika_admin_2024');

        if ($request->bypass_code !== $validBypassCode) {
            return back()->withErrors([
                'bypass_code' => 'Invalid bypass code.'
            ]);
        }

        // Attempt to authenticate admin
        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();

            // Check if user is admin
            if ($user->role === 'admin') {
                // Get client IP
                $clientIP = $this->getClientIP();

                // Generate unique session ID
                $sessionId = Str::random(40);

                // Create bypass session in database
                AdminBypassSession::createBypass($user->id, $sessionId, $clientIP);

                // Store session ID in cookie for future requests
                cookie()->queue('admin_bypass_session', $sessionId, 60 * 24); // 24 hours

                return redirect()->route('dashboard')->with('success', 'Admin bypass activated successfully.');
            } else {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Only administrators can use IP bypass.'
                ]);
            }
        }

        return back()->withErrors([
            'email' => 'Invalid credentials.'
        ]);
    }

    /**
     * Deactivate admin bypass
     */
    public function deactivateBypass()
    {
        if (Auth::check() && Auth::user()->role === 'admin') {
            AdminBypassSession::deactivateBypass(Auth::id());

            // Clear cookie
            cookie()->queue(cookie()->forget('admin_bypass_session'));
        }

        return redirect()->route('login')->with('success', 'Admin bypass deactivated.');
    }

    /**
     * Get client IP address
     */
    private function getClientIP()
    {
        $ipSources = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($ipSources as $source) {
            if (!empty($_SERVER[$source])) {
                $ip = $_SERVER[$source];
                // Handle comma-separated IPs
                if (strpos($ip, ',') !== false) {
                    $ips = explode(',', $ip);
                    $ip = trim($ips[0]);
                }
                return $ip;
            }
        }

        return 'unknown';
    }
}
