<?php

namespace App\Http\Controllers;

use App\Models\QuestionBank;
use App\Models\KategoriTes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class QuestionBankController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Debug log untuk melihat filter yang diterima
        Log::info('QuestionBank Filter Debug:', [
            'kategori' => $request->get('kategori'),
            'difficulty' => $request->get('difficulty'),
            'jenis_soal' => $request->get('jenis_soal'),
            'ownership' => $request->get('ownership'),
            'search' => $request->get('search')
        ]);

        // Query dasar untuk soal yang bisa diakses user
        $query = QuestionBank::with(['user', 'kategori'])
            ->accessibleBy($user->id);

        // Filter berdasarkan kategori jika ada
        if ($request->filled('kategori')) {
            $query->where('kategori_tes_id', $request->kategori);
        }

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

        // Filter kepemilikan
        $ownership = $request->get('ownership', 'all'); // all, mine, shared, public
        switch ($ownership) {
            case 'mine':
                $query->where('user_id', $user->id);
                break;
            case 'shared':
                $query->where('user_id', '!=', $user->id)
                      ->whereHas('permissions', function ($q) use ($user) {
                          $q->where('requester_id', $user->id)
                            ->where('status', 'active');
                      });
                break;
            case 'public':
                $query->where('is_public', true)
                      ->where('user_id', '!=', $user->id);
                break;
        }

        $questionBanks = $query->withCount('soals as actual_usage_count')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Get kategori untuk filter dropdown
        $kategoriList = KategoriTes::byUser($user->id)->get();

        return Inertia::render('bank-soal/index', [
            'questionBanks' => $questionBanks,
            'kategoriList' => $kategoriList,
            'filters' => $request->only(['kategori', 'difficulty', 'jenis_soal', 'search', 'ownership'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = Auth::user();
        $kategoriList = KategoriTes::byUser($user->id)->get();

        return Inertia::render('bank-soal/create', [
            'kategoriList' => $kategoriList
        ]);
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
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'is_public' => 'nullable|boolean',
            'kategori_tes_id' => 'nullable|exists:kategori_tes,id'
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
        $questionBank->load(['user', 'kategori']);

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

        $kategoriList = KategoriTes::byUser($user->id)->get();

        return Inertia::render('bank-soal/edit', [
            'questionBank' => $questionBank,
            'kategoriList' => $kategoriList
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
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'is_public' => 'boolean',
            'kategori_tes_id' => 'nullable|exists:kategori_tes,id'
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
     * Remove the specified resource from storage.
     */
    public function destroy($bankSoal)
    {
        $questionBank = QuestionBank::findOrFail($bankSoal);
        $user = Auth::user();

        // Only owner can delete
        if ($questionBank->user_id !== $user->id) {
            return redirect()->route('bank-soal.index')
                ->withErrors(['error' => 'Anda hanya bisa menghapus soal milik sendiri']);
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
}
