<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionBankPermission extends Model
{
    protected $table = 'question_bank_permissions';

    protected $fillable = [
        'question_bank_id',
        'owner_id',
        'requester_id',
        'permission_type',
        'status',
        'message',
        'approved_at',
        'expires_at'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    /**
     * Get the question bank
     */
    public function questionBank(): BelongsTo
    {
        return $this->belongsTo(QuestionBank::class);
    }

    /**
     * Get the owner of the question
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the requester/recipient
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Scope untuk permission yang pending
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope untuk permission yang active
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope untuk permission yang expired
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    /**
     * Check if permission is expired
     */
    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Approve permission
     */
    public function approve()
    {
        $this->update([
            'status' => 'active',
            'approved_at' => now()
        ]);
    }

    /**
     * Reject permission
     */
    public function reject()
    {
        $this->update(['status' => 'rejected']);
    }
}
