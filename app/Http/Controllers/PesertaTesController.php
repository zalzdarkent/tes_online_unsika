<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Jadwal;
use App\Models\HasilTestPeserta;
use App\Models\Soal;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;


class PesertaTesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Auto-update expired jadwal status setiap kali ada request
        Jadwal::updateExpiredJadwalStatus();

        $userId = Auth::id();
        $now = now();

        // Debug: Hitung total jadwal di database
        $totalJadwalInDB = Jadwal::count();

        // Debug: Hitung jadwal berdasarkan kondisi terpisah
        $jadwalStatusBuka = Jadwal::get()->filter(function ($item) use ($now) {
            $tanggalBerakhir = $item->tanggal_berakhir instanceof \Carbon\Carbon
                ? $item->tanggal_berakhir
                : \Carbon\Carbon::parse($item->tanggal_berakhir);
            return !$now->gt($tanggalBerakhir); // Status Buka jika belum melewati tanggal berakhir
        })->count();

        $jadwalBelumDikerjakan = Jadwal::whereDoesntHave('jawaban', function ($query) use ($userId) {
            $query->where('id_user', $userId);
        })->count();

        $jadwal = Jadwal::with('jadwalSebelumnya')
            // TIDAK ada filter user_id karena peserta harus bisa lihat semua jadwal tes
            // HAPUS filter tanggal mulai - tampilkan semua jadwal
            // ->where('tanggal_mulai', '<=', $now) // DIHAPUS
            // ->where('tanggal_berakhir', '>=', $now) // DIHAPUS - akan difilter di map()
            ->whereDoesntHave('jawaban', function ($query) use ($userId) {
                $query->where('id_user', $userId);
            })
            ->get()
            ->map(function ($item) use ($userId, $now) {
                // Hitung status seperti di JadwalController
                $tanggalBerakhir = $item->tanggal_berakhir instanceof \Carbon\Carbon
                    ? $item->tanggal_berakhir
                    : \Carbon\Carbon::parse($item->tanggal_berakhir);
                $status = ($now->gt($tanggalBerakhir)) ? 'Tutup' : 'Buka';

                // Hanya tampilkan yang statusnya Buka
                if ($status !== 'Buka') {
                    return null;
                }

                $item->status = $status;
                $item->sudah_kerjakan_jadwal_sebelumnya = true;
                if ($item->jadwalSebelumnya) {
                    $item->sudah_kerjakan_jadwal_sebelumnya = \App\Models\Jawaban::where('id_user', $userId)
                        ->where('id_jadwal', $item->jadwalSebelumnya->id)
                        ->exists();
                }
                return $item;
            })
            ->filter() // Hapus item yang null (status Tutup)
            ->values(); // Reset array keys setelah filter

        return Inertia::render('peserta/daftar-tes/index', [
            'jadwal' => $jadwal,
            'debug' => [
                'total_jadwal_in_db' => $totalJadwalInDB,
                'jadwal_status_buka' => $jadwalStatusBuka,
                'jadwal_belum_dikerjakan' => $jadwalBelumDikerjakan,
                'total_jadwal_found' => $jadwal->count(),
                'current_time' => $now->format('Y-m-d H:i:s'),
                'user_id' => $userId,
                'note' => 'Filter: Hanya tampilkan jadwal dengan status BUKA (tanggal_berakhir >= sekarang)',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    // track start time 
    public function startTest(Request $request)
    {
        $request->validate([
            'id_jadwal' => 'required|exists:jadwal,id',
        ]);

        try {
            $userId = Auth::id();
            $jadwalId = $request->id_jadwal;

            // Ambil jadwal dan soal
            $jadwal = Jadwal::with('soal')->findOrFail($jadwalId);

            // Cek apakah belum ada soal
            if ($jadwal->soal->isEmpty()) {
                return back()->withErrors([
                    'error' => 'Tes ini belum memiliki soal. Silakan hubungi penyelenggara.',
                ])->withInput();
            }

            // Buat entri hasil jika belum ada
            HasilTestPeserta::firstOrCreate(
                [
                    'id_user' => $userId,
                    'id_jadwal' => $jadwalId,
                ],
                [
                    'start_time' => now(),
                    'total_skor' => null,
                    'total_nilai' => null,
                ]
            );

            return back();
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat memulai tes. Silakan coba lagi.'
            ])->withInput();
        }
    }

    // get soal ujian
    public function soal($id)
    {
        try {
            $user = Auth::user();

            $schedule = Jadwal::with('soal')->findOrFail($id);

            // Cek apakah user sudah pernah mengerjakan
            $hasSubmitted = \App\Models\Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $schedule->id)
                ->exists();

            if ($hasSubmitted) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Anda tidak dapat mengerjakan tes lebih dari satu kali.'
                ]);
            }

            // Cek apakah tes sudah ditutup
            if (now()->gt(\Carbon\Carbon::parse($schedule->tanggal_berakhir))) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah ditutup.'
                ]);
            }

            // Cek apakah tes belum dimulai
            if (now()->lt(\Carbon\Carbon::parse($schedule->tanggal_mulai))) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum dimulai.'
                ]);
            }

            $result = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $schedule->id)
                ->first();

            if (!$result) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum dimulai atau belum dijadwalkan untuk Anda.'
                ]);
            }

            return Inertia::render('peserta/soal/index', [
                'jadwal' => $schedule,
                'soal' => $schedule->soal,
                'start_time' => $result->start_time,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat membuka halaman tes. Silakan coba lagi nanti.'
            ]);
        }
    }


    public function submit(Request $request)
    {
        $request->validate([
            'jadwal_id' => 'required|exists:jadwal,id',
        ]);

        $user = Auth::user();
        $jadwalId = $request->jadwal_id;
        $jawabanPeserta = $request->jawaban;


        try {
            $jadwal = \App\Models\Jadwal::findOrFail($jadwalId);
            $now = now();

            // Cek apakah tes sudah ditutup
            if ($now->gt(\Carbon\Carbon::parse($jadwal->tanggal_berakhir))) {
                return back()->withErrors([
                    'error' => 'Tes ini sudah ditutup dan tidak dapat lagi dijawab.'
                ])->withInput();
            }

            // Cek apakah sudah ada jawaban untuk jadwal ini
            if (
                \App\Models\Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->exists()
            ) {
                return back()->withErrors([
                    'error' => 'Tidak bisa mengerjakan tes lebih dari sekali.'
                ]);
            }

            DB::transaction(function () use ($jawabanPeserta, $jadwalId, $user) {
                foreach ($jawabanPeserta as $idSoal => $jawaban) {
                    $userAnswer = is_array($jawaban)
                        ? (count($jawaban) > 0 ? implode(',', $jawaban) : null)
                        : (trim($jawaban) !== '' ? $jawaban : null);

                    \App\Models\Jawaban::create([
                        'id_jadwal' => $jadwalId,
                        'id_user'   => $user->id,
                        'id_soal'   => $idSoal,
                        'jawaban'   => $userAnswer,
                    ]);
                }
            });

            return redirect()->route('peserta.riwayat')->with('success', 'Jawaban berhasil dikirim.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat menyimpan jawaban. Silakan coba lagi.'
            ])->withInput();
        }
    }

    public function riwayat()
    {
        try {
            $userId = Auth::id();

            $riwayat = \App\Models\HasilTestPeserta::where('id_user', $userId)
                ->with('jadwal')
                ->orderBy('created_at', 'desc')
                ->get();

            return Inertia::render('peserta/riwayat/index', [
                'riwayat' => $riwayat,
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Gagal memuat riwayat. Silakan coba lagi nanti.'
            ]);
        }
    }
}
