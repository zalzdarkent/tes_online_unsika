<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

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
                // Set bypass session
                Session::put('admin_ip_bypass', true);
                Session::put('admin_bypass_user_id', $user->id);
                Session::put('admin_bypass_timestamp', time());

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
        Session::forget('admin_ip_bypass');
        Session::forget('admin_bypass_user_id');
        Session::forget('admin_bypass_timestamp');

        return redirect()->route('login')->with('success', 'Admin bypass deactivated.');
    }
}
