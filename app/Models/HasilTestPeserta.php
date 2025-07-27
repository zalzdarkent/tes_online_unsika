<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilTestPeserta extends Model
{
    protected $table = 'hasil_test_peserta';

    protected $fillable = [
        'id_jadwal',
        'id_user',
        'id_soal',
        'jawaban',
        'jawaban_benar',
        'skor',
        'waktu_ujian',
    ];

    public $timestamps = false;
}
