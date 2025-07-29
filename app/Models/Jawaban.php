<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jawaban extends Model
{
    protected $table = "jawaban";
    const UPDATED_AT = null; // Beritahu Laravel bahwa kita tidak menggunakan updated_at
    protected $fillable = [
        'id_user',
        'id_jadwal',
        'id_soal',
        'jawaban',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal');
    }

    public function soal()
    {
        return $this->belongsTo(Soal::class, 'id_soal');
    }

    public function hasilTestPeserta()
    {
        return $this->hasOne(HasilTestPeserta::class, 'id_jadwal', 'id_jadwal')
            ->where('id_user', $this->id_user);
    }
}
