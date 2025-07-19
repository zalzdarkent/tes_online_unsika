<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JawabanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('jawaban')->insert([
            [
                'id_user' => 5,
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_soal' => 6,    // Soal ke-6 (yang pertanyaannya "1" untuk jadwal 2)
                'jawaban' => 'A',
                'created_at' => '2025-02-22 19:40:00'
            ],
            [
                'id_user' => 5,
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_soal' => 7,    // Soal ke-7 (yang pertanyaannya "akibat dari apakah pusing itu")
                'jawaban' => 'tidak punya duit',
                'created_at' => '2025-02-22 19:40:00'
            ],
            [
                'id_user' => 5,
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_soal' => 6,    // Soal ke-6 (yang pertanyaannya "1" untuk jadwal 2)
                'jawaban' => 'C',
                'created_at' => '2025-02-22 19:41:18'
            ],
            [
                'id_user' => 5,
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_soal' => 7,    // Soal ke-7 (yang pertanyaannya "akibat dari apakah pusing itu")
                'jawaban' => 'gak punya duit',
                'created_at' => '2025-02-22 19:41:18'
            ]
        ]);
    }
}
