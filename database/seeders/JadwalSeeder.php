<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class JadwalSeeder extends Seeder
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

        // Data jadwal untuk user pertama
        $firstUserId = $users->first()->id;

        DB::table('jadwal')->insert([
            [
                'nama_jadwal' => 'Test Online Semester 1',
                'tanggal_mulai' => '2025-02-22 08:00:00',
                'tanggal_berakhir' => '2025-02-22 10:00:00',
                'status' => 'Buka',
                'auto_close' => true,
                'user_id' => $firstUserId,
                'id_jadwal_sebelumnya' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_jadwal' => 'Test Online Semester 2',
                'tanggal_mulai' => '2025-02-25 08:00:00',
                'tanggal_berakhir' => '2025-02-25 10:00:00',
                'status' => 'Tutup',
                'auto_close' => true,
                'user_id' => $firstUserId,
                'id_jadwal_sebelumnya' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Jika ada user kedua, tambahkan data untuk user kedua
        if ($users->count() > 1) {
            $secondUserId = $users->skip(1)->first()->id;

            DB::table('jadwal')->insert([
                [
                    'nama_jadwal' => 'Ujian Tengah Semester',
                    'tanggal_mulai' => '2025-03-01 09:00:00',
                    'tanggal_berakhir' => '2025-03-01 11:00:00',
                    'status' => 'Buka',
                    'auto_close' => true,
                    'user_id' => $secondUserId,
                    'id_jadwal_sebelumnya' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'nama_jadwal' => 'Ujian Akhir Semester',
                    'tanggal_mulai' => '2025-03-15 09:00:00',
                    'tanggal_berakhir' => '2025-03-15 12:00:00',
                    'status' => 'Tutup',
                    'auto_close' => true,
                    'user_id' => $secondUserId,
                    'id_jadwal_sebelumnya' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        $this->command->info('Jadwal seeder completed with user-specific data.');
    }
}
