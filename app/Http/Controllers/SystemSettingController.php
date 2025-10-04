<?php

namespace App\Http\Controllers;

use App\Models\AdminBypassSession;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SystemSettingController extends Controller
{
    /**
     * Display the system settings page.
     */
    public function index()
    {
        $currentAccess = SystemSetting::getCurrentAccess();

        // Check if admin bypass is currently active for current user
        $adminBypassActive = false;
        if (Auth::check() && Auth::user()->role === 'admin') {
            $sessionId = request()->cookie('admin_bypass_session');
            if ($sessionId) {
                $adminBypassActive = AdminBypassSession::hasValidBypass($sessionId);
            }
        }

        return Inertia::render('settings/SystemSettings', [
            'currentAccess' => $currentAccess,
            'adminBypassActive' => $adminBypassActive,
        ]);
    }

    /**
     * Update the system access setting.
     */
    public function updateAccess(Request $request)
    {
        $request->validate([
            'access' => 'required|in:public,private',
        ]);

        SystemSetting::updateAccess($request->access);

        return back()->with('success', 'System access setting updated successfully.');
    }
}
