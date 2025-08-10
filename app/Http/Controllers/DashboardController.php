<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Jadwal;
use App\Models\Soal;
use App\Models\Jawaban;
use App\Models\HasilTestPeserta;
use App\Models\KategoriTes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Auto-update expired jadwal status
        Jadwal::updateExpiredJadwalStatus();

        $today = Carbon::today();
        $now = Carbon::now();
        $user = Auth::user();

        // Stats Cards
        $totalPeserta = User::where('role', 'peserta')->count();
        $totalSoal = Soal::count();

        // Peserta online (tracking dari tabel sessions, last_activity dalam 5 menit terakhir)
        $fiveMinutesAgo = now()->subMinutes(5)->timestamp;
        $pesertaOnline = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->where('last_activity', '>=', $fiveMinutesAgo)
            ->whereNotNull('sessions.user_id')
            ->where('users.role', 'peserta')
            ->select('sessions.user_id')
            ->distinct()
            ->count();

        // Tes aktif (status Buka)
        $tesAktif = Jadwal::where('status', 'Buka')->count();

        // Aktivitas terbaru - ambil 3 jadwal terbaru dengan informasi peserta
        $aktivitasTerbaru = Jadwal::with('kategori')
            ->select('id', 'nama_jadwal', 'tanggal_mulai', 'tanggal_berakhir', 'status', 'kategori_tes_id')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($jadwal) use ($now) {
                // Hitung peserta yang sedang mengerjakan
                $pesertaSedangMengerjakan = Jawaban::where('id_jadwal', $jadwal->id)
                    ->whereDoesntHave('hasilTestPeserta')
                    ->distinct('id_user')
                    ->count();

                // Hitung total peserta terdaftar (yang pernah memulai tes)
                $totalPesertaTerdaftar = Jawaban::where('id_jadwal', $jadwal->id)
                    ->distinct('id_user')
                    ->count();

                // Tentukan status berdasarkan waktu
                $tanggalMulai = Carbon::parse($jadwal->tanggal_mulai);
                $tanggalBerakhir = Carbon::parse($jadwal->tanggal_berakhir);

                $statusAktivitas = 'Akan Datang';
                $deskripsi = "";

                if ($now->between($tanggalMulai, $tanggalBerakhir)) {
                    $statusAktivitas = 'Sedang Berlangsung';
                    $waktuMulai = $tanggalMulai->format('d M Y, H:i');
                    $waktuSelesai = $tanggalBerakhir->format('d M Y, H:i');
                    $deskripsi = "{$waktuMulai} - {$waktuSelesai}";
                } elseif ($now->gt($tanggalBerakhir)) {
                    $statusAktivitas = 'Selesai';
                    $waktuBerakhir = $tanggalBerakhir->format('d M Y, H:i');
                    $deskripsi = "Berakhir {$waktuBerakhir}";
                } else {
                    // Akan datang
                    $waktuMulai = $tanggalMulai->format('d M Y, H:i');
                    $deskripsi = "Dimulai {$waktuMulai}";
                }

                return [
                    'nama_jadwal' => $jadwal->nama_jadwal,
                    'deskripsi' => $deskripsi,
                    'status' => $statusAktivitas,
                    'kategori' => $jadwal->kategori ? $jadwal->kategori->nama : 'Umum'
                ];
            });

        // Ringkasan hari ini
        $tesDimulaiHariIni = Jadwal::whereDate('tanggal_mulai', $today)->count();
        $tesSelesaiHariIni = Jadwal::whereDate('tanggal_berakhir', $today)->count();
        $pesertaBaruHariIni = User::where('role', 'peserta')
            ->whereDate('created_at', $today)
            ->count();

        // Total login hari ini (simulasi berdasarkan updated_at)
        $totalLoginHariIni = User::whereDate('updated_at', $today)->count();

        // Growth calculation (bulan ini vs bulan lalu)
        $pesertaBulanIni = User::where('role', 'peserta')
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->count();

        $pesertaBulanLalu = User::where('role', 'peserta')
            ->whereMonth('created_at', $now->subMonth()->month)
            ->whereYear('created_at', $now->subMonth()->year)
            ->count();

        $growthPercentage = $pesertaBulanLalu > 0 ?
            round((($pesertaBulanIni - $pesertaBulanLalu) / $pesertaBulanLalu) * 100, 1) : 0;

        return Inertia::render('dashboard', [
            'stats' => [
                'total_peserta' => $totalPeserta,
                'peserta_online' => $pesertaOnline,
                'tes_aktif' => $tesAktif,
                'growth_percentage' => $growthPercentage
            ],
            'aktivitas_terbaru' => $aktivitasTerbaru,
            'ringkasan_hari_ini' => [
                'tes_dimulai' => $tesDimulaiHariIni,
                'tes_selesai' => $tesSelesaiHariIni,
                'peserta_baru' => $pesertaBaruHariIni,
                'total_login' => $totalLoginHariIni
            ]
        ]);
    }
}
