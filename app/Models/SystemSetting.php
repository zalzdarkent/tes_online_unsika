<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'access',
    ];

    protected $casts = [
        'access' => 'string',
    ];

    // Constants for access types
    const ACCESS_PUBLIC = 'public';
    const ACCESS_PRIVATE = 'private';

    // Get current system access setting
    public static function getCurrentAccess()
    {
        $setting = self::first();
        return $setting ? $setting->access : self::ACCESS_PUBLIC;
    }

    // Update system access setting
    public static function updateAccess($access)
    {
        $setting = self::first();
        if ($setting) {
            $setting->update(['access' => $access]);
        } else {
            self::create(['access' => $access]);
        }
        return $setting;
    }
}
