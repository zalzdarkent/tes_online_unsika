<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Jadwal;
use App\Models\HasilTestPeserta;
use App\Models\Soal;
use Illuminate\Support\Facades\Auth;


class PesertaTesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $userId = auth()->id();

        $jadwal = Jadwal::with('jadwalSebelumnya')
            ->whereDate('tanggal_mulai', '<=', now())
            ->whereDate('tanggal_berakhir', '>=', now())
            ->whereDoesntHave('hasil', function ($query) use ($userId) {
                $query->where('id_user', $userId);
            })
            ->get()
            ->map(function ($item) use ($userId) {
                $item->sudah_kerjakan_jadwal_sebelumnya = true;
                if ($item->jadwalSebelumnya) {
                    $item->sudah_kerjakan_jadwal_sebelumnya = HasilTestPeserta::where('id_user', $userId)
                        ->where('id_jadwal', $item->jadwalSebelumnya->id)
                        ->exists();
                }
                return $item;
            });

        return Inertia::render('peserta/daftar-tes/index', [
            'jadwal' => $jadwal,
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

        $user = auth()->user();
        $jadwalId = $request->jadwal_id;
        $jawabanPeserta = $request->jawaban;

        if (
            HasilTestPeserta::where('id_user', $user->id)
            ->where('id_jadwal', $jadwalId)
            ->exists()
        ) {
            return response()->json([
                'error' => 'Tes sudah pernah dikerjakan.'
            ], 422);
        }

        DB::transaction(function () use ($jawabanPeserta, $jadwalId, $user) {
            foreach ($jawabanPeserta as $idSoal => $jawaban) {
                $soal = Soal::find($idSoal);
                $jawabanBenar = $soal->jawaban_benar;
                $skor = $soal->skor;

                // Normalize jawaban dan kunci untuk membandingkan
                $userAnswer = is_array($jawaban) ? implode(',', $jawaban) : $jawaban;

                $isCorrect = false;
                if ($jawabanBenar !== null) {
                    $isCorrect = $this->bandingkanJawaban($userAnswer, $jawabanBenar);
                }

                HasilTestPeserta::create([
                    'id_jadwal'     => $jadwalId,
                    'id_user'       => $user->id,
                    'id_soal'       => $idSoal,
                    'jawaban'       => $userAnswer,
                    'waktu_ujian'   => now(),
                    'jawaban_benar' => $jawabanBenar,
                    'skor'          => $isCorrect ? $skor : 0
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
        $userId = auth()->id();

        $riwayat = HasilTestPeserta::select(
            'id_jadwal',
            DB::raw('MAX(waktu_ujian) as waktu_ujian'),
            DB::raw('SUM(skor) as total_skor')
        )
            ->where('id_user', $userId)
            ->with('jadwal')
            ->groupBy('id_jadwal')
            ->get();

        return Inertia::render('peserta/riwayat/index', [
            'riwayat' => $riwayat,
        ]);
    }
}
