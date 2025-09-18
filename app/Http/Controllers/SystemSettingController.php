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

        return Inertia::render('settings/SystemSettings', [
            'currentAccess' => $currentAccess,
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
