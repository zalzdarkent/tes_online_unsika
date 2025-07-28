<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    protected $table = 'soal';

    protected $fillable = [
        'id_jadwal',
        'jenis_soal',
        'pertanyaan',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'jawaban_benar',
        'media',
        'skala_min',
        'skala_maks',
        'skala_label_min',
        'skala_label_maks',
        'equation',
        'skor'
    ];

    public function jadwal()
    {
        return $this->belongsTo('App\Models\Jadwal', 'id_jadwal');
    }

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'user_id');
    }
}
