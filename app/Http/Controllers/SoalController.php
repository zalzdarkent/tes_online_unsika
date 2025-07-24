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

        // Handle file upload jika ada media
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $path = $file->store('soal_media', 'public');
            $validated['media_path'] = $path;
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
    public function destroy(string $id)
    {
        //
    }
}
