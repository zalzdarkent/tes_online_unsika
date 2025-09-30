<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Carbon\Carbon;

// Simulasi data seperti di database
$waktuMulaiStr = "2025-09-30 12:54:46";
$waktuTerputusStr = "2025-09-30 13:00:34";
$durasiMenit = 90;

echo "=== DEBUG PERHITUNGAN WAKTU ===\n";
echo "Waktu mulai tes: " . $waktuMulaiStr . "\n";
echo "Waktu terputus: " . $waktuTerputusStr . "\n";
echo "Durasi jadwal: " . $durasiMenit . " menit\n\n";

// Simulasi perhitungan submit yang SALAH (sebelum perbaikan)
$waktuMulai = Carbon::parse($waktuMulaiStr);
$waktuSekarang = Carbon::parse($waktuTerputusStr);
$waktuTerpakaiSalah = $waktuSekarang->diffInSeconds($waktuMulai);
$totalWaktu = $durasiMenit * 60;
$sisaWaktuSalah = max(0, $totalWaktu - $waktuTerpakaiSalah);

echo "=== PERHITUNGAN SALAH (SEBELUM PERBAIKAN) ===\n";
echo "Waktu terpakai (salah): " . $waktuTerpakaiSalah . " detik\n";
echo "Sisa waktu (salah): " . $sisaWaktuSalah . " detik\n";
echo "Sisa waktu (salah): " . ($sisaWaktuSalah/60) . " menit\n\n";

// Simulasi perhitungan submit yang BENAR (setelah perbaikan)
$waktuTerpakaiBenar = $waktuMulai->diffInSeconds($waktuSekarang);
$sisaWaktuBenar = max(0, $totalWaktu - $waktuTerpakaiBenar);

echo "=== PERHITUNGAN BENAR (SETELAH PERBAIKAN) ===\n";
echo "Waktu terpakai (benar): " . $waktuTerpakaiBenar . " detik\n";
echo "Sisa waktu (benar): " . $sisaWaktuBenar . " detik\n";
echo "Sisa waktu (benar): " . ($sisaWaktuBenar/60) . " menit\n\n";

echo "=== PERBANDINGAN ===\n";
echo "Selisih waktu terpakai: " . ($waktuTerpakaiBenar - $waktuTerpakaiSalah) . " detik\n";
echo "Selisih sisa waktu: " . ($sisaWaktuBenar - $sisaWaktuSalah) . " detik\n";