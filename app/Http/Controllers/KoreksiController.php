<?php

namespace App\Http\Controllers;

use App\Models\Jawaban;
use App\Models\HasilTestPeserta;
use App\Models\Jadwal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KoreksiController extends Controller
{
    /**
     * Helper function untuk membandingkan jawaban multi choice (urutan tidak berpengaruh)
     */
    private function compareMultiChoiceAnswer(string $peserta, string $benar): bool
    {
        $pesertaClean = strtolower(trim($peserta));
        $benarClean = strtolower(trim($benar));

        // Jika single character (A, B, C, D), bandingkan langsung
        if (strlen($pesertaClean) === 1 && strlen($benarClean) === 1) {
            return $pesertaClean === $benarClean;
        }

        // Untuk multi choice, pisahkan berdasarkan koma, titik, atau spasi
        $pesertaChoices = collect(preg_split('/[,.\s]+/', $pesertaClean))
            ->map(fn($choice) => trim($choice))
            ->filter(fn($choice) => !empty($choice))
            ->sort()
            ->values()
            ->toArray();

        $benarChoices = collect(preg_split('/[,.\s]+/', $benarClean))
            ->map(fn($choice) => trim($choice))
            ->filter(fn($choice) => !empty($choice))
            ->sort()
            ->values()
            ->toArray();

        // Bandingkan array yang sudah diurutkan
        return json_encode($pesertaChoices) === json_encode($benarChoices);
    }

    /**
     * Display a listing of jadwal tes yang bisa dikoreksi.
     */
    public function index()
    {
        $currentUser = Auth::user();

        // Ambil jadwal yang ada jawaban peserta untuk dikoreksi
        $jadwalQuery = Jadwal::select('id', 'nama_jadwal', 'user_id', 'created_at')
            ->whereHas('jawaban') // Hanya jadwal yang sudah ada jawaban peserta
            ->withCount([
                'jawaban as total_peserta' => function ($query) {
                    $query->select(DB::raw('count(distinct id_user)'));
                },
                'jawaban as total_sudah_dikoreksi' => function ($query) {
                    $query->select(DB::raw('count(distinct id_user)'))
                          ->whereExists(function ($subquery) {
                              $subquery->select(DB::raw(1))
                                       ->from('hasil_test_peserta as htp')
                                       ->whereColumn('htp.id_user', 'jawaban.id_user')
                                       ->whereColumn('htp.id_jadwal', 'jawaban.id_jadwal')
                                       ->where('htp.status_koreksi', 'submitted');
                          });
                },
                'jawaban as total_draft' => function ($query) {
                    $query->select(DB::raw('count(distinct id_user)'))
                          ->whereExists(function ($subquery) {
                              $subquery->select(DB::raw(1))
                                       ->from('hasil_test_peserta as htp')
                                       ->whereColumn('htp.id_user', 'jawaban.id_user')
                                       ->whereColumn('htp.id_jadwal', 'jawaban.id_jadwal')
                                       ->where('htp.status_koreksi', 'draft');
                          });
                }
            ]);

        // Filter berdasarkan role
        if ($currentUser->role === 'teacher') {
            // Teacher hanya bisa melihat jadwal yang mereka buat
            $jadwalQuery->where('user_id', $currentUser->id);
        }
        // Admin bisa melihat semua jadwal

        $data = $jadwalQuery->orderBy('created_at', 'desc')->get()
            ->map(function ($jadwal) {
                $totalBelumDikoreksi = $jadwal->total_peserta - $jadwal->total_sudah_dikoreksi - $jadwal->total_draft;

                return [
                    'id' => $jadwal->id,
                    'nama_jadwal' => $jadwal->nama_jadwal,
                    'total_peserta' => $jadwal->total_peserta,
                    'total_sudah_dikoreksi' => $jadwal->total_sudah_dikoreksi,
                    'total_draft' => $jadwal->total_draft,
                    'total_belum_dikoreksi' => $totalBelumDikoreksi,
                    'created_at' => $jadwal->created_at,
                ];
            });

        return Inertia::render('koreksi/koreksi', [
            'data' => $data
        ]);
    }

    /**
     * Display daftar peserta yang mengikuti jadwal tertentu untuk dikoreksi.
     */
    public function peserta(string $jadwalId)
    {
        $currentUser = Auth::user();

        // Validasi akses: teacher hanya bisa melihat peserta dari jadwal yang mereka buat
        if ($currentUser->role === 'teacher') {
            $jadwal = Jadwal::where('id', $jadwalId)
                ->where('user_id', $currentUser->id)
                ->first();

            if (!$jadwal) {
                return redirect()->route('koreksi.index')
                    ->with('error', 'Anda tidak memiliki akses untuk melihat koreksi jadwal ini.');
            }
        }

        // Ambil informasi jadwal
        $jadwalInfo = Jadwal::select('id', 'nama_jadwal')->find($jadwalId);

        if (!$jadwalInfo) {
            return redirect()->route('koreksi.index')
                ->with('error', 'Jadwal tidak ditemukan.');
        }

        // Build query untuk peserta yang mengikuti jadwal ini
        $query = Jawaban::select(
            'id_user',
            'id_jadwal',
            DB::raw('COUNT(DISTINCT id_soal) as total_soal'),
            DB::raw('MIN(created_at) as waktu_ujian'),
            DB::raw('SUM(skor_didapat) as total_skor')
        )
            ->with(['user:id,nama'])
            ->where('id_jadwal', $jadwalId)
            ->groupBy('id_user', 'id_jadwal');

        $data = $query->get()
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
                    'total_soal' => $item->total_soal,
                    'waktu_ujian' => $item->waktu_ujian,
                    // Total skor langsung dari SUM(skor_didapat) di tabel jawaban
                    'total_skor' => $item->total_skor,
                    'status_koreksi' => $statusKoreksi
                ];
            });

        return Inertia::render('koreksi/peserta-koreksi', [
            'data' => $data,
            'jadwal' => $jadwalInfo
        ]);
    }

    /**
     * Display statistik koreksi untuk jadwal tertentu.
     */
    public function statistik(string $jadwalId)
    {
        $currentUser = Auth::user();

        // Validasi akses: teacher hanya bisa melihat statistik dari jadwal yang mereka buat
        if ($currentUser->role === 'teacher') {
            $jadwal = Jadwal::where('id', $jadwalId)
                ->where('user_id', $currentUser->id)
                ->first();

            if (!$jadwal) {
                return redirect()->route('koreksi.index')
                    ->with('error', 'Anda tidak memiliki akses untuk melihat statistik jadwal ini.');
            }
        }

        // Ambil informasi jadwal dengan total soal
        $jadwalInfo = Jadwal::select('id', 'nama_jadwal', 'created_at')
            ->withCount('soal as total_soal_jadwal')
            ->find($jadwalId);

        if (!$jadwalInfo) {
            return redirect()->route('koreksi.index')
                ->with('error', 'Jadwal tidak ditemukan.');
        }

        // Statistik umum
        $totalPeserta = Jawaban::where('id_jadwal', $jadwalId)
            ->distinct('id_user')
            ->count();

        $totalSudahDikoreksi = HasilTestPeserta::where('id_jadwal', $jadwalId)
            ->where('status_koreksi', 'submitted')
            ->count();

        $totalDraft = HasilTestPeserta::where('id_jadwal', $jadwalId)
            ->where('status_koreksi', 'draft')
            ->count();

        $totalBelumDikoreksi = $totalPeserta - $totalSudahDikoreksi - $totalDraft;

        // Distribusi skor (hanya yang sudah final)
        $distribusiSkor = HasilTestPeserta::where('id_jadwal', $jadwalId)
            ->where('status_koreksi', 'submitted')
            ->select('total_nilai')
            ->get()
            ->groupBy(function($item) {
                $nilai = $item->total_nilai;
                if ($nilai >= 85) return 'A';
                if ($nilai >= 70) return 'B';
                if ($nilai >= 60) return 'C';
                if ($nilai >= 50) return 'D';
                return 'E';
            })
            ->map(function($group) {
                return $group->count();
            });

        // Top 10 peserta dengan skor tertinggi
        $topPeserta = HasilTestPeserta::where('id_jadwal', $jadwalId)
            ->where('status_koreksi', 'submitted')
            ->join('users', 'hasil_test_peserta.id_user', '=', 'users.id')
            ->select('users.nama', 'hasil_test_peserta.total_nilai', 'hasil_test_peserta.total_skor')
            ->orderBy('hasil_test_peserta.total_nilai', 'desc')
            ->take(10)
            ->get();

        // Rata-rata per soal (untuk mengidentifikasi soal yang sulit)
        $rataRataPerSoal = Jawaban::where('jawaban.id_jadwal', $jadwalId)
            ->join('soal', 'jawaban.id_soal', '=', 'soal.id')
            ->whereExists(function($query) {
                $query->select(DB::raw(1))
                      ->from('hasil_test_peserta as htp')
                      ->whereColumn('htp.id_user', 'jawaban.id_user')
                      ->whereColumn('htp.id_jadwal', 'jawaban.id_jadwal')
                      ->where('htp.status_koreksi', 'submitted');
            })
            ->select(
                'soal.id',
                'soal.pertanyaan',
                'soal.skor as skor_maksimal',
                DB::raw('AVG(jawaban.skor_didapat) as rata_rata_skor'),
                DB::raw('COUNT(*) as total_jawaban'),
                DB::raw('SUM(CASE WHEN jawaban.skor_didapat = soal.skor THEN 1 ELSE 0 END) as jawaban_benar'),
                DB::raw('ROUND((SUM(CASE WHEN jawaban.skor_didapat = soal.skor THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as persentase_benar')
            )
            ->groupBy('soal.id', 'soal.pertanyaan', 'soal.skor')
            ->orderBy('persentase_benar', 'asc')
            ->get();

        // Timeline koreksi (per hari selama 30 hari terakhir)
        $timelineKoreksi = HasilTestPeserta::where('id_jadwal', $jadwalId)
            ->where('status_koreksi', 'submitted')
            ->where('updated_at', '>=', now()->subDays(30))
            ->select(
                DB::raw('DATE(updated_at) as tanggal'),
                DB::raw('COUNT(*) as jumlah_koreksi')
            )
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        // Statistik waktu pengerjaan - ambil dari hasil_test_peserta yang lebih akurat
        $waktuPengerjaan = HasilTestPeserta::where('id_jadwal', $jadwalId)
            ->where('status_koreksi', 'submitted')
            ->whereNotNull('waktu_mulai_tes')
            ->whereNotNull('waktu_submit')
            ->select(
                DB::raw('TIMESTAMPDIFF(MINUTE, waktu_mulai_tes, waktu_submit) as durasi_menit')
            )
            ->get();

        // Filter durasi yang valid
        $durasiValid = $waktuPengerjaan->pluck('durasi_menit')->filter(function($durasi) {
            return $durasi >= 1; // Minimal 1 menit
        });

        // Jika tidak ada data dari hasil_test_peserta, fallback ke jawaban
        if ($durasiValid->isEmpty()) {
            $waktuPengerjaanFallback = Jawaban::where('jawaban.id_jadwal', $jadwalId)
                ->select(
                    'jawaban.id_user',
                    DB::raw('GREATEST(1, TIMESTAMPDIFF(MINUTE, MIN(jawaban.created_at), MAX(jawaban.created_at))) as durasi_menit')
                )
                ->groupBy('jawaban.id_user')
                ->get();

            $durasiValid = $waktuPengerjaanFallback->pluck('durasi_menit')->filter(function($durasi) {
                return $durasi >= 1;
            });
        }

        $avgWaktuPengerjaan = $durasiValid->avg() ?: 0;
        $minWaktuPengerjaan = $durasiValid->min() ?: 0;
        $maxWaktuPengerjaan = $durasiValid->max() ?: 0;

        // Debug: Log durasi untuk troubleshooting
        logger()->info("Debug Waktu Pengerjaan - Jadwal ID: $jadwalId", [
            'total_durasi' => $durasiValid->count(),
            'durasi_values' => $durasiValid->toArray(),
            'avg' => $avgWaktuPengerjaan,
            'min' => $minWaktuPengerjaan,
            'max' => $maxWaktuPengerjaan
        ]);

        // Kualitas jawaban berdasarkan jenis soal
        $kualitasPerJenisSoal = Jawaban::where('jawaban.id_jadwal', $jadwalId)
            ->join('soal', 'jawaban.id_soal', '=', 'soal.id')
            ->whereExists(function($query) {
                $query->select(DB::raw(1))
                      ->from('hasil_test_peserta as htp')
                      ->whereColumn('htp.id_user', 'jawaban.id_user')
                      ->whereColumn('htp.id_jadwal', 'jawaban.id_jadwal')
                      ->where('htp.status_koreksi', 'submitted');
            })
            ->select(
                'soal.jenis_soal',
                DB::raw('COUNT(*) as total_jawaban'),
                DB::raw('AVG(jawaban.skor_didapat) as rata_rata_skor'),
                DB::raw('AVG(soal.skor) as rata_rata_skor_maksimal'),
                DB::raw('ROUND((AVG(jawaban.skor_didapat) / AVG(soal.skor)) * 100, 2) as persentase_pencapaian')
            )
            ->groupBy('soal.jenis_soal')
            ->get();

        return Inertia::render('koreksi/statistik-koreksi', [
            'jadwal' => $jadwalInfo,
            'statistikUmum' => [
                'total_peserta' => $totalPeserta,
                'total_sudah_dikoreksi' => $totalSudahDikoreksi,
                'total_draft' => $totalDraft,
                'total_belum_dikoreksi' => $totalBelumDikoreksi,
                'persentase_selesai' => $totalPeserta > 0 ? round(($totalSudahDikoreksi / $totalPeserta) * 100, 2) : 0,
            ],
            'distribusiSkor' => $distribusiSkor,
            'topPeserta' => $topPeserta,
            'rataRataPerSoal' => $rataRataPerSoal,
            'timelineKoreksi' => $timelineKoreksi,
            'waktuPengerjaan' => [
                'rata_rata' => round($avgWaktuPengerjaan ?? 0, 2),
                'tercepat' => $minWaktuPengerjaan ?? 0,
                'terlama' => $maxWaktuPengerjaan ?? 0,
            ],
            'kualitasPerJenisSoal' => $kualitasPerJenisSoal,
        ]);
    }    /**
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
        $currentUser = Auth::user();

        // Validasi akses: teacher hanya bisa melihat detail dari jadwal yang mereka buat
        if ($currentUser->role === 'teacher') {
            $jadwal = Jadwal::where('id', $jadwalId)
                ->where('user_id', $currentUser->id)
                ->first();

            if (!$jadwal) {
                return back()->with('error', 'Anda tidak memiliki akses untuk melihat koreksi ini.');
            }
        }

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
                'soal.id as soal_id',
                'soal.jenis_soal',
                'soal.pertanyaan',
                'soal.jawaban_benar',
                'soal.skor as skor_maksimal',
                'soal.opsi_a',
                'soal.opsi_b',
                'soal.opsi_c',
                'soal.opsi_d',
                'users.nama as nama_peserta',
                'jadwal.nama_jadwal',
                'jadwal.is_shuffled'
            )
            ->orderBy('jawaban.id_soal', 'asc')
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

        $data = $jawabanData->map(function ($item) use ($userId) {
            $jawabanBenar = $item->jawaban_benar;
            $opsiToShow = [];

            // Jika jadwal di-shuffle dan soal adalah pilihan ganda, gunakan jawaban dan opsi yang sudah di-shuffle
            if ($item->is_shuffled && in_array($item->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
                // Buat instance soal untuk menggunakan method getShuffledAnswers
                $soal = new \App\Models\Soal();
                $soal->id = $item->soal_id;
                $soal->jenis_soal = $item->jenis_soal;
                $soal->opsi_a = $item->opsi_a;
                $soal->opsi_b = $item->opsi_b;
                $soal->opsi_c = $item->opsi_c;
                $soal->opsi_d = $item->opsi_d;
                $soal->jawaban_benar = $item->jawaban_benar;

                $shuffledAnswers = $soal->getShuffledAnswers($userId);
                $jawabanBenar = $shuffledAnswers['jawaban_benar'];

                // Tampilkan opsi yang sudah di-shuffle untuk referensi koreksi
                $opsiToShow = [
                    'A' => $shuffledAnswers['opsi_a'],
                    'B' => $shuffledAnswers['opsi_b'],
                    'C' => $shuffledAnswers['opsi_c'],
                    'D' => $shuffledAnswers['opsi_d'],
                ];
            } else {
                // Gunakan opsi asli
                $opsiToShow = [
                    'A' => $item->opsi_a,
                    'B' => $item->opsi_b,
                    'C' => $item->opsi_c,
                    'D' => $item->opsi_d,
                ];
            }

            return [
                'id' => $item->id,
                'jenis_soal' => $item->jenis_soal,
                'pertanyaan' => $item->pertanyaan,
                'jawaban_benar' => $jawabanBenar,
                'jawaban_peserta' => $item->jawaban_peserta,
                'skor_maksimal' => $item->skor_maksimal,
                'skor_didapat' => $item->skor_didapat,
                'opsi_shuffled' => $opsiToShow,
                'is_shuffled' => $item->is_shuffled
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

            $currentUser = Auth::user();

            // Validasi akses: teacher hanya bisa update koreksi dari jadwal yang mereka buat
            if ($currentUser->role === 'teacher') {
                $jadwal = Jadwal::where('id', $jadwalId)
                    ->where('user_id', $currentUser->id)
                    ->first();

                if (!$jadwal) {
                    return back()->with('error', 'Anda tidak memiliki akses untuk mengoreksi jadwal ini.');
                }
            }

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
    public function destroy(string $userId, string $jadwalId)
    {
        try {
            DB::beginTransaction();

            $currentUser = Auth::user();

            // Validasi akses: teacher hanya bisa hapus koreksi dari jadwal yang mereka buat
            if ($currentUser->role === 'teacher') {
                $jadwal = Jadwal::where('id', $jadwalId)
                    ->where('user_id', $currentUser->id)
                    ->first();

                if (!$jadwal) {
                    return redirect()->route('koreksi.index')->with('error', 'Anda tidak memiliki akses untuk menghapus koreksi ini.');
                }
            }

            // Hapus semua jawaban untuk user dan jadwal tertentu
            Jawaban::where('id_user', $userId)
                ->where('id_jadwal', $jadwalId)
                ->delete();

            // Hapus hasil test peserta
            HasilTestPeserta::where('id_user', $userId)
                ->where('id_jadwal', $jadwalId)
                ->delete();

            DB::commit();

            return redirect()->route('koreksi.index')->with('success', 'Data koreksi berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->route('koreksi.index')->with('error', 'Gagal menghapus data koreksi: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete multiple koreksi data
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id_user' => 'required|integer',
            'items.*.id_jadwal' => 'required|integer',
        ]);

        try {
            DB::beginTransaction();

            $currentUser = Auth::user();
            $deletedCount = 0;

            foreach ($request->items as $item) {
                $userId = $item['id_user'];
                $jadwalId = $item['id_jadwal'];

                // Validasi akses: teacher hanya bisa hapus koreksi dari jadwal yang mereka buat
                if ($currentUser->role === 'teacher') {
                    $jadwal = Jadwal::where('id', $jadwalId)
                        ->where('user_id', $currentUser->id)
                        ->first();

                    if (!$jadwal) {
                        continue; // Skip item ini jika tidak punya akses
                    }
                }

                // Hapus jawaban
                $jawabanDeleted = Jawaban::where('id_user', $userId)
                    ->where('id_jadwal', $jadwalId)
                    ->delete();

                // Hapus hasil test peserta
                $hasilDeleted = HasilTestPeserta::where('id_user', $userId)
                    ->where('id_jadwal', $jadwalId)
                    ->delete();

                if ($jawabanDeleted || $hasilDeleted) {
                    $deletedCount++;
                }
            }

            DB::commit();

            return redirect()->route('koreksi.index')->with('success', "Berhasil menghapus {$deletedCount} data koreksi.");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->route('koreksi.index')->with('error', 'Gagal menghapus data koreksi: ' . $e->getMessage());
        }
    }

    /**
     * Batch submit multiple koreksi as final
     */
    public function batchSubmit(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id_user' => 'required|integer',
            'items.*.id_jadwal' => 'required|integer',
        ]);

        try {
            DB::beginTransaction();

            $currentUser = Auth::user();
            $successCount = 0;
            $errorMessages = [];

            foreach ($request->items as $item) {
                $userId = $item['id_user'];
                $jadwalId = $item['id_jadwal'];

                // Validasi akses: teacher hanya bisa submit koreksi dari jadwal yang mereka buat
                if ($currentUser->role === 'teacher') {
                    $jadwal = Jadwal::where('id', $jadwalId)
                        ->where('user_id', $currentUser->id)
                        ->first();

                    if (!$jadwal) {
                        continue; // Skip item ini jika tidak punya akses
                    }
                }

                // Cek atau buat hasil test peserta
                $hasilTest = HasilTestPeserta::where('id_user', $userId)
                    ->where('id_jadwal', $jadwalId)
                    ->first();

                // Jika belum ada hasil test, buat baru
                if (!$hasilTest) {
                    $hasilTest = HasilTestPeserta::create([
                        'id_user' => $userId,
                        'id_jadwal' => $jadwalId,
                        'total_skor' => 0,
                        'total_nilai' => 0,
                        'status_koreksi' => 'submitted',
                    ]);
                }

                // Auto-koreksi soal pilihan ganda yang belum dikoreksi
                $jawaban = Jawaban::where('id_user', $userId)
                    ->where('id_jadwal', $jadwalId)
                    ->with('soal')
                    ->get();

                $totalSkor = 0;
                foreach ($jawaban as $jawab) {
                    $soal = $jawab->soal;

                    // Jika belum ada skor dan soal adalah pilihan ganda, auto-koreksi
                    if ($jawab->skor_didapat === null && in_array($soal->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
                        $jawabanPeserta = $jawab->jawaban ?? '';

                        // Dapatkan jawaban benar yang sesuai dengan shuffle (jika ada)
                        $jadwal = $soal->jadwal;
                        if ($jadwal->is_answer_shuffled && in_array($soal->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
                            // Gunakan jawaban yang sudah di-shuffle untuk user ini
                            $shuffledAnswers = $soal->getShuffledAnswers($hasilTest->id_user);
                            $jawabanBenar = $shuffledAnswers['jawaban_benar'] ?? '';
                        } else {
                            // Gunakan jawaban asli
                            $jawabanBenar = $soal->jawaban_benar ?? '';
                        }

                        $skorDidapat = 0;
                        if ($soal->jenis_soal === 'pilihan_ganda') {
                            // Untuk pilihan ganda biasa, urutan tetap penting
                            $skorDidapat = (strtolower(trim($jawabanPeserta)) === strtolower(trim($jawabanBenar))) ? $soal->skor : 0;
                        } elseif ($soal->jenis_soal === 'multi_choice') {
                            // Untuk multi choice, urutan tidak penting
                            $skorDidapat = $this->compareMultiChoiceAnswer($jawabanPeserta, $jawabanBenar) ? $soal->skor : 0;
                        }

                        // Update skor jawaban
                        $jawab->update(['skor_didapat' => $skorDidapat]);
                        $totalSkor += $skorDidapat;
                    } elseif ($jawab->skor_didapat !== null) {
                        // Jika sudah ada skor, tambahkan ke total
                        $totalSkor += $jawab->skor_didapat;
                    } else {
                        // Untuk soal non-pilihan ganda yang belum dikoreksi
                        $skorDidapat = 0;

                        // Jika soal esai/lainnya dan jawaban kosong, otomatis berikan skor 0
                        $jawabanPeserta = trim($jawab->jawaban ?? '');
                        if (empty($jawabanPeserta)) {
                            $skorDidapat = 0;
                        }
                        // Jika ada jawaban, tetap berikan skor 0 untuk auto-submit (teacher bisa edit manual nanti)

                        $jawab->update(['skor_didapat' => $skorDidapat]);
                        $totalSkor += $skorDidapat;
                    }
                }

                // Hitung total skor maksimal
                $totalSkorMaksimal = $jawaban->sum(function($jawab) {
                    return $jawab->soal->skor;
                });

                // Hitung nilai persentase
                $totalNilai = $totalSkorMaksimal > 0 ? ($totalSkor / $totalSkorMaksimal) * 100 : 0;

                // Update hasil test dengan status submitted
                $hasilTest->update([
                    'total_skor' => $totalSkor,
                    'total_nilai' => round($totalNilai, 2),
                    'status_koreksi' => 'submitted',
                ]);

                $successCount++;
            }

            DB::commit();

            $message = $successCount > 0
                ? "Berhasil submit {$successCount} koreksi sebagai final."
                : "Tidak ada koreksi yang berhasil disubmit.";

            if (!empty($errorMessages)) {
                $message .= " Peringatan: " . implode(" ", $errorMessages);
            }

            // Gunakan redirect dengan session flash message untuk Inertia
            return redirect()->route('koreksi.index')->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->route('koreksi.index')->with('error', 'Gagal melakukan batch submit: ' . $e->getMessage());
        }
    }
}
