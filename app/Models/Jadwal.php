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
        'id_jadwal_sebelumnya',
    ];
    public function jadwal()
    {
        return $this->hasMany(Jadwal::class);
    }
}
