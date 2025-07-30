<?php

namespace App\Http\Controllers;

use App\Models\Jawaban;
use App\Models\HasilTestPeserta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                        ->where('id_jadwal', $item->id_jadwal)
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
    public function show(string $userId, string $jadwalId)
    {
        $query = Jawaban::where('id_user', $userId)
            ->where('id_jadwal', $jadwalId)
            ->with(['soal', 'user', 'jadwal']);

        // Get first record for user and jadwal info
        $firstRecord = $query->first();

        // Jika tidak ada data jawaban, redirect ke halaman sebelumnya dengan pesan error
        if (!$firstRecord) {
            return back()->with('error', 'Data jawaban tidak ditemukan');
        }

        // Pastikan relasi user dan jadwal ada
        if (!$firstRecord->user || !$firstRecord->jadwal) {
            return back()->with('error', 'Data peserta atau jadwal tidak lengkap');
        }

        $peserta = $firstRecord->user;
        $jadwal = $firstRecord->jadwal;

        // Get all jawaban and map them
        // Cek apakah sudah ada hasil koreksi
        $hasilKoreksi = HasilTestPeserta::where('id_user', $userId)
            ->where('id_jadwal', $jadwalId)
            ->first();

        $jawaban = $query->get()
            ->map(function ($item) use ($hasilKoreksi) {
                // Pastikan relasi soal ada
                if (!$item->soal) {
                    return null;
                }

                return [
                    'id' => $item->id,
                    'jenis_soal' => $item->soal->jenis_soal,
                    'pertanyaan' => $item->soal->pertanyaan,
                    'jawaban_benar' => $item->soal->jawaban_benar,
                    'jawaban_peserta' => $item->jawaban,
                    'skor_maksimal' => $item->soal->skor,
                    'skor_didapat' => $hasilKoreksi ? $hasilKoreksi->total_skor : null
                ];
            })
            ->filter() // Hapus item yang null
            ->values(); // Reset array keys

        return Inertia::render('koreksi/detail-koreksi', [
            'data' => $jawaban,
            'peserta' => [
                'nama' => $peserta->nama,
                'jadwal' => $jadwal->nama_jadwal
            ]
        ]);
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
    public function update(Request $request, string $userId, string $jadwalId)
    {
        // Debug semua request yang masuk
        // dd([
        //     'request_all' => $request->all(),
        //     'skor_data' => $request->skor_data,
        //     'total_nilai' => $request->total_nilai,
        //     'userId' => $userId,
        //     'jadwalId' => $jadwalId,
        //     'data_yang_akan_disimpan' => collect($request->skor_data)->map(function($data) use ($userId, $request, $jadwalId) {
        //         return [
        //             'id_jawaban' => $data['id'],
        //             'id_user' => $userId,
        //             'total_skor' => $data['skor_didapat'],
        //             'total_nilai' => $request->total_nilai,
        //             // waktu_ujian akan diambil dari jawaban
        //         ];
        //     })->toArray()
        // ]);

        try {
            DB::beginTransaction();

            // Hapus hasil tes yang mungkin sudah ada sebelumnya
            // HasilTestPeserta::where('id_user', $userId)
            //     ->where('id_jadwal', $jadwalId)
            //     ->delete();

            // Simpan hasil tes baru
            $jawaban = Jawaban::where('id_user', $userId)
                ->where('id_jadwal', $jadwalId)
                ->get();

            \Log::info('Jawaban found:', $jawaban->toArray());

            $totalSkor = collect($request->skor_data)->sum('skor_didapat');
            $totalNilai = $request->total_nilai;

            // Simpan hasil untuk setiap jawaban
            // foreach ($request->skor_data as $data) {
            //     $hasil = HasilTestPeserta::create([
            //         'id_jadwal' => $jadwalId,
            //         'id_user' => $userId,
            //         'total_skor' => $data['skor_didapat'], // Menggunakan skor individual
            //         'total_nilai' => $totalNilai,
            //     ]);
            //     \Log::info('Created HasilTestPeserta:', $hasil->toArray());
            // }
            $hasil = HasilTestPeserta::where('id_user', $userId)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if ($hasil) {
                $hasil->update([
                    'total_skor' => $totalSkor,
                    'total_nilai' => $totalNilai,
                ]);
            }

            DB::commit();

            return to_route('koreksi.detail', [
                'userId' => $userId,
                'jadwalId' => $jadwalId
            ])->with('success', 'Koreksi berhasil disimpan');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal menyimpan koreksi');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
