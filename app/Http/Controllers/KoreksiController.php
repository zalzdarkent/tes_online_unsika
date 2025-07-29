<?php

namespace App\Http\Controllers;

use App\Models\Jawaban;
use App\Models\HasilTestPeserta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KoreksiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = Jawaban::select(
            'id_user',
            'id_jadwal',
            DB::raw('COUNT(DISTINCT id_soal) as total_soal'),
            DB::raw('MIN(created_at) as waktu_ujian')
        )
            ->with(['user:id,nama', 'jadwal:id,nama_jadwal'])
            ->groupBy('id_user', 'id_jadwal')
            ->get()
            ->map(function ($item) {
                return [
                    'id_user' => $item->id_user,
                    'id_jadwal' => $item->id_jadwal,
                    'nama_peserta' => $item->user->nama,
                    'nama_jadwal' => $item->jadwal->nama_jadwal,
                    'total_soal' => $item->total_soal,
                    'waktu_ujian' => $item->waktu_ujian,
                    // Ambil total skor dari hasil_test_peserta jika ada
                    'total_skor' => HasilTestPeserta::where('id_user', $item->id_user)
                        ->whereHas('jawaban', function($query) use ($item) {
                            $query->where('id_jadwal', $item->id_jadwal);
                        })
                        ->value('total_skor')
                ];
            });

        return Inertia::render('koreksi/koreksi', [
            'data' => $data
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
}
