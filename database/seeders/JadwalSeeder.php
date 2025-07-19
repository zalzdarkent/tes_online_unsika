<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JadwalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('jadwal')->insert([
            [
                'nama_jadwal' => 'Test s2',
                'tanggal_mulai' => '2025-02-22 23:06:00',
                'tanggal_berakhir' => '2025-03-07 23:06:00',
                'status' => 'Buka',
                'auto_close' => true,
                'id_jadwal_sebelumnya' => null
            ],
            [
                'nama_jadwal' => 'Test s2 2',
                'tanggal_mulai' => '2025-02-22 23:34:00',
                'tanggal_berakhir' => '2025-03-08 23:34:00',
                'status' => 'Buka',
                'auto_close' => true,
                'id_jadwal_sebelumnya' => 1  // Ini akan merujuk ke ID pertama yang auto-generated
            ],
            [
                'nama_jadwal' => 'Test s2 3',
                'tanggal_mulai' => '2025-02-22 23:35:00',
                'tanggal_berakhir' => '2025-03-08 23:35:00',
                'status' => 'Buka',
                'auto_close' => true,
                'id_jadwal_sebelumnya' => 2  // Ini akan merujuk ke ID kedua yang auto-generated
            ]
        ]);
    }
}
