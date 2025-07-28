<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            'media' => 'nullable|file|mimes:jpg,jpeg,png,mp3,mpeg|max:5120', // 5120 KB = 5 MB
            // Validasi untuk skala
            'skala_min' => 'nullable|integer|min:1',
            'skala_maks' => 'nullable|integer|min:2',
            'skala_label_min' => 'nullable|string|max:255',
            'skala_label_maks' => 'nullable|string|max:255',
        ]);

        // Handle jawaban_benar untuk multi_choice
        if ($request->jenis_soal === 'multi_choice') {
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

        // Handle file upload jika ada media
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $path = $file->store('soal_media', 'public');
            $validated['media'] = $path;
        }

        // Tambahkan data skala jika jenis soal adalah skala
        if ($request->jenis_soal === 'skala') {
            $validated['skala_min'] = $request->skala_min;
            $validated['skala_maks'] = $request->skala_maks;
            $validated['skala_label_min'] = $request->skala_label_min;
            $validated['skala_label_maks'] = $request->skala_label_maks;
        }

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
        //
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
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return redirect()->back()->with('error', 'Tidak ada soal yang dipilih.');
        }
        \App\Models\Soal::whereIn('id', $ids)->delete();
        return redirect()->back()->with('success', count($ids) . ' soal berhasil dihapus!');
    }
}
