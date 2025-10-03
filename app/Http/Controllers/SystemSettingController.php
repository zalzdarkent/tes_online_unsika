<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemSettingController extends Controller
{
    /**
     * Display the system settings page.
     */
    public function index()
    {
        $currentAccess = SystemSetting::getCurrentAccess();
        
        // Check if admin bypass is currently active
        $adminBypassActive = session('admin_ip_bypass', false) && 
                           session('admin_bypass_timestamp', 0) > (time() - 24 * 60 * 60);

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
