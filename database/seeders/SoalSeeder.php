<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SoalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
    DB::table('soal')->insert([
            [
                'id_soal' => 5,
                'id_jadwal' => 10,
                'jenis_soal' => 'pilihan_ganda',
                'pertanyaan' => '123',
                'opsi_a' => '1',
                'opsi_b' => '2',
                'opsi_c' => '3',
                'opsi_d' => '4',
                'jawaban_benar' => '',
                'skor' => 1
            ],
            [
                'id_soal' => 6,
                'id_jadwal' => 13,
                'jenis_soal' => 'esai',
                'pertanyaan' => 'asfdasf',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => '',
                'skor' => 1
            ],
            [
                'id_soal' => 7,
                'id_jadwal' => 13,
                'jenis_soal' => 'pilihan_ganda',
                'pertanyaan' => 'sdfadfsdf',
                'opsi_a' => '2',
                'opsi_b' => '3',
                'opsi_c' => '4',
                'opsi_d' => '5',
                'jawaban_benar' => '',
                'skor' => 1
            ],
            [
                'id_soal' => 8,
                'id_jadwal' => 10,
                'jenis_soal' => 'pilihan_ganda',
                'pertanyaan' => '1',
                'opsi_a' => '1',
                'opsi_b' => '2',
                'opsi_c' => '3',
                'opsi_d' => '4',
                'jawaban_benar' => 'A',
                'skor' => 1
            ],
            [
                'id_soal' => 9,
                'id_jadwal' => 10,
                'jenis_soal' => 'esai',
                'pertanyaan' => 'a',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => 'a',
                'skor' => 1
            ],
            [
                'id_soal' => 10,
                'id_jadwal' => 13,
                'jenis_soal' => 'pilihan_ganda',
                'pertanyaan' => '1',
                'opsi_a' => '1',
                'opsi_b' => '2',
                'opsi_c' => '3',
                'opsi_d' => '4',
                'jawaban_benar' => 'A',
                'skor' => 1
            ],
            [
                'id_soal' => 11,
                'id_jadwal' => 13,
                'jenis_soal' => 'esai',
                'pertanyaan' => 'akibat dari apakah pusing itu',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => 'gak punya duit',
                'skor' => 10
            ],
            [
                'id_soal' => 12,
                'id_jadwal' => 10,
                'jenis_soal' => 'esai',
                'pertanyaan' => 'Uang rupiah berasal dari negara?',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => 'Indonesia',
                'skor' => 10
            ],
            [
                'id_soal' => 13,
                'id_jadwal' => 10,
                'jenis_soal' => 'esai',
                'pertanyaan' => 'Dji SAm Soe adalah rokok jenia?',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => 'Kretek',
                'skor' => 10
            ],
            [
                'id_soal' => 14,
                'id_jadwal' => 10,
                'jenis_soal' => 'esai',
                'pertanyaan' => '1',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => '1',
                'skor' => 1
            ]
        ]);
    }
}
