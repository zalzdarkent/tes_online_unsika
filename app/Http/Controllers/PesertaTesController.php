<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Jadwal;
use App\Models\HasilTestPeserta;
use App\Models\Jawaban;
use App\Models\Soal;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

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

            // bisa jadi case device bermasalah yang mengharukan keluar
            ->whereDoesntHave('jawaban', function ($query) use ($userId) {
                $query->where('id_user', $userId);
            })

            // ->where(function ($query) use ($userId) {
            //     $query->whereDoesntHave('hasil', function ($q) use ($userId) {
            //         $q->where('id_user', $userId);
            //     })
            //         ->orWhereHas('hasil', function ($q) use ($userId) {
            //             $q->where('id_user', $userId)
            //                 ->where('is_submitted_test', false);
            //         });
            // })
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
    // todo: cek lg business logicnya ada yg ketinggalan ga
    // track start time 
    public function startTest(Request $request)
    {
        $request->validate([
            'id_jadwal' => 'required|exists:jadwal,id',
        ]);

        try {
            $user = Auth::user();
            $jadwalId = $request->id_jadwal;

            // Ambil jadwal dan soal
            $jadwal = Jadwal::with('soal')->findOrFail($jadwalId);

            // Cek apakah belum ada soal
            if ($jadwal->soal->isEmpty()) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum memiliki soal. Silakan hubungi penyelenggara.',
                ])->withInput();
            }

            // Cek apakah tes belum dimulai
            if (now()->lt(\Carbon\Carbon::parse($jadwal->tanggal_mulai))) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum dimulai.'
                ]);
            }

            // Cek apakah tes sudah ditutup
            if (now()->gt(\Carbon\Carbon::parse($jadwal->tanggal_berakhir))) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah ditutup dan tidak dapat lagi dijawab.'
                ])->withInput();
            }

            // Cek apakah user sudah pernah mengerjakan
            $hasil = \App\Models\HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if ($hasil && $hasil->is_submitted_test) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah selesai dan tidak dapat diakses kembali.'
                ]);
            }

            HasilTestPeserta::firstOrCreate(
                [
                    'id_user' => $user->id,
                    'id_jadwal' => $jadwalId,
                ],
                [
                    'start_time' => now(),
                    'total_skor' => null,
                    'total_nilai' => null,
                ]
            );

            return redirect()->route('peserta.soal', ['id' => $jadwalId]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat memulai tes. Silakan coba lagi.'
            ])->withInput();
        }
    }

    // get soal ujian
    public function soal($id)
    {
        try {
            $user = Auth::user();

            $jadwal = Jadwal::with('soal')->findOrFail($id);

            $hasil = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwal->id)
                ->first();

            if (!$hasil) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum dimulai atau belum dijadwalkan untuk Anda.'
                ]);
            };

            if ($hasil->is_submitted_test) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah pernah dikerjakan dan tidak dapat diakses kembali.'
                ]);
            }

            // prefill
            $jawaban = \App\Models\Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwal->id)
                ->pluck('jawaban', 'id_soal');


            // hitung durasi
            $startTime = Carbon::parse($hasil->start_time);
            $durasi = $jadwal->durasi;
            $jadwalSelesai = Carbon::parse($jadwal->tanggal_berakhir);
            $endTime = $startTime->copy()->addMinutes($durasi);

            if ($endTime->gt($jadwalSelesai)) {
                $endTime = $jadwalSelesai->copy();
            }

            if (now()->gt($endTime)) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Waktu tes sudah habis dan tidak dapat diakses kembali.'
                ]);
            }

            $endTimeTimestamp = $endTime->timestamp;

            $activeSessionsCount = DB::table('sessions')
                ->where('user_id', $user->id)
                ->count();

            if ($activeSessionsCount > 1) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Anda sudah login di device lain. Silakan logout dari device lain untuk melanjutkan ujian.'
                ]);
            }

            return Inertia::render('peserta/soal/index', [
                'jadwal' => $jadwal,
                'soal' => $jadwal->soal->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'id_jadwal' => $s->id_jadwal,
                        'jenis_soal' => $s->jenis_soal,
                        'tipe_jawaban' => $s->tipe_jawaban,
                        'pertanyaan' => $s->pertanyaan,
                        'opsi_a' => $s->opsi_a,
                        'opsi_b' => $s->opsi_b,
                        'opsi_c' => $s->opsi_c,
                        'opsi_d' => $s->opsi_d,
                        'media' => $s->media,
                        'skala_min' => $s->skala_min,
                        'skala_maks' => $s->skala_maks,
                        'skala_label_min' => $s->skala_label_min,
                        'skala_label_maks' => $s->skala_label_maks,
                        'equation' => $s->equation,
                    ];
                }),
                'end_time_timestamp' => $endTimeTimestamp,
                'jawaban_tersimpan' => $jawaban,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat membuka halaman tes. Silakan coba lagi nanti.'
            ]);
        }
    }

    public function saveAnswer(Request $request)
    {
        $request->validate([
            'jadwal_id' => 'required|exists:jadwal,id',
            'id_soal' => 'required|exists:soal,id',
            'jawaban' => 'nullable|string',
        ]);

        try {
            $user = Auth::user();

            $existing = Jawaban::where([
                'id_user' => $user->id,
                'id_jadwal' => $request->jadwal_id,
                'id_soal' => $request->id_soal,
            ])->first();

            $jawabanBaru = is_array($request->jawaban)
                ? implode(',', $request->jawaban)
                : $request->jawaban;

            if ($existing && $existing->jawaban === $jawabanBaru) return;

            \App\Models\Jawaban::updateOrCreate(
                [
                    'id_user' => $user->id,
                    'id_jadwal' => $request->jadwal_id,
                    'id_soal' => $request->id_soal,
                ],
                [
                    'jawaban' => $request->jawaban ?? null,
                ]
            );

            return back();
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Gagal menyimpan jawaban.'
            ])->withInput();
        }
    }

    public function submit(Request $request)
    {
        $request->validate([
            'jadwal_id' => 'required|exists:jadwal,id',
        ]);

        $user = Auth::user();
        $jadwalId = $request->jadwal_id;

        try {
            $hasil = \App\Models\HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->first();

            // cek apakah user start selain from button
            // if (!$hasil) {
            //     return redirect()->route('peserta.daftar-tes')->withErrors([
            //         'error' => 'Tes belum dimulai atau tidak ditemukan.'
            //     ])->withInput();
            // }

            // if ($hasil && $hasil->is_submitted_test) {
            //     return redirect()->route('peserta.daftar-tes')->withErrors([
            //         'error' => 'Anda sudah pernah mengerjakan tes ini sebelumnya.'
            //     ])->withInput();
            // }

            $soalIds = \App\Models\Soal::where('id_jadwal', $jadwalId)->pluck('id');

            $existingJawabanIds = \App\Models\Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->pluck('id_soal');

            $missingSoalIds = $soalIds->diff($existingJawabanIds);

            // insert jawaban null untuk soal yang belum dijawab
            foreach ($missingSoalIds as $idSoal) {
                \App\Models\Jawaban::create([
                    'id_user'   => $user->id,
                    'id_jadwal' => $jadwalId,
                    'id_soal'   => $idSoal,
                    'jawaban'   => null,
                ]);
            }

            // update status submit
            $hasil->update([
                'is_submitted_test' => true,
            ]);

            return redirect()->route('peserta.riwayat');
        } catch (\Exception $e) {
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
                ->where('is_submitted_test', true)
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
