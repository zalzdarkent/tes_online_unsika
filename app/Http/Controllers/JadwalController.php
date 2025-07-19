<?php

namespace App\Http\Controllers;

use App\Models\Jadwal;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $jadwal = Jadwal::all();
        // return inertia rendering the index view with jadwal data
        return inertia('jadwal/jadwal', [
            'jadwal' => $jadwal,
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
        // Validasi input
        $validated = $request->validate([
            'nama_jadwal' => 'required|string|max:255|unique:jadwal,nama_jadwal',
            'tanggal_mulai' => 'required|date|after:now',
            'tanggal_berakhir' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:Buka,Tutup',
            'auto_close' => 'boolean',
            'id_jadwal_sebelumnya' => 'nullable|exists:jadwal,id',
        ], [
            'nama_jadwal.required' => 'Nama jadwal wajib diisi.',
            'nama_jadwal.unique' => 'Nama jadwal sudah digunakan.',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.after' => 'Tanggal mulai harus setelah waktu sekarang.',
            'tanggal_berakhir.required' => 'Tanggal berakhir wajib diisi.',
            'tanggal_berakhir.after' => 'Tanggal berakhir harus setelah tanggal mulai.',
            'status.required' => 'Status wajib dipilih.',
            'status.in' => 'Status harus Buka atau Tutup.',
            'id_jadwal_sebelumnya.exists' => 'Jadwal sebelumnya tidak valid.',
        ]);

        // Validasi tambahan: cek konflik jadwal
        $conflictingSchedule = Jadwal::where(function ($query) use ($validated) {
            $query->whereBetween('tanggal_mulai', [$validated['tanggal_mulai'], $validated['tanggal_berakhir']])
                  ->orWhereBetween('tanggal_berakhir', [$validated['tanggal_mulai'], $validated['tanggal_berakhir']])
                  ->orWhere(function ($q) use ($validated) {
                      $q->where('tanggal_mulai', '<=', $validated['tanggal_mulai'])
                        ->where('tanggal_berakhir', '>=', $validated['tanggal_berakhir']);
                  });
        })->first();

        if ($conflictingSchedule) {
            return back()->withErrors([
                'conflict' => "Jadwal bertabrakan dengan '{$conflictingSchedule->nama_jadwal}'. Silakan pilih waktu yang berbeda."
            ])->withInput();
        }

        // Set default auto_close jika tidak dikirim
        $validated['auto_close'] = $request->has('auto_close') ? $validated['auto_close'] : true;

        try {
            // Simpan jadwal baru
            $jadwal = Jadwal::create($validated);

            return redirect()->route('jadwal.index')->with('success', 'Jadwal berhasil ditambahkan!');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat menyimpan jadwal. Silakan coba lagi.'
            ])->withInput();
        }
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
