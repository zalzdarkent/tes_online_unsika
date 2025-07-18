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
                'id' => 1,
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'nama' => 'Admin Utama',
                'email' => 'admin@example.com',
                'foto' => null,
                'created_at' => '2025-02-16 17:38:01'
            ],
            [
                'id' => 4,
                'username' => 'jajam',
                'password' => Hash::make('jajam123'),
                'role' => 'admin',
                'nama' => 'jajam',
                'email' => 'jajam@gmail.com',
                'foto' => null,
                'created_at' => '2025-02-16 17:46:06'
            ],
            [
                'id' => 5,
                'username' => 'peserta',
                'password' => Hash::make('peserta123'),
                'role' => 'peserta',
                'nama' => 'brian',
                'email' => 'brian@gmail.com',
                'foto' => null,
                'created_at' => '2025-02-18 02:02:21'
            ],
            [
                'id' => 6,
                'username' => 'jojo',
                'password' => Hash::make('jojo123'),
                'role' => 'peserta',
                'nama' => 'jojo sumarjo',
                'email' => 'jojo.s@gmail.com',
                'foto' => null,
                'created_at' => '2025-02-23 04:30:48'
            ]
        ]);
    }
}
