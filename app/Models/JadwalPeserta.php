<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JadwalPeserta extends Model
{
    protected $table = 'jadwal_peserta';

    protected $fillable = [
        'id_jadwal',
        'id_peserta',
        'status',
        'cara_daftar',
        'tanggal_daftar',
        'tanggal_approval',
        'approved_by',
        'keterangan'
    ];

    protected $casts = [
        'tanggal_daftar' => 'datetime',
        'tanggal_approval' => 'datetime',
    ];

    /**
     * Relasi ke jadwal
     */
    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal');
    }

    /**
     * Relasi ke peserta (user)
     */
    public function peserta(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_peserta');
    }

    /**
     * Relasi ke user yang approve
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope untuk status tertentu
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk jadwal tertentu
     */
    public function scopeJadwal($query, $jadwalId)
    {
        return $query->where('id_jadwal', $jadwalId);
    }

    /**
     * Scope untuk peserta tertentu
     */
    public function scopePeserta($query, $pesertaId)
    {
        return $query->where('id_peserta', $pesertaId);
    }
}
