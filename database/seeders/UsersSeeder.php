<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'email' => 'admin@example.com',
                'email_verified_at' => null,
                'username' => 'admin',
                'nama' => 'Admin Utama',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'foto' => null,
                'alamat' => null,
                'no_hp' => null,
                'remember_token' => null,
                'created_at' => '2025-02-16 17:38:01',
                'updated_at' => '2025-02-16 17:38:01',
            ],
            [
                'email' => 'jajam@gmail.com',
                'email_verified_at' => null,
                'username' => 'jajam',
                'nama' => 'jajam',
                'password' => Hash::make('jajam123'),
                'role' => 'admin',
                'foto' => null,
                'alamat' => null,
                'no_hp' => null,
                'remember_token' => null,
                'created_at' => '2025-02-16 17:46:06',
                'updated_at' => '2025-02-16 17:46:06',
            ],
            [
                'email' => 'alif@gmail.com',
                'email_verified_at' => null,
                'username' => 'alif',
                'nama' => 'alif',
                'password' => Hash::make('alif123'),
                'role' => 'teacher',
                'foto' => null,
                'alamat' => null,
                'no_hp' => null,
                'remember_token' => null,
                'created_at' => '2025-02-16 17:46:06',
                'updated_at' => '2025-02-16 17:46:06',
            ],
            [
                'email' => 'zalz@gmail.com',
                'email_verified_at' => null,
                'username' => 'zalz',
                'nama' => 'zalz',
                'password' => Hash::make('zalz123'),
                'role' => 'teacher',
                'foto' => null,
                'alamat' => null,
                'no_hp' => null,
                'remember_token' => null,
                'created_at' => '2025-02-16 17:46:06',
                'updated_at' => '2025-02-16 17:46:06',
            ],
            [
                'email' => 'brian@gmail.com',
                'email_verified_at' => null,
                'username' => 'peserta',
                'nama' => 'brian',
                'password' => Hash::make('peserta123'),
                'role' => 'peserta',
                'foto' => null,
                'alamat' => null,
                'no_hp' => null,
                'remember_token' => null,
                'created_at' => '2025-02-18 02:02:21',
                'updated_at' => '2025-02-18 02:02:21',
            ],
            [
                'email' => 'jojo.s@gmail.com',
                'email_verified_at' => null,
                'username' => 'jojo',
                'nama' => 'jojo sumarjo',
                'password' => Hash::make('jojo123'),
                'role' => 'peserta',
                'foto' => null,
                'alamat' => null,
                'no_hp' => null,
                'remember_token' => null,
                'created_at' => '2025-02-23 04:30:48',
                'updated_at' => '2025-02-23 04:30:48',
            ],
        ]);
    }
}
