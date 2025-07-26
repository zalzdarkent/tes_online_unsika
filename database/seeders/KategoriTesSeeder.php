<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class KategoriTesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil beberapa user untuk demo data
        $users = User::limit(3)->get();

        if ($users->count() === 0) {
            $this->command->info('No users found. Please run UsersSeeder first.');
            return;
        }

        // Data kategori untuk user pertama
        $firstUserId = $users->first()->id;

        DB::table('kategori_tes')->insert([
            [
                'nama' => 'Ujian Semester',
                'user_id' => $firstUserId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Kuis',
                'user_id' => $firstUserId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Jika ada user kedua, tambahkan data untuk user kedua
        if ($users->count() > 1) {
            $secondUserId = $users->skip(1)->first()->id;

            DB::table('kategori_tes')->insert([
                [
                    'nama' => 'UTS',
                    'user_id' => $secondUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'nama' => 'UAS',
                    'user_id' => $secondUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // Jika ada user ketiga, tambahkan data untuk user ketiga
        if ($users->count() > 2) {
            $thirdUserId = $users->skip(2)->first()->id;

            DB::table('kategori_tes')->insert([
                [
                    'nama' => 'Tryout',
                    'user_id' => $thirdUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'nama' => 'Simulasi',
                    'user_id' => $thirdUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        $this->command->info('Kategori tes seeder completed with user-specific data.');
    }
}
