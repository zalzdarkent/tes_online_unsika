<?php

namespace App\Http\Controllers;

use App\Models\Jawaban;
use App\Models\HasilTestPeserta;
use App\Models\Jadwal;
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
            DB::raw('MIN(created_at) as waktu_ujian'),
            DB::raw('SUM(skor_didapat) as total_skor')
        )
            ->with(['user:id,nama', 'jadwal:id,nama_jadwal'])
            ->groupBy('id_user', 'id_jadwal')
            ->get()
            ->map(function ($item) {
                // Cek status koreksi dari tabel hasil_test_peserta
                $hasilTest = HasilTestPeserta::where('id_user', $item->id_user)
                    ->where('id_jadwal', $item->id_jadwal)
                    ->first();

                $statusKoreksi = null;
                if ($hasilTest) {
                    $statusKoreksi = $hasilTest->status_koreksi;
                }

                return [
                    'id_user' => $item->id_user,
                    'id_jadwal' => $item->id_jadwal,
                    'nama_peserta' => $item->user->nama,
                    'nama_jadwal' => $item->jadwal->nama_jadwal,
                    'total_soal' => $item->total_soal,
                    'waktu_ujian' => $item->waktu_ujian,
                    // Total skor langsung dari SUM(skor_didapat) di tabel jawaban
                    'total_skor' => $item->total_skor,
                    'status_koreksi' => $statusKoreksi
                ];
            });

        // Ambil semua jadwal untuk dropdown filter
        $jadwalList = Jadwal::select('id', 'nama_jadwal')
            ->orderBy('nama_jadwal')
            ->get();

        return Inertia::render('koreksi/koreksi', [
            'data' => $data,
            'jadwalList' => $jadwalList
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
        // Ambil semua jawaban dari tabel jawaban dengan join ke soal, user, dan jadwal
        $jawabanData = Jawaban::where('jawaban.id_user', $userId)
            ->where('jawaban.id_jadwal', $jadwalId)
            ->join('soal', 'jawaban.id_soal', '=', 'soal.id')
            ->join('users', 'jawaban.id_user', '=', 'users.id')
            ->join('jadwal', 'jawaban.id_jadwal', '=', 'jadwal.id')
            ->select(
                'jawaban.id',
                'jawaban.jawaban as jawaban_peserta',
                'jawaban.skor_didapat',
                'soal.jenis_soal',
                'soal.pertanyaan',
                'soal.jawaban_benar',
                'soal.skor as skor_maksimal',
                'users.nama as nama_peserta',
                'jadwal.nama_jadwal'
            )
            ->get();

        // Jika tidak ada data jawaban, redirect ke halaman sebelumnya dengan pesan error
        if ($jawabanData->isEmpty()) {
            return back()->with('error', 'Data jawaban tidak ditemukan');
        }

        // Cek status koreksi dari tabel hasil_test_peserta
        $hasilTest = HasilTestPeserta::where('id_user', $userId)
            ->where('id_jadwal', $jadwalId)
            ->first();

        $statusKoreksi = null;
        if ($hasilTest) {
            $statusKoreksi = $hasilTest->status_koreksi ?? 'draft';
        }

        // Ambil info peserta dan jadwal dari record pertama
        $firstRecord = $jawabanData->first();

        $data = $jawabanData->map(function ($item) {
            return [
                'id' => $item->id,
                'jenis_soal' => $item->jenis_soal,
                'pertanyaan' => $item->pertanyaan,
                'jawaban_benar' => $item->jawaban_benar,
                'jawaban_peserta' => $item->jawaban_peserta,
                'skor_maksimal' => $item->skor_maksimal,
                'skor_didapat' => $item->skor_didapat
            ];
        });

        return Inertia::render('koreksi/detail-koreksi', [
            'data' => $data,
            'peserta' => [
                'nama' => $firstRecord->nama_peserta,
                'jadwal' => $firstRecord->nama_jadwal
            ],
            'status_koreksi' => $statusKoreksi
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
        try {
            DB::beginTransaction();

            $totalSkor = collect($request->skor_data)->sum('skor_didapat');
            $totalNilai = $request->total_nilai;
            $action = $request->action ?? 'save'; // 'save' untuk draft, 'submit' untuk final

            // Cek apakah sudah submitted (tidak bisa diubah lagi)
            $existingResult = HasilTestPeserta::where('id_user', $userId)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if ($existingResult && $existingResult->status_koreksi === 'submitted') {
                return back()->with('error', 'Koreksi sudah final dan tidak dapat diubah lagi.');
            }

            // Update skor individual untuk setiap jawaban
            foreach ($request->skor_data as $data) {
                Jawaban::where('id', $data['id'])
                    ->where('id_user', $userId)
                    ->where('id_jadwal', $jadwalId)
                    ->update([
                        'skor_didapat' => $data['skor_didapat']
                    ]);
            }

            // Tentukan status koreksi berdasarkan action
            $statusKoreksi = $action === 'submit' ? 'submitted' : 'draft';

            // Update atau create hasil test peserta dengan total skor
            if ($existingResult) {
                $existingResult->update([
                    'total_skor' => $totalSkor,
                    'total_nilai' => $totalNilai,
                    'status_koreksi' => $statusKoreksi,
                ]);
            } else {
                HasilTestPeserta::create([
                    'id_user' => $userId,
                    'id_jadwal' => $jadwalId,
                    'total_skor' => $totalSkor,
                    'total_nilai' => $totalNilai,
                    'status_koreksi' => $statusKoreksi,
                ]);
            }

            DB::commit();

            $message = $action === 'submit'
                ? 'Koreksi berhasil disubmit sebagai hasil final!'
                : 'Koreksi berhasil disimpan sebagai draft.';

            return to_route('koreksi.detail', [
                'userId' => $userId,
                'jadwalId' => $jadwalId
            ])->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal menyimpan koreksi: ' . $e->getMessage());
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
