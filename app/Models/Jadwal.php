<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    protected $table = "jadwal";

    protected $fillable = [
        'nama_jadwal',
        'tanggal_mulai',
        'tanggal_berakhir',
        'status',
        'auto_close',
        'user_id',
        'id_jadwal_sebelumnya',
        'kategori_tes_id',
    ];

    protected $casts = [
        'auto_close' => 'boolean',
    ];

    /**
     * Relasi ke User (pemilik jadwal)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke jadwal sebelumnya
     */
    public function jadwalSebelumnya()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal_sebelumnya');
    }

    /**
     * Relasi ke jadwal yang mereferensikan jadwal ini sebagai jadwal sebelumnya
     */
    public function jadwalBerikutnya()
    {
        return $this->hasMany(Jadwal::class, 'id_jadwal_sebelumnya');
    }

    public function soal()
    {
        return $this->hasMany(\App\Models\Soal::class, 'id_jadwal');
    }

    /**
     * Relasi ke kategori tes
     */
    public function kategori()
    {
        return $this->belongsTo(KategoriTes::class, 'kategori_tes_id')->withTrashed();
    }
}
