<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HasilTestPesertaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('hasil_test_peserta')->insert([
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:36:46'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:36:50'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:36:59'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:37:05'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:37:09'
            ],
            [
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_user' => 5,
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:37:37'
            ],
            [
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_user' => 5,
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:37:51'
            ]
        ]);
    }
}
