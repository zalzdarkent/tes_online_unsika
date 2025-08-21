<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class SoalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
        // Validasi request
        $validated = $request->validate([
            'id_jadwal' => 'required|integer|exists:jadwal,id',
            'jenis_soal' => 'required|string',
            'pertanyaan' => 'required|string',
            'skor' => 'required|integer|min:1',
            'opsi_a' => 'nullable|string',
            'opsi_b' => 'nullable|string',
            'opsi_c' => 'nullable|string',
            'opsi_d' => 'nullable|string',
            // Untuk multi_choice, jawaban_benar bisa array
            'jawaban_benar' => 'nullable',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,mp3,mpeg|max:70120', // 70120 KB = 68.5 MB
            // Validasi untuk skala
            'skala_min' => 'nullable|integer|min:1',
            'skala_maks' => 'nullable|integer|min:2',
            'skala_label_min' => 'nullable|string|max:255',
            'skala_label_maks' => 'nullable|string|max:255',
            'equation' => 'nullable|string'
        ]);

        // Handle jawaban_benar untuk multi_choice (di store dan update)
        if ($request->jenis_soal === 'pilihan_ganda_multi') {
            // Jika frontend mengirim array, ubah ke string CSV
            $jawabanMulti = $request->input('jawaban_benar');
            if (is_array($jawabanMulti)) {
                $validated['jawaban_benar'] = implode(',', $jawabanMulti);
            } else {
                $validated['jawaban_benar'] = $jawabanMulti;
            }
        }

        // Validasi khusus untuk skala
        if ($request->jenis_soal === 'skala') {
            $request->validate([
                'skala_min' => 'required|integer|min:1',
                'skala_maks' => 'required|integer|min:2|gt:skala_min',
                'skala_label_min' => 'required|string|max:255',
                'skala_label_maks' => 'required|string|max:255',
                'jawaban_benar' => 'required|numeric|between:' . $request->skala_min . ',' . $request->skala_maks,
            ], [
                'skala_maks.gt' => 'Nilai maksimum harus lebih besar dari nilai minimum.',
                'jawaban_benar.between' => 'Jawaban benar harus berada dalam rentang skala yang ditentukan.',
            ]);
        }

        if ($request->jenis_soal === 'equation') {
            $request->validate([
                'equation' => 'required|string',
                'jawaban_benar' => 'required|string',
            ]);
        }

        // Handle file upload jika ada media
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $path = $file->store('soal_media', 'public');
            $validated['media'] = $path;
        }

        // Tentukan urutan soal otomatis (urutan terakhir + 1)
        $lastUrutan = \App\Models\Soal::where('id_jadwal', $validated['id_jadwal'])
            ->max('urutan_soal');
        $validated['urutan_soal'] = ($lastUrutan ?? 0) + 1;

        // Simpan ke database
        $soal = \App\Models\Soal::create($validated);

        // Redirect back dengan pesan sukses
        return redirect()->back()->with('success', 'Soal berhasil ditambahkan!');
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
        $soal = \App\Models\Soal::findOrFail($id);

        // Validasi request
        $validated = $request->validate([
            'id_jadwal' => 'required|integer|exists:jadwal,id',
            'jenis_soal' => 'required|string',
            'pertanyaan' => 'required|string',
            'skor' => 'required|integer|min:1',
            'opsi_a' => 'nullable|string',
            'opsi_b' => 'nullable|string',
            'opsi_c' => 'nullable|string',
            'opsi_d' => 'nullable|string',
            'jawaban_benar' => 'nullable',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,mp3,mpeg|max:70120',
            'skala_min' => 'nullable|integer|min:1',
            'skala_maks' => 'nullable|integer|min:2',
            'skala_label_min' => 'nullable|string|max:255',
            'skala_label_maks' => 'nullable|string|max:255',
            'equation' => 'nullable|string'
        ]);

        // Handle jawaban_benar untuk multi_choice (di update juga)
        if ($request->jenis_soal === 'pilihan_ganda_multi') {
            $jawabanMulti = $request->input('jawaban_benar');
            if (is_array($jawabanMulti)) {
                $validated['jawaban_benar'] = implode(',', $jawabanMulti);
            } else {
                $validated['jawaban_benar'] = $jawabanMulti;
            }
        }

        // Validasi khusus untuk pilihan ganda
        if (in_array($request->jenis_soal, ['pilihan_ganda', 'pilihan_ganda_multi'])) {
            $request->validate([
                'opsi_a' => 'required|string',
                'opsi_b' => 'required|string',
                'opsi_c' => 'required|string',
                'opsi_d' => 'required|string',
                'jawaban_benar' => 'required',
            ]);
        }

        // Validasi khusus untuk essay
        if ($request->jenis_soal === 'esai') {
            $request->validate([
                'jawaban_benar' => 'required|string',
            ]);
        }

        // Validasi khusus untuk skala
        if ($request->jenis_soal === 'skala') {
            $request->validate([
                'skala_min' => 'required|integer|min:1',
                'skala_maks' => 'required|integer|min:2|gt:skala_min',
                'skala_label_min' => 'required|string|max:255',
                'skala_label_maks' => 'required|string|max:255',
                'jawaban_benar' => 'required|numeric|between:' . $request->skala_min . ',' . $request->skala_maks,
            ], [
                'skala_maks.gt' => 'Nilai maksimum harus lebih besar dari nilai minimum.',
                'jawaban_benar.between' => 'Jawaban benar harus berada dalam rentang skala yang ditentukan.',
            ]);
        }

        // Validasi khusus untuk equation
        if ($request->jenis_soal === 'equation') {
            $request->validate([
                'equation' => 'required|string',
                'jawaban_benar' => 'required|string',
            ]);
        }

        // Handle file upload jika ada media baru
        if ($request->hasFile('media')) {
            // Delete file lama jika ada
            if ($soal->media && Storage::disk('public')->exists($soal->media)) {
                Storage::disk('public')->delete($soal->media);
            }

            $file = $request->file('media');
            $path = $file->store('soal_media', 'public');
            $validated['media'] = $path;
        }

        // Update soal
        $soal->update($validated);

        return redirect()->back()->with('success', 'Soal berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $soal = \App\Models\Soal::findOrFail($id);
        $soal->delete();
        return redirect()->back()->with('success', 'Soal berhasil dihapus!');
    }

    /**
     * Bulk delete soal.
     */
    public function bulkDelete(Request $request)
    {
        try {
            $ids = $request->input('ids', []);
            
            if (!is_array($ids) || empty($ids)) {
                return redirect()->back()->with('error', 'Tidak ada soal yang dipilih.');
            }

            // Validasi maksimal 100 items
            if (count($ids) > 100) {
                return redirect()->back()->with('error', 'Maksimal 100 soal dapat dihapus sekaligus.');
            }

            // Hapus soal berdasarkan ID
            $deletedCount = \App\Models\Soal::whereIn('id', $ids)->delete();
            
            if ($deletedCount > 0) {
                return redirect()->back()->with('success', $deletedCount . ' soal berhasil dihapus!');
            } else {
                return redirect()->back()->with('error', 'Tidak ada soal yang berhasil dihapus.');
            }
            
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menghapus soal: ' . $e->getMessage());
        }
    }

    /**
     * Import soal from Excel/CSV file.
     */
    public function import(Request $request)
    {
        try {
            $validated = $request->validate([
                'soal' => 'required|array|min:1',
                'soal.*.id_jadwal' => 'required|integer|exists:jadwal,id',
                'soal.*.jenis_soal' => 'required|string|in:pilihan_ganda,multi_choice,esai,essay_gambar,essay_audio,skala,equation',
                'soal.*.pertanyaan' => 'required|string',
                'soal.*.skor' => 'required|integer|min:1',
                'soal.*.opsi_a' => 'nullable|string',
                'soal.*.opsi_b' => 'nullable|string',
                'soal.*.opsi_c' => 'nullable|string',
                'soal.*.opsi_d' => 'nullable|string',
                'soal.*.jawaban_benar' => 'required|string',
                'soal.*.skala_min' => 'nullable|integer|min:1',
                'soal.*.skala_maks' => 'nullable|integer|min:2',
                'soal.*.skala_label_min' => 'nullable|string|max:255',
                'soal.*.skala_label_maks' => 'nullable|string|max:255',
                'soal.*.equation' => 'nullable|string'
            ]);

            $soalData = $validated['soal'];
            $successCount = 0;
            $errors = [];

            foreach ($soalData as $index => $soal) {
                try {
                    // Validasi khusus berdasarkan jenis soal
                    if (in_array($soal['jenis_soal'], ['pilihan_ganda', 'multi_choice'])) {
                        if (empty($soal['opsi_a']) || empty($soal['opsi_b'])) {
                            throw new \Exception("Opsi A dan B wajib diisi untuk soal pilihan ganda pada baris " . ($index + 1));
                        }
                    }

                    if ($soal['jenis_soal'] === 'skala') {
                        if (empty($soal['skala_min']) || empty($soal['skala_maks'])) {
                            throw new \Exception("Skala min dan max wajib diisi untuk soal skala pada baris " . ($index + 1));
                        }
                        if ($soal['skala_maks'] <= $soal['skala_min']) {
                            throw new \Exception("Skala maksimum harus lebih besar dari minimum pada baris " . ($index + 1));
                        }
                    }

                    // Buat soal baru
                    \App\Models\Soal::create([
                        'id_jadwal' => $soal['id_jadwal'],
                        'urutan_soal' => $index + 1, // Gunakan index + 1 sebagai urutan
                        'jenis_soal' => $soal['jenis_soal'],
                        'pertanyaan' => $soal['pertanyaan'],
                        'skor' => $soal['skor'],
                        'opsi_a' => $soal['opsi_a'] ?? null,
                        'opsi_b' => $soal['opsi_b'] ?? null,
                        'opsi_c' => $soal['opsi_c'] ?? null,
                        'opsi_d' => $soal['opsi_d'] ?? null,
                        'jawaban_benar' => $soal['jawaban_benar'],
                        'skala_min' => $soal['skala_min'] ?? null,
                        'skala_maks' => $soal['skala_maks'] ?? null,
                        'skala_label_min' => $soal['skala_label_min'] ?? null,
                        'skala_label_maks' => $soal['skala_label_maks'] ?? null,
                        'equation' => $soal['equation'] ?? null,
                    ]);

                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Baris " . ($index + 1) . ": " . $e->getMessage();
                }
            }

            if ($successCount > 0) {
                $message = "{$successCount} soal berhasil diimport.";
                if (!empty($errors)) {
                    $message .= " " . count($errors) . " soal gagal diimport.";
                }
                return redirect()->back()->with('success', $message);
            } else {
                return redirect()->back()->withErrors(['message' => 'Tidak ada soal yang berhasil diimport. ' . implode(' ', $errors)]);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = collect($e->errors())->flatten()->toArray();
            return redirect()->back()->withErrors([
                'message' => 'Data tidak valid: ' . implode(', ', $errors)
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Download template file for soal import.
     */
    public function downloadTemplate()
    {
        $filePath = public_path('template-soal.xlsx');

        if (!file_exists($filePath)) {
            abort(404, 'Template file tidak ditemukan.');
        }

        $filename = 'template-soal.xlsx';
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return response()->download($filePath, $filename, $headers);
    }
}
