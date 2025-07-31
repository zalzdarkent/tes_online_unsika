<?php

namespace App\Http\Controllers;

use App\Models\Jadwal;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class JadwalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function soal($jadwalId)
    {
        $userId = Auth::id();
        $jadwal = Jadwal::where('id', $jadwalId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $soal = $jadwal->soal()->orderBy('created_at', 'asc')->get();

        return inertia('jadwal/soal', [
            'jadwal' => $jadwal,
            'soal' => $soal,
        ]);
    }

    public function index()
    {
        // Auto-update expired jadwal status setiap kali ada request
        Jadwal::updateExpiredJadwalStatus();

        // Hanya tampilkan jadwal milik user yang sedang login
        $userId = Auth::id();
        $jadwal = Jadwal::where('user_id', $userId)
            ->with('kategori') // Load relasi kategori
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($item) {
                // Status sudah diupdate otomatis di atas, langsung ambil dari database
                return [
                    'id' => $item->id,
                    'nama_jadwal' => $item->nama_jadwal,
                    'tanggal_mulai' => $item->tanggal_mulai,
                    'tanggal_berakhir' => $item->tanggal_berakhir,
                    'status' => $item->status, // Langsung ambil dari database
                    'auto_close' => $item->auto_close,
                    'user_id' => $item->user_id,
                    'id_jadwal_sebelumnya' => $item->id_jadwal_sebelumnya,
                    'durasi' => $item->durasi,
                    'kategori' => $item->kategori ? $item->kategori->nama : '-',
                    'kategori_tes_id' => $item->kategori_tes_id,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            });

        // return inertia rendering the index view with jadwal data
        return inertia('jadwal/jadwal', [
            'jadwal' => $jadwal,
            'kategoriTes' => \App\Models\KategoriTes::where('user_id', $userId)->get(['id', 'nama']),
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
    private function generateKodeJadwal($namaJadwal)
    {
        // Ambil 2-3 huruf pertama dari setiap kata
        $words = explode(' ', strtoupper($namaJadwal));
        $kode = '';
        foreach ($words as $word) {
            $kode .= substr($word, 0, min(strlen($word), 2));
        }
        $kode = substr($kode, 0, 3); // Ambil maksimal 3 karakter

        // Tambahkan 2 digit tahun
        $kode .= date('y');

        // Cari nomor urut terakhir dengan prefix yang sama
        $lastKode = Jadwal::where('kode_jadwal', 'like', $kode . '%')
            ->orderBy('kode_jadwal', 'desc')
            ->first();

        if ($lastKode) {
            // Ambil 3 digit terakhir dan tambah 1
            $lastNumber = intval(substr($lastKode->kode_jadwal, -3));
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return $kode . $newNumber;
    }

    public function store(Request $request)
    {
        // Validasi input
        $validated = $request->validate([
            'nama_jadwal' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_berakhir' => 'required|date|after:tanggal_mulai',
            // 'status' dihapus, otomatis diisi
            'auto_close' => 'boolean',
            'id_jadwal_sebelumnya' => 'nullable|exists:jadwal,id',
            'kategori_tes_id' => 'nullable|exists:kategori_tes,id',
            'durasi' => 'nullable|integer|min:1|max:1440', // maksimal 24 jam (1440 menit)
        ], [
            'nama_jadwal.required' => 'Nama jadwal wajib diisi.',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_berakhir.required' => 'Tanggal berakhir wajib diisi.',
            'tanggal_berakhir.date' => 'Format tanggal berakhir tidak valid.',
            'tanggal_berakhir.after' => 'Tanggal berakhir harus setelah tanggal mulai.',
            // 'status' dihapus
            'id_jadwal_sebelumnya.exists' => 'Jadwal sebelumnya tidak valid.',
            'kategori_tes_id.exists' => 'Kategori tes tidak valid.',
            'durasi.integer' => 'Durasi harus berupa angka.',
            'durasi.min' => 'Durasi minimal 1 menit.',
            'durasi.max' => 'Durasi maksimal 1440 menit (24 jam).',
        ]);

        $userId = Auth::id();

        // Validasi unique nama_jadwal per user
        $existingJadwal = Jadwal::where('user_id', $userId)
            ->where('nama_jadwal', $validated['nama_jadwal'])
            ->first();

        if ($existingJadwal) {
            return back()->withErrors([
                'nama_jadwal' => 'Nama jadwal sudah digunakan.'
            ])->withInput();
        }

        // Validasi tambahan: pastikan tanggal mulai setelah waktu sekarang
        $now = now()->setTimezone('Asia/Jakarta');
        $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai'])->setTimezone('Asia/Jakarta');

        if ($tanggalMulai->lte($now)) {
            return back()->withErrors([
                'tanggal_mulai' => 'Tanggal mulai harus setelah waktu sekarang.'
            ])->withInput();
        }

        // Validasi tambahan: cek konflik jadwal untuk user yang sama
        $conflictingSchedule = Jadwal::where('user_id', $userId)
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
                'conflict' => "Jadwal bertabrakan dengan '{$conflictingSchedule->getAttribute('nama_jadwal')}'. Silakan pilih waktu yang berbeda."
            ])->withInput();
        }

        // Validasi id_jadwal_sebelumnya harus milik user yang sama
        if ($validated['id_jadwal_sebelumnya']) {
            $jadwalSebelumnya = Jadwal::where('id', $validated['id_jadwal_sebelumnya'])
                ->where('user_id', $userId)
                ->first();

            if (!$jadwalSebelumnya) {
                return back()->withErrors([
                    'id_jadwal_sebelumnya' => 'Jadwal sebelumnya tidak valid atau bukan milik Anda.'
                ])->withInput();
            }
        }


        // Set default auto_close jika tidak dikirim
        $validated['auto_close'] = $request->has('auto_close') ? $validated['auto_close'] : true;
        // Set status otomatis Buka
        $validated['status'] = 'Buka';
        // Tambahkan user_id secara otomatis
        $validated['user_id'] = $userId;

        try {
            // Konversi tanggal ke format database yang benar
            $validated['tanggal_mulai'] = \Carbon\Carbon::parse($validated['tanggal_mulai'])->format('Y-m-d H:i:s');
            $validated['tanggal_berakhir'] = \Carbon\Carbon::parse($validated['tanggal_berakhir'])->format('Y-m-d H:i:s');

            // Generate dan set kode jadwal
            $validated['kode_jadwal'] = $this->generateKodeJadwal($validated['nama_jadwal']);

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
        $userId = Auth::id();
        $jadwal = Jadwal::where('id', $id)
            ->where('user_id', $userId)
            ->with('kategori')
            ->firstOrFail();

        return response()->json([
            'jadwal' => $jadwal,
            'kategoriTes' => \App\Models\KategoriTes::where('user_id', $userId)->get(['id', 'nama']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Jadwal $jadwal)
    {
        $userId = Auth::id();

        // Pastikan jadwal adalah milik user yang login
        if ($jadwal->getAttribute('user_id') !== $userId) {
            abort(403, 'Anda tidak memiliki akses untuk mengedit jadwal ini.');
        }

        // Validasi input
        $validated = $request->validate([
            'nama_jadwal' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_berakhir' => 'required|date|after:tanggal_mulai',
            // 'status' dihapus, otomatis diisi
            'auto_close' => 'boolean',
            'id_jadwal_sebelumnya' => 'nullable|exists:jadwal,id',
            'kategori_tes_id' => 'nullable|exists:kategori_tes,id',
            'durasi' => 'nullable|integer|min:1|max:1440', // maksimal 24 jam (1440 menit)
        ], [
            'nama_jadwal.required' => 'Nama jadwal wajib diisi.',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_berakhir.required' => 'Tanggal berakhir wajib diisi.',
            'tanggal_berakhir.date' => 'Format tanggal berakhir tidak valid.',
            'tanggal_berakhir.after' => 'Tanggal berakhir harus setelah tanggal mulai.',
            // 'status' dihapus
            'id_jadwal_sebelumnya.exists' => 'Jadwal sebelumnya tidak valid.',
            'kategori_tes_id.exists' => 'Kategori tes tidak valid.',
            'durasi.integer' => 'Durasi harus berupa angka.',
            'durasi.min' => 'Durasi minimal 1 menit.',
            'durasi.max' => 'Durasi maksimal 1440 menit (24 jam).',
        ]);

        // Validasi unique nama_jadwal per user (kecuali untuk jadwal yang sedang diedit)
        $existingJadwal = Jadwal::where('user_id', $userId)
            ->where('nama_jadwal', $validated['nama_jadwal'])
            ->where('id', '!=', $jadwal->getAttribute('id'))
            ->first();

        if ($existingJadwal) {
            return back()->withErrors([
                'nama_jadwal' => 'Nama jadwal sudah digunakan.'
            ])->withInput();
        }

        // Validasi tambahan: jika status jadwal sedang berjalan, tidak boleh mengubah tanggal
        $now = now()->setTimezone('Asia/Jakarta');
        $currentStart = \Carbon\Carbon::parse($jadwal->getAttribute('tanggal_mulai'))->setTimezone('Asia/Jakarta');
        $currentEnd = \Carbon\Carbon::parse($jadwal->getAttribute('tanggal_berakhir'))->setTimezone('Asia/Jakarta');

        $isCurrentlyActive = $now->between($currentStart, $currentEnd);

        if ($isCurrentlyActive) {
            $newStart = \Carbon\Carbon::parse($validated['tanggal_mulai'])->setTimezone('Asia/Jakarta');
            $newEnd = \Carbon\Carbon::parse($validated['tanggal_berakhir'])->setTimezone('Asia/Jakarta');

            // Jika jadwal sedang berjalan, cek apakah ada perubahan tanggal
            if (!$newStart->equalTo($currentStart) || !$newEnd->equalTo($currentEnd)) {
                return back()->withErrors([
                    'tanggal' => 'Tidak dapat mengubah tanggal jadwal yang sedang berlangsung.'
                ])->withInput();
            }
        }

        // Validasi tambahan: cek konflik jadwal untuk user yang sama (kecuali jadwal yang sedang diedit)
        $conflictingSchedule = Jadwal::where('user_id', $userId)
            ->where('id', '!=', $jadwal->getAttribute('id'))
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
                'conflict' => "Jadwal bertabrakan dengan '{$conflictingSchedule->getAttribute('nama_jadwal')}'. Silakan pilih waktu yang berbeda."
            ])->withInput();
        }

        // Validasi id_jadwal_sebelumnya harus milik user yang sama
        if ($validated['id_jadwal_sebelumnya']) {
            $jadwalSebelumnya = Jadwal::where('id', $validated['id_jadwal_sebelumnya'])
                ->where('user_id', $userId)
                ->first();

            if (!$jadwalSebelumnya) {
                return back()->withErrors([
                    'id_jadwal_sebelumnya' => 'Jadwal sebelumnya tidak valid atau bukan milik Anda.'
                ])->withInput();
            }
        }

        // Set default auto_close jika tidak dikirim
        $validated['auto_close'] = $request->has('auto_close') ? $validated['auto_close'] : true;

        try {
            // Konversi tanggal ke format database yang benar
            $validated['tanggal_mulai'] = \Carbon\Carbon::parse($validated['tanggal_mulai'])->format('Y-m-d H:i:s');
            $validated['tanggal_berakhir'] = \Carbon\Carbon::parse($validated['tanggal_berakhir'])->format('Y-m-d H:i:s');

            // Jika nama jadwal berubah, generate kode baru
            if ($jadwal->nama_jadwal !== $validated['nama_jadwal']) {
                $validated['kode_jadwal'] = $this->generateKodeJadwal($validated['nama_jadwal']);
            }

            // Update jadwal
            $jadwal->update($validated);

            return redirect()->route('jadwal.index')->with('success', 'Jadwal berhasil diperbarui!');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat memperbarui jadwal. Silakan coba lagi.'
            ])->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $jadwal = Jadwal::findOrFail($id);

            $userId = Auth::id();

            // Pastikan jadwal adalah milik user yang login
            if ($jadwal->getAttribute('user_id') !== $userId) {
                abort(403, 'Anda tidak memiliki akses untuk menghapus jadwal ini.');
            }

            // Check if there are any related jadwal that reference this one
            $relatedJadwal = Jadwal::where('id_jadwal_sebelumnya', $id)
                ->where('user_id', $userId) // Hanya cek jadwal milik user yang sama
                ->first();

            if ($relatedJadwal) {
                return back()->withErrors([
                    'error' => "Tidak dapat menghapus jadwal '{$jadwal->getAttribute('nama_jadwal')}' karena masih direferensikan oleh jadwal '{$relatedJadwal->getAttribute('nama_jadwal')}'."
                ]);
            }

            $namaJadwal = $jadwal->getAttribute('nama_jadwal');
            $jadwal->delete();

            return redirect()->route('jadwal.index')->with('success', "Jadwal '{$namaJadwal}' berhasil dihapus!");
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat menghapus jadwal. Silakan coba lagi.'
            ]);
        }
    }

    /**
     * Remove multiple resources from storage (bulk delete).
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:jadwal,id',
        ], [
            'ids.required' => 'Pilih minimal satu jadwal untuk dihapus.',
            'ids.array' => 'Format data tidak valid.',
            'ids.min' => 'Pilih minimal satu jadwal untuk dihapus.',
            'ids.*.exists' => 'Salah satu jadwal tidak valid.',
        ]);

        try {
            $ids = $validated['ids'];
            $userId = Auth::id();

            // Pastikan semua jadwal yang akan dihapus milik user yang login
            $jadwalToDelete = Jadwal::whereIn('id', $ids)
                ->where('user_id', $userId)
                ->get();

            if ($jadwalToDelete->count() !== count($ids)) {
                abort(403, 'Anda tidak memiliki akses untuk menghapus beberapa jadwal yang dipilih.');
            }

            // Check for any related jadwal that reference the ones to be deleted
            $relatedJadwal = Jadwal::whereIn('id_jadwal_sebelumnya', $ids)
                ->where('user_id', $userId) // Hanya cek jadwal milik user yang sama
                ->whereNotIn('id', $ids) // Exclude the ones being deleted
                ->first();

            if ($relatedJadwal) {
                $referencedJadwal = Jadwal::find($relatedJadwal->getAttribute('id_jadwal_sebelumnya'));
                return back()->withErrors([
                    'error' => "Tidak dapat menghapus jadwal '{$referencedJadwal->getAttribute('nama_jadwal')}' karena masih direferensikan oleh jadwal '{$relatedJadwal->getAttribute('nama_jadwal')}'."
                ]);
            }

            $deletedCount = Jadwal::whereIn('id', $ids)
                ->where('user_id', $userId)
                ->delete();

            return redirect()->route('jadwal.index')->with('success', "{$deletedCount} jadwal berhasil dihapus!");
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan saat menghapus jadwal. Silakan coba lagi.'
            ]);
        }
    }
}
