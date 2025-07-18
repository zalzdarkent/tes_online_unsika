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
                'id_hasil' => 14,
                'id_jadwal' => 10,
                'id' => 5,
                'id_soal' => 8,
                'jawaban' => 'A',
                'jawaban_benar' => 'A',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:36:46'
            ],
            [
                'id_hasil' => 15,
                'id_jadwal' => 10,
                'id' => 5,
                'id_soal' => 9,
                'jawaban' => 'a',
                'jawaban_benar' => 'a',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:36:50'
            ],
            [
                'id_hasil' => 16,
                'id_jadwal' => 10,
                'id' => 5,
                'id_soal' => 12,
                'jawaban' => 'Indonesia',
                'jawaban_benar' => 'Indonesia',
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:36:59'
            ],
            [
                'id_hasil' => 17,
                'id_jadwal' => 10,
                'id' => 5,
                'id_soal' => 13,
                'jawaban' => 'Kretek',
                'jawaban_benar' => 'Kretek',
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:37:05'
            ],
            [
                'id_hasil' => 18,
                'id_jadwal' => 10,
                'id' => 5,
                'id_soal' => 14,
                'jawaban' => '1',
                'jawaban_benar' => '1',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:37:09'
            ],
            [
                'id_hasil' => 19,
                'id_jadwal' => 13,
                'id' => 5,
                'id_soal' => 10,
                'jawaban' => 'A',
                'jawaban_benar' => 'A',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:37:37'
            ],
            [
                'id_hasil' => 20,
                'id_jadwal' => 13,
                'id' => 5,
                'id_soal' => 11,
                'jawaban' => 'gak punya duit',
                'jawaban_benar' => 'gak punya duit',
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:37:51'
            ]
        ]);
    }
}
