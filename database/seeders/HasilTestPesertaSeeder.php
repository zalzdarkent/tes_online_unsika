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
                'id_soal' => 4,    // Soal ke-4 (yang pertanyaannya "1" untuk jadwal 1, jawaban A)
                'jawaban' => 'A',
                'jawaban_benar' => 'A',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:36:46'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'id_soal' => 5,    // Soal ke-5 (yang pertanyaannya "a" untuk jadwal 1, jawaban a)
                'jawaban' => 'a',
                'jawaban_benar' => 'a',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:36:50'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'id_soal' => 8,    // Soal ke-8 (yang pertanyaannya "Uang rupiah berasal dari negara?")
                'jawaban' => 'Indonesia',
                'jawaban_benar' => 'Indonesia',
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:36:59'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'id_soal' => 9,    // Soal ke-9 (yang pertanyaannya "Dji SAm Soe adalah rokok jenia?")
                'jawaban' => 'Kretek',
                'jawaban_benar' => 'Kretek',
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:37:05'
            ],
            [
                'id_jadwal' => 1,  // Jadwal pertama (auto-generated ID = 1)
                'id_user' => 5,
                'id_soal' => 10,   // Soal ke-10 (yang pertanyaannya "1" esai untuk jadwal 1)
                'jawaban' => '1',
                'jawaban_benar' => '1',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:37:09'
            ],
            [
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_user' => 5,
                'id_soal' => 6,    // Soal ke-6 (yang pertanyaannya "1" untuk jadwal 2, jawaban A)
                'jawaban' => 'A',
                'jawaban_benar' => 'A',
                'skor' => 1,
                'waktu_ujian' => '2025-02-23 06:37:37'
            ],
            [
                'id_jadwal' => 2,  // Jadwal kedua (auto-generated ID = 2)
                'id_user' => 5,
                'id_soal' => 7,    // Soal ke-7 (yang pertanyaannya "akibat dari apakah pusing itu")
                'jawaban' => 'gak punya duit',
                'jawaban_benar' => 'gak punya duit',
                'skor' => 10,
                'waktu_ujian' => '2025-02-23 06:37:51'
            ]
        ]);
    }
}
