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

        // Stats Cards - berbeda berdasarkan role
        if ($user->role === 'teacher') {
            // Teacher hanya hitung peserta yang ikut tes mereka
            $totalPeserta = DB::table('jawaban')
                ->join('jadwal', 'jawaban.id_jadwal', '=', 'jadwal.id')
                ->where('jadwal.user_id', $user->id)
                ->distinct('jawaban.id_user')
                ->count();
        } else {
            // Admin hitung semua peserta
            $totalPeserta = User::where('role', 'peserta')->count();
        }
        
        $totalSoal = Soal::count();

        // Peserta online (tracking dari tabel sessions, last_activity dalam 5 menit terakhir)
        $fiveMinutesAgo = now()->subMinutes(5)->timestamp;
        if ($user->role === 'teacher') {
            // Teacher hanya hitung peserta online yang pernah ikut tes mereka
            $pesertaOnline = DB::table('sessions')
                ->join('users', 'sessions.user_id', '=', 'users.id')
                ->join('jawaban', 'users.id', '=', 'jawaban.id_user')
                ->join('jadwal', 'jawaban.id_jadwal', '=', 'jadwal.id')
                ->where('sessions.last_activity', '>=', $fiveMinutesAgo)
                ->whereNotNull('sessions.user_id')
                ->where('users.role', 'peserta')
                ->where('jadwal.user_id', $user->id)
                ->select('sessions.user_id')
                ->distinct()
                ->count();
        } else {
            // Admin hitung semua peserta online
            $pesertaOnline = DB::table('sessions')
                ->join('users', 'sessions.user_id', '=', 'users.id')
                ->where('last_activity', '>=', $fiveMinutesAgo)
                ->whereNotNull('sessions.user_id')
                ->where('users.role', 'peserta')
                ->select('sessions.user_id')
                ->distinct()
                ->count();
        }

        // Tes aktif (status Buka)
        if ($user->role === 'teacher') {
            // Teacher hanya hitung tes mereka yang aktif
            $tesAktif = Jadwal::where('status', 'Buka')
                ->where('user_id', $user->id)
                ->count();
        } else {
            // Admin hitung semua tes aktif
            $tesAktif = Jadwal::where('status', 'Buka')->count();
        }

        // Aktivitas terbaru - ambil 3 jadwal terbaru dengan informasi peserta
        $aktivitasQuery = Jadwal::with('kategori')
            ->select('id', 'nama_jadwal', 'tanggal_mulai', 'tanggal_berakhir', 'status', 'kategori_tes_id')
            ->orderBy('created_at', 'desc')
            ->limit(3);

        // Filter berdasarkan role
        if ($user->role === 'teacher') {
            $aktivitasQuery->where('user_id', $user->id);
        }

        $aktivitasTerbaru = $aktivitasQuery->get()
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
        if ($user->role === 'teacher') {
            // Teacher hanya hitung tes mereka
            $tesDimulaiHariIni = Jadwal::whereDate('tanggal_mulai', $today)
                ->where('user_id', $user->id)
                ->count();
            $tesSelesaiHariIni = Jadwal::whereDate('tanggal_berakhir', $today)
                ->where('user_id', $user->id)
                ->count();
            // Peserta baru yang ikut tes teacher hari ini
            $pesertaBaruHariIni = DB::table('jawaban')
                ->join('jadwal', 'jawaban.id_jadwal', '=', 'jadwal.id')
                ->join('users', 'jawaban.id_user', '=', 'users.id')
                ->where('jadwal.user_id', $user->id)
                ->whereDate('jawaban.created_at', $today)
                ->where('users.role', 'peserta')
                ->distinct('jawaban.id_user')
                ->count();
        } else {
            // Admin hitung semua
            $tesDimulaiHariIni = Jadwal::whereDate('tanggal_mulai', $today)->count();
            $tesSelesaiHariIni = Jadwal::whereDate('tanggal_berakhir', $today)->count();
            $pesertaBaruHariIni = User::where('role', 'peserta')
                ->whereDate('created_at', $today)
                ->count();
        }

        // Total login hari ini (simulasi berdasarkan updated_at)
        $totalLoginHariIni = User::whereDate('updated_at', $today)->count();

        // Growth calculation (bulan ini vs bulan lalu)
        if ($user->role === 'teacher') {
            // Teacher hitung growth peserta yang ikut tes mereka
            $pesertaBulanIni = DB::table('jawaban')
                ->join('jadwal', 'jawaban.id_jadwal', '=', 'jadwal.id')
                ->where('jadwal.user_id', $user->id)
                ->whereMonth('jawaban.created_at', $now->month)
                ->whereYear('jawaban.created_at', $now->year)
                ->distinct('jawaban.id_user')
                ->count();

            $pesertaBulanLalu = DB::table('jawaban')
                ->join('jadwal', 'jawaban.id_jadwal', '=', 'jadwal.id')
                ->where('jadwal.user_id', $user->id)
                ->whereMonth('jawaban.created_at', $now->copy()->subMonth()->month)
                ->whereYear('jawaban.created_at', $now->copy()->subMonth()->year)
                ->distinct('jawaban.id_user')
                ->count();
        } else {
            // Admin hitung growth semua peserta
            $pesertaBulanIni = User::where('role', 'peserta')
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->count();

            $pesertaBulanLalu = User::where('role', 'peserta')
                ->whereMonth('created_at', $now->copy()->subMonth()->month)
                ->whereYear('created_at', $now->copy()->subMonth()->year)
                ->count();
        }

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
