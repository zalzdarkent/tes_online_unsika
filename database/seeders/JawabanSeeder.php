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
                'id_jawaban' => 1,
                'id_user' => 5,
                'id_jadwal' => 13,
                'id_soal' => 10,
                'jawaban' => 'A',
                'created_at' => '2025-02-22 19:40:00'
            ],
            [
                'id_jawaban' => 2,
                'id_user' => 5,
                'id_jadwal' => 13,
                'id_soal' => 11,
                'jawaban' => 'tidak punya duit',
                'created_at' => '2025-02-22 19:40:00'
            ],
            [
                'id_jawaban' => 3,
                'id_user' => 5,
                'id_jadwal' => 13,
                'id_soal' => 10,
                'jawaban' => 'C',
                'created_at' => '2025-02-22 19:41:18'
            ],
            [
                'id_jawaban' => 4,
                'id_user' => 5,
                'id_jadwal' => 13,
                'id_soal' => 11,
                'jawaban' => 'gak punya duit',
                'created_at' => '2025-02-22 19:41:18'
            ]
        ]);
    }
}
