<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriTes extends Model
{
    protected $table = 'kategori_tes';

    protected $fillable = [
        'kode_kategori',
        'nama',
        'user_id',
    ];

    /**
     * Get the user that owns the category
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all jadwal in this category
     */
    public function jadwal()
    {
        return $this->hasMany(Jadwal::class, 'kategori_tes_id');
    }

    /**
     * Scope untuk mengambil kategori milik user tertentu
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
