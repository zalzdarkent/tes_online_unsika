<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilTestPeserta extends Model
{
    protected $table = 'hasil_test_peserta';

    protected $fillable = [
        'id_jadwal',
        'id_user',
        'total_skor',
        'total_nilai',
        'start_time',
        'status_koreksi',
        'is_submitted_test'
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
