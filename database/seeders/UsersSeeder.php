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
                'alamat' => 'Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta 10110',
                'no_hp' => '081234567890',
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
                'alamat' => 'Jl. Sudirman No. 456, Jakarta Selatan, DKI Jakarta 12190',
                'no_hp' => '082345678901',
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
                'alamat' => 'Jl. Karawang Barat No. 789, Karawang, Jawa Barat 41311',
                'no_hp' => '083456789012',
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
                'alamat' => 'Jl. Raya Unsika No. 321, Karawang, Jawa Barat 41361',
                'no_hp' => '084567890123',
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
                'alamat' => 'Jl. Ahmad Yani No. 654, Bandung, Jawa Barat 40132',
                'no_hp' => '085678901234',
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
                'alamat' => 'Jl. Diponegoro No. 987, Surabaya, Jawa Timur 60241',
                'no_hp' => '086789012345',
                'remember_token' => null,
                'created_at' => '2025-02-23 04:30:48',
                'updated_at' => '2025-02-23 04:30:48',
            ],
        ]);
    }
}
