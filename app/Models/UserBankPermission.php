<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBankPermission extends Model
{
    protected $fillable = [
        'owner_id',
        'grantee_id',
        'can_view',
        'can_copy',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_copy' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function grantee()
    {
        return $this->belongsTo(User::class, 'grantee_id');
    }
}
