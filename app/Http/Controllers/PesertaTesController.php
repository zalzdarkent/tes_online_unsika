<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Jadwal;
use App\Models\HasilTestPeserta;
use App\Models\Jawaban;
use App\Models\Soal;
use App\Models\JadwalPeserta;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

        $jadwal = Jadwal::with(['jadwalSebelumnya', 'pesertaTerdaftar'])
            // TIDAK ada filter user_id karena peserta harus bisa lihat semua jadwal tes
            // HAPUS filter tanggal mulai - tampilkan semua jadwal
            // ->where('tanggal_mulai', '<=', $now) // DIHAPUS
            // ->where('tanggal_berakhir', '>=', $now) // DIHAPUS - akan difilter di map()

            // Filter untuk jadwal yang bisa diakses:
            // 1. Belum pernah dikerjakan ATAU
            // 2. Sudah mulai tapi belum submit ATAU
            // 3. Terputus dan bisa dilanjutkan
            ->where(function ($query) use ($userId) {
                $query->whereDoesntHave('jawaban', function ($q) use ($userId) {
                    $q->where('id_user', $userId);
                })
                ->orWhereHas('hasil', function ($q) use ($userId) {
                    $q->where('id_user', $userId)
                      ->where(function($subQuery) {
                          $subQuery->where('is_submitted_test', false)
                                   ->orWhere(function($terputusQuery) {
                                       $terputusQuery->where('status_tes', 'terputus')
                                                    ->where('boleh_dilanjutkan', true);
                                   });
                      });
                });
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

                // Tambahkan informasi pendaftaran peserta
                $registration = JadwalPeserta::where('id_jadwal', $item->id)
                    ->where('id_peserta', $userId)
                    ->first();

                $item->status_pendaftaran = $registration ? $registration->status : null;
                $item->sudah_daftar = $registration !== null;
                $item->bisa_mulai_tes = $registration && $registration->status === 'disetujui';

                // Tambahan: Cek apakah waktu mulai tes sudah tiba
                $item->dapat_mulai_tes_sekarang = false;
                $item->menit_menuju_mulai_tes = null;

                if ($item->bisa_mulai_tes) {
                    // Jika ada waktu_mulai_tes yang diset, gunakan itu
                    // Jika tidak, gunakan tanggal_mulai
                    $waktuMulaiTes = $item->waktu_mulai_tes
                        ? Carbon::parse($item->waktu_mulai_tes)
                        : Carbon::parse($item->tanggal_mulai);

                    if ($now->gte($waktuMulaiTes)) {
                        $item->dapat_mulai_tes_sekarang = true;
                    } else {
                        $item->dapat_mulai_tes_sekarang = false;
                        $item->menit_menuju_mulai_tes = $now->diffInMinutes($waktuMulaiTes);
                    }
                }

                // Tambahkan informasi hasil tes jika ada
                $hasilTest = \App\Models\HasilTestPeserta::where('id_jadwal', $item->id)
                    ->where('id_user', $userId)
                    ->first();

                // Jika ada hasil test, hitung sisa waktu real-time
                if ($hasilTest) {
                    $hasilTest->sisa_waktu_detik_realtime = $hasilTest->getSisaWaktuRealTime();
                }

                $item->hasil_test = $hasilTest;

                return $item;
            })
            ->filter() // Hapus item yang null (status Tutup)
            ->values(); // Reset array keys setelah filter

        // Check apakah profil user lengkap
        $user = Auth::user();
        $isProfileComplete = $user->isProfileComplete();
        $missingProfileFields = $isProfileComplete ? [] : $user->getMissingProfileFields();

        return Inertia::render('peserta/daftar-tes/index', [
            'jadwal' => $jadwal,
            'isProfileComplete' => $isProfileComplete,
            'missingProfileFields' => $missingProfileFields,
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

            // cek apakah user sudah pernah mengerjakan
            $hasil = \App\Models\HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if ($hasil && $hasil->is_submitted_test) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah selesai dan tidak dapat diakses kembali.'
                ]);
            }

            // Jika tes terputus dan belum diizinkan lanjut, redirect dengan pesan
            if ($hasil && $hasil->status_tes === 'terputus' && !$hasil->boleh_dilanjutkan) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes Anda terputus. Silakan hubungi pengawas untuk mengizinkan melanjutkan tes.'
                ]);
            }

            $hasil = HasilTestPeserta::firstOrCreate(
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

            // Update status tes menjadi sedang mengerjakan dan set waktu mulai
            $hasil->update([
                'status_tes' => 'sedang_mengerjakan',
                'waktu_mulai_tes' => now(),
                'waktu_terakhir_aktif' => now(),
                'sisa_waktu_detik' => $jadwal->durasi * 60, // convert menit ke detik
            ]);

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
                // Jika tes terputus dan diizinkan dilanjutkan, reset is_submitted_test
                if ($hasil->status_tes === 'terputus' && $hasil->boleh_dilanjutkan) {
                    $hasil->update([
                        'is_submitted_test' => false,
                        'status_tes' => 'sedang_mengerjakan',
                        'waktu_terakhir_aktif' => now(),
                        'boleh_dilanjutkan' => false, // reset flag izin
                    ]);
                } else {
                    return redirect()->route('peserta.daftar-tes')->withErrors([
                        'error' => 'Tes ini sudah pernah dikerjakan dan tidak dapat diakses kembali.'
                    ]);
                }
            }

            // acak soal
            $soalQuery = $jadwal->soal();

            if ($jadwal->is_shuffled) {
                $soalQuery->inRandomOrder();
            }

            $soalData = $soalQuery->get();

            // prefill
            $jawaban = \App\Models\Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwal->id)
                ->pluck('jawaban', 'id_soal');


            // hitung durasi berdasarkan sisa waktu real-time
            $startTime = Carbon::parse($hasil->start_time);
            $jadwalSelesai = Carbon::parse($jadwal->tanggal_berakhir);

            // Gunakan sisa waktu real-time (dengan logic pause/resume)
            $sisaWaktuDetik = $hasil->getSisaWaktuRealTime();

            Log::info('Perhitungan end_time:', [
                'sisa_waktu_real_time' => $sisaWaktuDetik,
                'status_tes' => $hasil->status_tes,
                'waktu_sekarang' => now()->format('Y-m-d H:i:s')
            ]);

            if ($sisaWaktuDetik > 0) {
                $endTime = now()->addSeconds($sisaWaktuDetik);
            } else {
                // Jika tidak ada sisa waktu, gunakan durasi penuh (first time)
                $durasi = $jadwal->durasi;
                $endTime = $startTime->copy()->addMinutes($durasi);
            }

            if ($endTime->gt($jadwalSelesai)) {
                $endTime = $jadwalSelesai->copy();
            }            if (now()->gt($endTime)) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Waktu tes sudah habis dan tidak dapat diakses kembali.'
                ]);
            }

            $endTimeTimestamp = $endTime->timestamp;

            // $activeSessionsCount = DB::table('sessions')
            //     ->where('user_id', $user->id)
            //     ->count();

            // if ($activeSessionsCount > 1) {
            //     return redirect()->route('peserta.daftar-tes')->withErrors([
            //         'error' => 'Anda sudah login di device lain. Silakan logout dari device lain untuk melanjutkan ujian.'
            //     ]);
            // }

            return Inertia::render('peserta/soal/index', [
                'jadwal' => $jadwal,
                'soal' => $soalData->map(function ($s) use ($user, $jadwal) {
                    $soalData = [
                        'id' => $s->id,
                        'id_jadwal' => $s->id_jadwal,
                        'jenis_soal' => $s->jenis_soal,
                        'tipe_jawaban' => $s->tipe_jawaban,
                        'pertanyaan' => $s->pertanyaan,
                        'media' => $s->media,
                        'skala_min' => $s->skala_min,
                        'skala_maks' => $s->skala_maks,
                        'skala_label_min' => $s->skala_label_min,
                        'skala_label_maks' => $s->skala_label_maks,
                        'equation' => $s->equation,
                    ];

                    // Jika jadwal di-shuffle, maka jawaban juga otomatis di-shuffle
                    if ($jadwal->is_shuffled && in_array($s->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
                        $shuffledAnswers = $s->getShuffledAnswers($user->id);
                        $soalData = array_merge($soalData, $shuffledAnswers);
                    } else {
                        // Gunakan opsi asli
                        $soalData['opsi_a'] = $s->opsi_a;
                        $soalData['opsi_b'] = $s->opsi_b;
                        $soalData['opsi_c'] = $s->opsi_c;
                        $soalData['opsi_d'] = $s->opsi_d;
                        $soalData['jawaban_benar'] = $s->jawaban_benar;
                    }

                    return $soalData;
                }),
                'end_time_timestamp' => $endTimeTimestamp,
                'jawaban_tersimpan' => $jawaban,
                'user' => [
                    'id' => Auth::user()->id,
                    'name' => Auth::user()->name,
                ],
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
            'reason' => 'nullable|string|in:tab_switch,time_up,manual,screenshot_violation',
        ]);

        $user = Auth::user();
        $jadwalId = $request->jadwal_id;
        $reason = $request->reason ?? 'manual';

        try {
            // Gunakan database transaction untuk memastikan atomicity
            DB::beginTransaction();

            $hasil = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->lockForUpdate() // Prevent race condition
                ->first();

            if (!$hasil) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Data tes tidak ditemukan.'
                ], 404);
            }

            // Cek apakah sudah pernah submit sebelumnya
            if ($hasil->is_submitted_test) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Tes ini sudah pernah dikumpulkan sebelumnya.',
                    'already_submitted' => true
                ], 409); // Conflict status
            }

            $soalIds = Soal::where('id_jadwal', $jadwalId)->pluck('id');

            $existingJawabanIds = Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->pluck('id_soal');

            $missingSoalIds = $soalIds->diff($existingJawabanIds);

            // Insert jawaban null untuk soal yang belum dijawab
            foreach ($missingSoalIds as $idSoal) {
                Jawaban::create([
                    'id_user'   => $user->id,
                    'id_jadwal' => $jadwalId,
                    'id_soal'   => $idSoal,
                    'jawaban'   => null,
                ]);
            }

            // Tentukan status dan alasan berdasarkan reason
            $statusTes = 'selesai';
            $alasanTerputus = null;
            $sisaWaktu = null;

            switch ($reason) {
                case 'tab_switch':
                    $statusTes = 'terputus';
                    $alasanTerputus = 'Terdeteksi pindah tab atau window';
                    break;

                case 'screenshot_violation':
                    $statusTes = 'terputus';
                    $alasanTerputus = 'Pelanggaran screenshot berulang';
                    break;

                case 'time_up':
                    $statusTes = 'selesai';
                    $alasanTerputus = 'Waktu habis';
                    $sisaWaktu = 0;
                    break;

                default: // manual
                    $statusTes = 'selesai';
                    break;
            }

            // Hitung sisa waktu untuk tes terputus
            if ($statusTes === 'terputus' && $hasil->waktu_mulai_tes) {
                $jadwal = Jadwal::find($jadwalId);
                $waktuMulai = Carbon::parse($hasil->waktu_mulai_tes);
                $waktuSekarang = now();
                $waktuTerpakai = $waktuMulai->diffInSeconds($waktuSekarang);
                $totalWaktu = $jadwal->durasi * 60; // convert menit ke detik

                $sisaWaktu = max(0, $totalWaktu - $waktuTerpakai);

                // Log untuk debugging
                Log::info('Submit tes - perhitungan sisa waktu:', [
                    'user_id' => $user->id,
                    'jadwal_id' => $jadwalId,
                    'reason' => $reason,
                    'waktu_mulai' => $waktuMulai->toDateTimeString(),
                    'waktu_sekarang' => $waktuSekarang->toDateTimeString(),
                    'waktu_terpakai_detik' => $waktuTerpakai,
                    'total_waktu_detik' => $totalWaktu,
                    'sisa_waktu_detik' => $sisaWaktu
                ]);
            }

            // Update status submit dan status tes
            $updateData = [
                'is_submitted_test' => true,
                'status_tes' => $statusTes,
                'waktu_terakhir_aktif' => now(),
                'waktu_submit' => now(), // Track waktu submit
            ];

            if ($alasanTerputus) {
                $updateData['alasan_terputus'] = $alasanTerputus;
            }

            if ($sisaWaktu !== null) {
                $updateData['sisa_waktu_detik'] = $sisaWaktu;
            }

            $hasil->update($updateData);

            // Commit transaction
            DB::commit();

            // Log successful submit
            Log::info('Submit tes berhasil:', [
                'user_id' => $user->id,
                'jadwal_id' => $jadwalId,
                'reason' => $reason,
                'status_tes' => $statusTes,
                'alasan_terputus' => $alasanTerputus
            ]);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => $statusTes === 'selesai'
                    ? 'Jawaban berhasil dikumpulkan dan tes selesai'
                    : 'Jawaban berhasil dikumpulkan namun tes terputus',
                'status' => $statusTes,
                'reason' => $alasanTerputus,
                'submit_time' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            // Log error
            Log::error('Submit tes gagal:', [
                'user_id' => $user->id,
                'jadwal_id' => $jadwalId,
                'reason' => $reason,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Terjadi kesalahan saat menyimpan jawaban. Silakan coba lagi.',
                'details' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
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

    /**
     * Method untuk melanjutkan tes yang terputus (jika diizinkan)
     */
    public function lanjutkanTes(Request $request)
    {
        $request->validate([
            'id_jadwal' => 'required|exists:jadwal,id',
        ]);

        try {
            $user = Auth::user();
            $jadwalId = $request->id_jadwal;

            $hasil = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if (!$hasil) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Data tes tidak ditemukan.'
                ]);
            }

            if (!$hasil->bisaDilanjutkan()) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini tidak dapat dilanjutkan.'
                ]);
            }

            // Update status tes menjadi sedang mengerjakan lagi
            $hasil->update([
                'status_tes' => 'sedang_mengerjakan',
                'waktu_terakhir_aktif' => now(),
                'waktu_resume_tes' => now(), // SET WAKTU RESUME
                'boleh_dilanjutkan' => false, // reset flag izin
                'is_submitted_test' => false, // allow to continue
                'sisa_waktu_detik' => $hasil->getSisaWaktuRealTime(), // update dengan sisa waktu real-time
            ]);

            return redirect()->route('peserta.soal', ['id' => $jadwalId]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat melanjutkan tes.'
            ]);
        }
    }
}
