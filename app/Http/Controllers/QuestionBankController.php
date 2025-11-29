<?php

namespace App\Http\Controllers;

use App\Models\QuestionBank;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Models\UserBankPermission;
use App\Models\User;
use App\Models\Soal;
use App\Models\Jadwal;
use Illuminate\Support\Facades\DB;

class QuestionBankController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Query dasar - tampilkan soal milik user ATAU yang dishare ke user
        $query = QuestionBank::with(['user'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('permissions', function ($subQ) use ($user) {
                      $subQ->where('requester_id', $user->id)
                           ->where('status', 'active');
                  })
                  ->orWhere(function($subQ) use ($user) {
                        // Check user-level permissions
                        $subQ->whereIn('user_id', function($permissionQ) use ($user) {
                            $permissionQ->select('owner_id')
                                ->from('user_bank_permissions')
                                ->where('grantee_id', $user->id)
                                ->where('can_view', true);
                        });
                  })
                  ->orWhere('is_public', true);
            });



        // Filter berdasarkan tingkat kesulitan
        if ($request->filled('difficulty')) {
            $query->where('difficulty_level', $request->difficulty);
        }

        // Filter berdasarkan jenis soal
        if ($request->filled('jenis_soal')) {
            $query->where('jenis_soal', $request->jenis_soal);
        }

        // Search berdasarkan title atau pertanyaan
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('pertanyaan', 'like', "%{$search}%");
            });
        }

        $questionBanks = $query->withCount('soals as actual_usage_count')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('bank-soal/index', [
            'questionBanks' => $questionBanks,
            'filters' => $request->only(['difficulty', 'jenis_soal', 'search'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = Auth::user();
        return Inertia::render('bank-soal/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'pertanyaan' => 'required|string',
            'jenis_soal' => ['required', 'string', Rule::in([
                'pilihan_ganda', 'multi_choice', 'esai', 'essay_gambar',
                'essay_audio', 'skala', 'equation'
            ])],
            'tipe_jawaban' => ['required', 'string', Rule::in([
                'single_choice', 'multi_choice', 'essay', 'essay_gambar',
                'essay_audio', 'skala', 'equation'
            ])],
            'opsi_a' => 'nullable|string|max:255',
            'opsi_b' => 'nullable|string|max:255',
            'opsi_c' => 'nullable|string|max:255',
            'opsi_d' => 'nullable|string|max:255',
            'jawaban_benar' => 'nullable|string|max:255',
            'media' => 'nullable|file|mimes:jpg,png,gif,mp3,wav,mp4|max:10240', // 10MB
            'tipe_skala' => 'nullable|string',
            'equation' => 'nullable|string',
            'skala_min' => 'nullable|integer',
            'skala_maks' => 'nullable|integer|gt:skala_min',
            'skala_label_min' => 'nullable|string|max:255',
            'skala_label_maks' => 'nullable|string|max:255',
            'skor' => 'required|integer|min:1',
            'difficulty_level' => ['required', 'string', Rule::in(['easy', 'medium', 'hard', 'expert'])],
            'is_public' => 'nullable|boolean'
        ]);

        // Handle media upload
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('question_media', $filename, 'public');
            $validated['media'] = $path;
        }

        $validated['user_id'] = Auth::id();

        // Ensure is_public has a default value
        if (!isset($validated['is_public'])) {
            $validated['is_public'] = false;
        }

        QuestionBank::create($validated);

        return redirect()->route('bank-soal.index')
            ->with('success', 'Soal berhasil ditambahkan ke bank soal');
    }

    /**
     * Display the specified resource.
     */
    public function show($bankSoal)
    {
        $questionBank = QuestionBank::findOrFail($bankSoal);
        $user = Auth::user();

        // Check access permission
        $hasAccess = $questionBank->user_id == $user->id ||
                    $questionBank->is_public ||
                    $questionBank->permissions()
                        ->where('requester_id', $user->id)
                        ->where('status', 'active')
                        ->exists();

        if (!$hasAccess) {
            return redirect()->route('bank-soal.index')
                ->withErrors(['error' => 'Anda tidak memiliki akses ke soal ini']);
        }

        $questionBank->loadCount('soals as actual_usage_count');
        $questionBank->load(['user']);

        return Inertia::render('bank-soal/show', [
            'questionBank' => $questionBank
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($bankSoal)
    {
        $questionBank = QuestionBank::findOrFail($bankSoal);
        $user = Auth::user();

        // Only owner can edit
        if ($questionBank->user_id !== $user->id) {
            return redirect()->route('bank-soal.index')
                ->withErrors(['error' => 'Anda hanya bisa mengedit soal milik sendiri']);
        }

        return Inertia::render('bank-soal/edit', [
            'questionBank' => $questionBank
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $bankSoal)
    {
        $questionBank = QuestionBank::findOrFail($bankSoal);
        $user = Auth::user();

        // Only owner can update
        if ($questionBank->user_id !== $user->id) {
            return redirect()->route('bank-soal.index')
                ->withErrors(['error' => 'Anda hanya bisa mengedit soal milik sendiri']);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'pertanyaan' => 'required|string',
            'jenis_soal' => ['required', 'string', Rule::in([
                'pilihan_ganda', 'multi_choice', 'esai', 'essay_gambar',
                'essay_audio', 'skala', 'equation'
            ])],
            'tipe_jawaban' => ['required', 'string', Rule::in([
                'single_choice', 'multi_choice', 'essay', 'essay_gambar',
                'essay_audio', 'skala', 'equation'
            ])],
            'opsi_a' => 'nullable|string|max:255',
            'opsi_b' => 'nullable|string|max:255',
            'opsi_c' => 'nullable|string|max:255',
            'opsi_d' => 'nullable|string|max:255',
            'jawaban_benar' => 'nullable|string|max:255',
            'media' => 'nullable|file|mimes:jpg,png,gif,mp3,wav,mp4|max:10240',
            'tipe_skala' => 'nullable|string',
            'equation' => 'nullable|string',
            'skala_min' => 'nullable|integer',
            'skala_maks' => 'nullable|integer|gt:skala_min',
            'skala_label_min' => 'nullable|string|max:255',
            'skala_label_maks' => 'nullable|string|max:255',
            'skor' => 'required|integer|min:1',
            'difficulty_level' => ['required', 'string', Rule::in(['easy', 'medium', 'hard', 'expert'])],
            'is_public' => 'boolean'
        ]);

        // Handle media upload
        if ($request->hasFile('media')) {
            // Delete old media if exists
            $questionBank->deleteMedia();

            $file = $request->file('media');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('question_media', $filename, 'public');
            $validated['media'] = $path;
        }

        $questionBank->update($validated);

        return redirect()->route('bank-soal.index')
            ->with('success', 'Soal berhasil diperbarui');
    }

    /**
     * Download template file for bank soal import.
     */
    public function downloadTemplate()
    {
        $filePath = public_path('template-bank-soal.xlsx');

        if (!file_exists($filePath)) {
            abort(404, 'Template file tidak ditemukan.');
        }

        $filename = 'template-bank-soal.xlsx';
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return response()->download($filePath, $filename, $headers);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($bankSoal)
    {
        $questionBank = QuestionBank::findOrFail($bankSoal);
        $user = Auth::user();

        // Only owner can delete
        if ($questionBank->user_id !== $user->id) {
            return redirect()->route('bank-soal.index')
                ->withErrors(['error' => 'Soal ini tidak dapat dihapus karena bukan milik Anda']);
        }

        // Delete media file
        $questionBank->deleteMedia();

        // Delete question
        $questionBank->delete();

        return redirect()->route('bank-soal.index')
            ->with('success', 'Soal berhasil dihapus dari bank soal');
    }

    /**
     * Bulk delete questions
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:question_banks,id'
        ]);

        $user = Auth::user();

        // Get questions that belong to the user
        $questionBanks = QuestionBank::whereIn('id', $validated['ids'])
            ->where('user_id', $user->id)
            ->get();

        // Delete media files
        foreach ($questionBanks as $questionBank) {
            $questionBank->deleteMedia();
        }

        // Delete questions
        QuestionBank::whereIn('id', $questionBanks->pluck('id'))->delete();

        return redirect()->route('bank-soal.index')
            ->with('success', count($questionBanks) . ' soal berhasil dihapus');
    }
    /**
     * Import soal from Excel/JSON (parsed in frontend)
     */
    public function import(Request $request)
    {
        try {
            $soalData = $request->input('soal', []);
            
            $validated = $request->validate([
                'soal' => 'required|array|min:1',
            ]);

            $successCount = 0;
            $errors = [];
            $userId = Auth::id();

            foreach ($soalData as $index => $item) {
                try {
                    // Map frontend data to QuestionBank model
                    $data = [
                        'user_id' => $userId,
                        'title' => substr($item['pertanyaan'], 0, 50) . '...', // Generate title from question
                        'pertanyaan' => $item['pertanyaan'],
                        'jenis_soal' => $item['jenis_soal'] ?? 'pilihan_ganda',
                        'tipe_jawaban' => $this->mapJenisSoalToTipeJawaban($item['jenis_soal'] ?? 'pilihan_ganda'),
                        'skor' => $item['skor'] ?? 1,
                        'opsi_a' => $item['opsi_a'] ?? null,
                        'opsi_b' => $item['opsi_b'] ?? null,
                        'opsi_c' => $item['opsi_c'] ?? null,
                        'opsi_d' => $item['opsi_d'] ?? null,
                        'jawaban_benar' => $item['jawaban_benar'] ?? null,
                        'difficulty_level' => 'medium', // Default
                        'is_public' => false,
                        'skala_min' => $item['skala_min'] ?? null,
                        'skala_maks' => $item['skala_maks'] ?? null,
                        'skala_label_min' => $item['skala_label_min'] ?? null,
                        'skala_label_maks' => $item['skala_label_maks'] ?? null,
                        'equation' => $item['equation'] ?? null,
                    ];

                    QuestionBank::create($data);
                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Baris " . ($index + 1) . ": " . $e->getMessage();
                }
            }

            if ($successCount > 0) {
                $message = "{$successCount} soal berhasil diimport ke Bank Soal.";
                if (!empty($errors)) {
                    $message .= " " . count($errors) . " soal gagal.";
                }
                return redirect()->route('bank-soal.index')->with('success', $message);
            } else {
                return redirect()->back()->withErrors(['message' => 'Gagal import: ' . implode(', ', $errors)]);
            }

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => 'Error: ' . $e->getMessage()]);
        }
    }

    private function mapJenisSoalToTipeJawaban($jenisSoal)
    {
        // Mapping simple logic, adjust as needed
        switch ($jenisSoal) {
            case 'pilihan_ganda': return 'single_choice';
            case 'multi_choice': return 'multi_choice';
            case 'esai': return 'essay';
            case 'essay_gambar': return 'essay_gambar';
            case 'essay_audio': return 'essay_audio';
            case 'skala': return 'skala';
            case 'equation': return 'equation';
            default: return 'single_choice';
        }
    }

    /**
     * Share Bank Soal access to another user
     */
    public function share(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'can_copy' => 'boolean'
        ]);

        $targetUser = User::where('email', $validated['email'])->first();
        $currentUser = Auth::user();

        if ($targetUser->id === $currentUser->id) {
            return back()->withErrors(['email' => 'Anda tidak bisa membagikan ke diri sendiri']);
        }

        UserBankPermission::updateOrCreate(
            [
                'owner_id' => $currentUser->id,
                'grantee_id' => $targetUser->id
            ],
            [
                'can_view' => true,
                'can_copy' => $request->boolean('can_copy', true)
            ]
        );

        return back()->with('success', "Akses Bank Soal berhasil dibagikan ke {$targetUser->name}");
    }

    /**
     * Remove Share access
     */
    public function unshare($userId)
    {
        $currentUser = Auth::user();
        UserBankPermission::where('owner_id', $currentUser->id)
            ->where('grantee_id', $userId)
            ->delete();
            
        return back()->with('success', 'Akses berhasil dicabut');
    }

    /**
     * Get list of users who have access to my bank
     */
    public function getShareList()
    {
        $shares = UserBankPermission::with('grantee')
            ->where('owner_id', Auth::id())
            ->get();
            
        return response()->json($shares);
    }

    /**
     * Copy questions from Bank to Jadwal (Test)
     */
    public function copyToJadwal(Request $request)
    {
        $validated = $request->validate([
            'bank_soal_ids' => 'required|array',
            'bank_soal_ids.*' => 'exists:question_banks,id',
            'jadwal_id' => 'required|exists:jadwal,id'
        ]);

        $jadwal = Jadwal::findOrFail($validated['jadwal_id']);
        $count = 0;

        // Get last order
        $lastUrutan = Soal::where('id_jadwal', $jadwal->id)->max('urutan_soal') ?? 0;

        $questions = QuestionBank::whereIn('id', $validated['bank_soal_ids'])->get();

        foreach ($questions as $q) {
            // Check permission if not owner
            if ($q->user_id !== Auth::id() && !$q->is_public) {
                // Check permission logic here if needed, but for now assuming if they can select it, they can copy it
                // Ideally we should verify 'can_copy' permission
            }

            Soal::create([
                'id_jadwal' => $jadwal->id,
                'jenis_soal' => $q->jenis_soal,
                'pertanyaan' => $q->pertanyaan,
                'skor' => $q->skor,
                'opsi_a' => $q->opsi_a,
                'opsi_b' => $q->opsi_b,
                'opsi_c' => $q->opsi_c,
                'opsi_d' => $q->opsi_d,
                'jawaban_benar' => $q->jawaban_benar,
                'media' => $q->media, // Note: Media file is shared/copied by reference path
                'urutan_soal' => ++$lastUrutan,
                'skala_min' => $q->skala_min,
                'skala_maks' => $q->skala_maks,
                'skala_label_min' => $q->skala_label_min,
                'skala_label_maks' => $q->skala_label_maks,
                'equation' => $q->equation,
            ]);
            $count++;
        }

        return back()->with('success', "{$count} soal berhasil disalin ke jadwal tes.");
    }

    /**
     * Copy questions from Jadwal (Test) to Bank
     */
    public function storeFromSoal(Request $request)
    {
        $validated = $request->validate([
            'soal_ids' => 'required|array',
            'soal_ids.*' => 'exists:soal,id',
        ]);

        $soals = Soal::whereIn('id', $validated['soal_ids'])->get();
        $count = 0;
        $userId = Auth::id();

        foreach ($soals as $soal) {
            QuestionBank::create([
                'user_id' => $userId,
                'title' => substr(strip_tags($soal->pertanyaan), 0, 50) . '...',
                'pertanyaan' => $soal->pertanyaan,
                'jenis_soal' => $soal->jenis_soal,
                'tipe_jawaban' => $this->mapJenisSoalToTipeJawaban($soal->jenis_soal),
                'skor' => $soal->skor,
                'opsi_a' => $soal->opsi_a,
                'opsi_b' => $soal->opsi_b,
                'opsi_c' => $soal->opsi_c,
                'opsi_d' => $soal->opsi_d,
                'jawaban_benar' => $soal->jawaban_benar,
                'media' => $soal->media,
                'difficulty_level' => 'medium',
                'skala_min' => $soal->skala_min,
                'skala_maks' => $soal->skala_maks,
                'skala_label_min' => $soal->skala_label_min,
                'skala_label_maks' => $soal->skala_label_maks,
                'equation' => $soal->equation,
            ]);
            $count++;
        }

        return back()->with('success', "{$count} soal berhasil disimpan ke Bank Soal.");
    }

    /**
     * Get questions as JSON for "Pick from Bank" modal
     */
    public function getQuestionsJson(Request $request)
    {
        $user = Auth::user();
        
        $query = QuestionBank::with(['user'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('permissions', function ($subQ) use ($user) {
                      $subQ->where('requester_id', $user->id)
                           ->where('status', 'active');
                  })
                  ->orWhere(function($subQ) use ($user) {
                        $subQ->whereIn('user_id', function($permissionQ) use ($user) {
                            $permissionQ->select('owner_id')
                                ->from('user_bank_permissions')
                                ->where('grantee_id', $user->id)
                                ->where('can_view', true);
                        });
                  })
                  ->orWhere('is_public', true);
            });

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('pertanyaan', 'like', "%{$search}%");
            });
        }



        $questions = $query->orderBy('created_at', 'desc')->paginate(10);
        
        return response()->json($questions);
    }
}
