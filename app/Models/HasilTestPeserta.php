<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilTestPeserta extends Model
{
    protected $table = 'hasil_test_peserta';

    protected $fillable = [
        'id_jadwal',
        'id_user',
        'jawaban_benar',
        'skor',
        'waktu_ujian',
        'total_nilai',
    ];

    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
