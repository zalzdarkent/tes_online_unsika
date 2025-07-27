<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Jadwal;
use App\Models\HasilTestPeserta;
use Illuminate\Support\Facades\Auth;


class PesertaTesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $jadwal = Jadwal::with('jadwalSebelumnya')
            ->whereDate('tanggal_mulai', '<=', now())
            ->whereDate('tanggal_berakhir', '>=', now())
            ->whereDoesntHave('hasil', function ($query) {
                $query->where('id_user', auth()->id());
            })
            ->get();


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
            return redirect()->route('peserta.riwayat')->with('info', 'Tes sudah pernah dikerjakan.');
        }

        DB::transaction(function () use ($jawabanPeserta, $jadwalId, $user) {
            foreach ($jawabanPeserta as $idSoal => $jawaban) {
                HasilTestPeserta::create([
                    'id_jadwal' => $jadwalId,
                    'id_user' => $user->id,
                    'id_soal' => $idSoal,
                    'jawaban' => is_array($jawaban) ? implode(',', $jawaban) : $jawaban,
                    'waktu_ujian' => now(),
                ]);
            }
        });
        return redirect()->route('peserta.riwayat')->with('success', 'Jawaban berhasil dikirim.');
    }
}
