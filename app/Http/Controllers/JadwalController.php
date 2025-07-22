<?php

namespace App\Http\Controllers;

use App\Models\Jadwal;
use Illuminate\Http\Request;
use Carbon\Carbon;

class JadwalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $jadwal = Jadwal::all()->map(function ($item) {
            return [
                'id' => $item->id,
                'nama_jadwal' => $item->nama_jadwal,
                'tanggal_mulai' => $item->tanggal_mulai,
                'tanggal_berakhir' => $item->tanggal_berakhir,
                'status' => $item->status,
                'auto_close' => $item->auto_close,
                'id_jadwal_sebelumnya' => $item->id_jadwal_sebelumnya,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        });

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
            'tanggal_mulai' => 'required|date',
            'tanggal_berakhir' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:Buka,Tutup',
            'auto_close' => 'boolean',
            'id_jadwal_sebelumnya' => 'nullable|exists:jadwal,id',
        ], [
            'nama_jadwal.required' => 'Nama jadwal wajib diisi.',
            'nama_jadwal.unique' => 'Nama jadwal sudah digunakan.',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_berakhir.required' => 'Tanggal berakhir wajib diisi.',
            'tanggal_berakhir.date' => 'Format tanggal berakhir tidak valid.',
            'tanggal_berakhir.after' => 'Tanggal berakhir harus setelah tanggal mulai.',
            'status.required' => 'Status wajib dipilih.',
            'status.in' => 'Status harus Buka atau Tutup.',
            'id_jadwal_sebelumnya.exists' => 'Jadwal sebelumnya tidak valid.',
        ]);

        // Validasi tambahan: pastikan tanggal mulai setelah waktu sekarang
        $now = now()->setTimezone('Asia/Jakarta');
        $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai'])->setTimezone('Asia/Jakarta');

        if ($tanggalMulai->lte($now)) {
            return back()->withErrors([
                'tanggal_mulai' => 'Tanggal mulai harus setelah waktu sekarang.'
            ])->withInput();
        }

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
            // Konversi tanggal ke format database yang benar
            $validated['tanggal_mulai'] = \Carbon\Carbon::parse($validated['tanggal_mulai'])->format('Y-m-d H:i:s');
            $validated['tanggal_berakhir'] = \Carbon\Carbon::parse($validated['tanggal_berakhir'])->format('Y-m-d H:i:s');

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
        $jadwal = Jadwal::findOrFail($id);
        return response()->json($jadwal);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $jadwal = Jadwal::findOrFail($id);

        // Validasi input
        $validated = $request->validate([
            'nama_jadwal' => 'required|string|max:255|unique:jadwal,nama_jadwal,' . $id,
            'tanggal_mulai' => 'required|date',
            'tanggal_berakhir' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:Buka,Tutup',
            'auto_close' => 'boolean',
            'id_jadwal_sebelumnya' => 'nullable|exists:jadwal,id',
        ], [
            'nama_jadwal.required' => 'Nama jadwal wajib diisi.',
            'nama_jadwal.unique' => 'Nama jadwal sudah digunakan.',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_berakhir.required' => 'Tanggal berakhir wajib diisi.',
            'tanggal_berakhir.date' => 'Format tanggal berakhir tidak valid.',
            'tanggal_berakhir.after' => 'Tanggal berakhir harus setelah tanggal mulai.',
            'status.required' => 'Status wajib dipilih.',
            'status.in' => 'Status harus Buka atau Tutup.',
            'id_jadwal_sebelumnya.exists' => 'Jadwal sebelumnya tidak valid.',
        ]);

        // Validasi tambahan: pastikan tanggal mulai setelah waktu sekarang (hanya jika jadwal belum dimulai)
        $now = now()->setTimezone('Asia/Jakarta');
        $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai'])->setTimezone('Asia/Jakarta');
        $jadwalMulaiLama = \Carbon\Carbon::parse($jadwal->tanggal_mulai)->setTimezone('Asia/Jakarta');

        // Hanya validasi tanggal masa depan jika jadwal belum dimulai
        if ($jadwalMulaiLama->gt($now) && $tanggalMulai->lte($now)) {
            return back()->withErrors([
                'tanggal_mulai' => 'Tanggal mulai harus setelah waktu sekarang.'
            ])->withInput();
        }

        // Validasi tambahan: cek konflik jadwal (kecuali dengan jadwal yang sedang diedit)
        $conflictingSchedule = Jadwal::where('id', '!=', $id)
            ->where(function ($query) use ($validated) {
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
            // Konversi tanggal ke format database yang benar
            $validated['tanggal_mulai'] = \Carbon\Carbon::parse($validated['tanggal_mulai'])->format('Y-m-d H:i:s');
            $validated['tanggal_berakhir'] = \Carbon\Carbon::parse($validated['tanggal_berakhir'])->format('Y-m-d H:i:s');

            // Update jadwal
            $jadwal->update($validated);

            return redirect()->route('jadwal.index')->with('success', 'Jadwal berhasil diupdate!');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat mengupdate jadwal. Silakan coba lagi.'
            ])->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
