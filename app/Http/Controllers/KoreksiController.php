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
     * Display a listing of the resource.
     */
    public function index()
    {
        $currentUser = Auth::user();
        
        // Build query dasar
        $query = Jawaban::select(
            'id_user',
            'id_jadwal',
            DB::raw('COUNT(DISTINCT id_soal) as total_soal'),
            DB::raw('MIN(created_at) as waktu_ujian'),
            DB::raw('SUM(skor_didapat) as total_skor')
        )
            ->with(['user:id,nama', 'jadwal:id,nama_jadwal'])
            ->groupBy('id_user', 'id_jadwal');
        
        // Filter berdasarkan role
        if ($currentUser->role === 'teacher') {
            // Teacher hanya bisa melihat data dari jadwal yang mereka buat
            $query->whereHas('jadwal', function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id);
            });
        }
        // Admin bisa melihat semua data (tidak perlu filter tambahan)
        
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
                    'nama_jadwal' => $item->jadwal->nama_jadwal,
                    'total_soal' => $item->total_soal,
                    'waktu_ujian' => $item->waktu_ujian,
                    // Total skor langsung dari SUM(skor_didapat) di tabel jawaban
                    'total_skor' => $item->total_skor,
                    'status_koreksi' => $statusKoreksi
                ];
            });

        // Ambil jadwal untuk dropdown filter berdasarkan role
        $jadwalQuery = Jadwal::select('id', 'nama_jadwal')
            ->orderBy('nama_jadwal');
        
        if ($currentUser->role === 'teacher') {
            // Teacher hanya bisa melihat jadwal yang mereka buat
            $jadwalQuery->where('user_id', $currentUser->id);
        }
        // Admin bisa melihat semua jadwal
        
        $jadwalList = $jadwalQuery->get();

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
                'soal.jenis_soal',
                'soal.pertanyaan',
                'soal.jawaban_benar',
                'soal.skor as skor_maksimal',
                'users.nama as nama_peserta',
                'jadwal.nama_jadwal'
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
                        $jawabanPeserta = strtolower(trim($jawab->jawaban ?? ''));
                        $jawabanBenar = strtolower(trim($soal->jawaban_benar ?? ''));
                        $skorDidapat = ($jawabanPeserta === $jawabanBenar) ? $soal->skor : 0;
                        
                        // Update skor jawaban
                        $jawab->update(['skor_didapat' => $skorDidapat]);
                        $totalSkor += $skorDidapat;
                    } elseif ($jawab->skor_didapat !== null) {
                        // Jika sudah ada skor, tambahkan ke total
                        $totalSkor += $jawab->skor_didapat;
                    } else {
                        // Untuk soal esai yang belum dikoreksi, berikan skor 0
                        $jawab->update(['skor_didapat' => 0]);
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
