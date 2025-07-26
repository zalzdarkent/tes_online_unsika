<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriTes extends Model
{
    protected $table = 'kategori_tes';

    protected $fillable = [
        'nama',
    ];

    public function jadwals()
    {
        return $this->hasMany(Jadwal::class, 'kategori_tes_id');
    }
}
