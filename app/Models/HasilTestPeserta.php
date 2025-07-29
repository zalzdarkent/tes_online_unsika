<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilTestPeserta extends Model
{
    protected $table = 'hasil_test_peserta';

    protected $fillable = [
        'id_jawaban',
        'id_user',
        'total_skor',
        'waktu_ujian',
    ];


    public function jawaban()
    {
        return $this->belongsTo(Jawaban::class, 'id_jawaban');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
