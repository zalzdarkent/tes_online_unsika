<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\QuestionBank;
use App\Models\Soal;
use App\Models\Jadwal;

class UpdateSoalWithQuestionBankSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil beberapa question bank dan jadwal untuk demo
        $questionBanks = QuestionBank::limit(3)->get();
        $jadwals = Jadwal::limit(3)->get();

        if ($questionBanks->count() === 0 || $jadwals->count() === 0) {
            $this->command->info('No question banks or jadwals found. Please run other seeders first.');
            return;
        }

        // Create some sample soal that use question banks
        $soalData = [];

        foreach ($jadwals as $index => $jadwal) {
            $questionBank = $questionBanks[$index % $questionBanks->count()];

            // Buat 2-3 soal per jadwal yang menggunakan question bank
            for ($i = 1; $i <= 3; $i++) {
                $soalData[] = [
                    'id_jadwal' => $jadwal->id,
                    'question_bank_id' => $questionBank->id,
                    'urutan_soal' => $i,
                    'jenis_soal' => $questionBank->jenis_soal,
                    'tipe_jawaban' => $questionBank->tipe_jawaban ?? 'single_choice',
                    'pertanyaan' => $questionBank->pertanyaan,
                    'opsi_a' => $questionBank->opsi_a,
                    'opsi_b' => $questionBank->opsi_b,
                    'opsi_c' => $questionBank->opsi_c,
                    'opsi_d' => $questionBank->opsi_d,
                    'jawaban_benar' => $questionBank->jawaban_benar,
                    'media' => $questionBank->media,
                    'equation' => $questionBank->equation,
                    'skor' => $questionBank->skor,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Buat juga soal yang menggunakan question bank kedua
            if ($questionBanks->count() > 1) {
                $questionBank2 = $questionBanks[($index + 1) % $questionBanks->count()];
                $soalData[] = [
                    'id_jadwal' => $jadwal->id,
                    'question_bank_id' => $questionBank2->id,
                    'urutan_soal' => 4,
                    'jenis_soal' => $questionBank2->jenis_soal,
                    'tipe_jawaban' => $questionBank2->tipe_jawaban ?? 'single_choice',
                    'pertanyaan' => $questionBank2->pertanyaan,
                    'opsi_a' => $questionBank2->opsi_a,
                    'opsi_b' => $questionBank2->opsi_b,
                    'opsi_c' => $questionBank2->opsi_c,
                    'opsi_d' => $questionBank2->opsi_d,
                    'jawaban_benar' => $questionBank2->jawaban_benar,
                    'media' => $questionBank2->media,
                    'equation' => $questionBank2->equation,
                    'skor' => $questionBank2->skor,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert soal data
        Soal::insert($soalData);

        $this->command->info('Sample soal with question bank relationship created successfully.');
        $this->command->info('Total soal created: ' . count($soalData));
    }
}
