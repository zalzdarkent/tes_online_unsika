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
        $jadwalStatusBuka = Jadwal::get()->filter(function($item) use ($now) {
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

    public function soal($id)
    {
        $jadwal = Jadwal::with('soal')->findOrFail($id);

        return Inertia::render('peserta/soal/index', [
            'jadwal' => $jadwal,
            'soal' => $jadwal->soal,
        ]);
    }

    public function submit(Request $request)
    {
        $request->validate([
            'jadwal_id' => 'required|exists:jadwal,id',
        ]);

        $user = Auth::user();
        $jadwalId = $request->jadwal_id;
        $jawabanPeserta = $request->jawaban;

        // Cek apakah sudah ada jawaban untuk jadwal ini
        if (
            \App\Models\Jawaban::where('id_user', $user->id)
            ->where('id_jadwal', $jadwalId)
            ->exists()
        ) {
            return response()->json([
                'error' => 'Tes sudah pernah dikerjakan.'
            ], 422);
        }

        DB::transaction(function () use ($jawabanPeserta, $jadwalId, $user) {
            foreach ($jawabanPeserta as $idSoal => $jawaban) {
                // Normalize jawaban jika array
                $userAnswer = is_array($jawaban) ? implode(',', $jawaban) : $jawaban;

                \App\Models\Jawaban::create([
                    'id_jadwal' => $jadwalId,
                    'id_user'   => $user->id,
                    'id_soal'   => $idSoal,
                    'jawaban'   => $userAnswer,
                ]);
            }
        });

        return redirect()->route('peserta.riwayat')->with('success', 'Jawaban berhasil dikirim.');
    }

    private function bandingkanJawaban($jawabanUser, $jawabanBenar)
    {
        // Normalize: hilangkan spasi, urutkan
        $normalize = fn($jawaban) => collect(explode(',', strtoupper(str_replace(' ', '', $jawaban))))
            ->sort()
            ->implode(',');

        return $normalize($jawabanUser) === $normalize($jawabanBenar);
    }

    public function riwayat()
    {
        $userId = Auth::id();

        $riwayat = \App\Models\Jawaban::select(
            'id_jadwal',
            DB::raw('MIN(created_at) as waktu_ujian') // Menggunakan waktu jawaban pertama sebagai waktu mengerjakan
        )
            ->where('id_user', $userId)
            ->with('jadwal') // Menggunakan relasi yang sudah didefinisikan di model Jawaban
            ->groupBy('id_jadwal')
            ->get();

        return Inertia::render('peserta/riwayat/index', [
            'riwayat' => $riwayat,
        ]);
    }
}
