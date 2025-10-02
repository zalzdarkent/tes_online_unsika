<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DATA JADWAL_PESERTA ===" . PHP_EOL;
$data = DB::table('jadwal_peserta')
    ->join('jadwal', 'jadwal_peserta.id_jadwal', '=', 'jadwal.id')
    ->join('users as peserta', 'jadwal_peserta.id_peserta', '=', 'peserta.id')
    ->join('users as teacher', 'jadwal.user_id', '=', 'teacher.id')
    ->select('jadwal_peserta.*', 'jadwal.nama_jadwal', 'jadwal.user_id as teacher_id', 'teacher.nama as teacher_nama', 'peserta.nama as peserta_nama')
    ->get();

foreach($data as $row) {
    echo "Peserta: {$row->peserta_nama} | Tes: {$row->nama_jadwal} | Teacher: {$row->teacher_nama} | Status: {$row->status}" . PHP_EOL;
}

echo PHP_EOL . "=== TEACHER ID 3 (Ralifa) PESERTA COUNT ===" . PHP_EOL;
$count = DB::table('jadwal_peserta')
    ->join('jadwal', 'jadwal_peserta.id_jadwal', '=', 'jadwal.id')
    ->where('jadwal.user_id', 3)
    ->whereIn('jadwal_peserta.status', ['menunggu', 'disetujui'])
    ->distinct('jadwal_peserta.id_peserta')
    ->count();
echo "Count untuk teacher ID 3: {$count}" . PHP_EOL;

echo PHP_EOL . "=== SEMUA USER ===" . PHP_EOL;
$users = DB::table('users')->select('id', 'nama', 'role')->get();
foreach($users as $user) {
    echo "ID: {$user->id} | Nama: {$user->nama} | Role: {$user->role}" . PHP_EOL;
}
