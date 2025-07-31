<?php

namespace App\Http\Controllers;

use App\Models\KategoriTes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KategoriTesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $kategori = KategoriTes::byUser(Auth::id())
            ->withCount('jadwal') // Ini akan menambahkan kolom jadwal_count
            ->get()
            ->map(function ($kategori) {
                $kategori->jumlah_jadwal = $kategori->jadwal_count;
                return $kategori;
            });
        return Inertia::render('jadwal/kategori', [
            'kategori' => $kategori
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
    private function generateKodeKategori($nama)
    {
        // Ambil 2-3 huruf pertama dari setiap kata
        $words = explode(' ', strtoupper($nama));
        $kode = '';
        foreach ($words as $word) {
            $kode .= substr($word, 0, min(strlen($word), 2));
        }
        $kode = substr($kode, 0, 4); // Ambil maksimal 4 karakter

        // Cari nomor urut terakhir dengan prefix yang sama
        $lastKode = KategoriTes::where('kode_kategori', 'like', $kode . '%')
            ->orderBy('kode_kategori', 'desc')
            ->first();

        if ($lastKode) {
            // Ambil 3 digit terakhir dan tambah 1
            $lastNumber = intval(substr($lastKode->kode_kategori, -3));
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return $kode . $newNumber;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => [
                'required',
                'string',
                'max:255',
                Rule::unique('kategori_tes', 'nama')
                    ->where('user_id', Auth::id())
            ],
        ], [
            'nama.required' => 'Nama kategori harus diisi',
            'nama.max' => 'Nama kategori maksimal 255 karakter',
            'nama.unique' => 'Nama kategori sudah digunakan',
        ]);

        $kategori = new KategoriTes();
        $kategori->nama = $validated['nama'];
        $kategori->user_id = Auth::id();
        $kategori->kode_kategori = $this->generateKodeKategori($validated['nama']);
        $kategori->save();

        return redirect()->back();
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
        $kategori = KategoriTes::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'nama' => [
                'required',
                'string',
                'max:255',
                Rule::unique('kategori_tes', 'nama')
                    ->where('user_id', Auth::id())
                    ->ignore($kategori->id)
            ],
        ], [
            'nama.required' => 'Nama kategori harus diisi',
            'nama.max' => 'Nama kategori maksimal 255 karakter',
            'nama.unique' => 'Nama kategori sudah digunakan',
        ]);

        // Jika nama berubah, generate kode baru
        if ($kategori->nama !== $validated['nama']) {
            $validated['kode_kategori'] = $this->generateKodeKategori($validated['nama']);
        }

        $kategori->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $kategori = KategoriTes::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if ($kategori->jadwal()->exists()) {
            return back()->withErrors(['error' => 'Kategori ini masih memiliki jadwal terkait']);
        }

        $kategori->delete();
        return back();
    }

    /**
     * Remove multiple resources from storage.
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:kategori_tes,id'
        ]);

        $kategoris = KategoriTes::whereIn('id', $validated['ids'])
            ->where('user_id', Auth::id())
            ->get();

        // Check if any of the categories have related schedules
        foreach ($kategoris as $kategori) {
            if ($kategori->jadwal()->exists()) {
                return back()->withErrors(['error' => 'Beberapa kategori masih memiliki jadwal terkait']);
            }
        }

        KategoriTes::whereIn('id', $validated['ids'])
            ->where('user_id', Auth::id())
            ->delete();

        return back();
    }
}
