<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\KategoriTes;

class QuestionBankSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil beberapa user dan kategori untuk demo data
        $users = User::limit(3)->get();
        $kategoris = KategoriTes::limit(3)->get();

        if ($users->count() === 0) {
            $this->command->info('No users found. Please run UsersSeeder first.');
            return;
        }

        if ($kategoris->count() === 0) {
            $this->command->info('No categories found. Please run KategoriTesSeeder first.');
        }

        $questionBanks = [];

        // Sample questions untuk user pertama
        $firstUser = $users->first();
        $firstKategori = $kategoris->first();

        $questionBanks[] = [
            'title' => 'Soal Matematika Dasar - Penjumlahan',
            'pertanyaan' => 'Berapa hasil dari 15 + 27?',
            'jenis_soal' => 'pilihan_ganda',
            'tipe_jawaban' => 'single_choice',
            'opsi_a' => '40',
            'opsi_b' => '42',
            'opsi_c' => '43',
            'opsi_d' => '45',
            'jawaban_benar' => 'b',
            'equation' => null,
            'skor' => 10,
            'difficulty_level' => 'easy',
            'tags' => json_encode(['matematika', 'penjumlahan', 'dasar']),
            'is_public' => true,
            'usage_count' => 5,
            'user_id' => $firstUser->id,
            'kategori_tes_id' => $firstKategori?->id,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $questionBanks[] = [
            'title' => 'Essay - Sejarah Indonesia',
            'pertanyaan' => 'Jelaskan peran Sumpah Pemuda dalam perjuangan kemerdekaan Indonesia!',
            'jenis_soal' => 'esai',
            'tipe_jawaban' => 'essay',
            'opsi_a' => null,
            'opsi_b' => null,
            'opsi_c' => null,
            'opsi_d' => null,
            'jawaban_benar' => null,
            'equation' => null,
            'skor' => 20,
            'difficulty_level' => 'medium',
            'tags' => json_encode(['sejarah', 'indonesia', 'sumpah pemuda']),
            'is_public' => false,
            'usage_count' => 3,
            'user_id' => $firstUser->id,
            'kategori_tes_id' => $firstKategori?->id,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $questionBanks[] = [
            'title' => 'Soal Fisika - Hukum Newton',
            'pertanyaan' => 'Jika sebuah benda bermassa 5 kg bergerak dengan percepatan 2 m/s², berapa gaya yang bekerja pada benda tersebut?',
            'jenis_soal' => 'pilihan_ganda',
            'tipe_jawaban' => 'single_choice',
            'opsi_a' => '5 N',
            'opsi_b' => '10 N',
            'opsi_c' => '15 N',
            'opsi_d' => '20 N',
            'jawaban_benar' => 'b',
            'equation' => null,
            'skor' => 15,
            'difficulty_level' => 'medium',
            'tags' => json_encode(['fisika', 'hukum newton', 'gaya']),
            'is_public' => true,
            'usage_count' => 8,
            'user_id' => $firstUser->id,
            'kategori_tes_id' => $kategoris->skip(1)->first()?->id,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Sample questions untuk user kedua (jika ada)
        if ($users->count() > 1) {
            $secondUser = $users->skip(1)->first();

            $questionBanks[] = [
                'title' => 'Bahasa Inggris - Grammar',
                'pertanyaan' => 'Choose the correct sentence:',
                'jenis_soal' => 'pilihan_ganda',
                'tipe_jawaban' => 'single_choice',
                'opsi_a' => 'She have been studying',
                'opsi_b' => 'She has been studying',
                'opsi_c' => 'She have studying',
                'opsi_d' => 'She has studying',
                'jawaban_benar' => 'b',
                'equation' => null,
                'skor' => 10,
                'difficulty_level' => 'easy',
                'tags' => json_encode(['english', 'grammar', 'present perfect']),
                'is_public' => false,
                'usage_count' => 2,
                'user_id' => $secondUser->id,
                'kategori_tes_id' => $kategoris->last()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $questionBanks[] = [
                'title' => 'Multi Choice - Programming Concepts',
                'pertanyaan' => 'Which of the following are object-oriented programming principles? (Select all that apply)',
                'jenis_soal' => 'multi_choice',
                'tipe_jawaban' => 'multi_choice',
                'opsi_a' => 'Encapsulation',
                'opsi_b' => 'Inheritance',
                'opsi_c' => 'Polymorphism',
                'opsi_d' => 'Compilation',
                'jawaban_benar' => 'a,b,c',
                'equation' => null,
                'skor' => 25,
                'difficulty_level' => 'hard',
                'tags' => json_encode(['programming', 'oop', 'concepts']),
                'is_public' => true,
                'usage_count' => 12,
                'user_id' => $secondUser->id,
                'kategori_tes_id' => null, // No category
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Sample equation question
        if ($users->count() > 2) {
            $thirdUser = $users->skip(2)->first();

            $questionBanks[] = [
                'title' => 'Matematika Lanjut - Integral',
                'pertanyaan' => 'Hitunglah integral dari fungsi berikut:',
                'jenis_soal' => 'equation',
                'tipe_jawaban' => 'equation',
                'opsi_a' => null,
                'opsi_b' => null,
                'opsi_c' => null,
                'opsi_d' => null,
                'jawaban_benar' => '\\frac{x^3}{3} + C',
                'equation' => '\\int x^2 dx',
                'skor' => 30,
                'difficulty_level' => 'expert',
                'tags' => json_encode(['matematika', 'integral', 'kalkulus']),
                'is_public' => false,
                'usage_count' => 1,
                'user_id' => $thirdUser->id,
                'kategori_tes_id' => $firstKategori?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert ke database
        DB::table('question_banks')->insert($questionBanks);

        $this->command->info('Question bank seeder completed with ' . count($questionBanks) . ' sample questions.');
    }
}
