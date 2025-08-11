<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Optimalisasi: Batasi jumlah data dan gunakan pagination jika diperlukan
        $users = User::select('id', 'username', 'nama', 'email', 'role', 'alamat', 'no_hp', 'foto', 'created_at', 'updated_at', 'prodi', 'fakultas', 'universitas', 'npm')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('admin/users/index', [
            'users' => $users
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'nama' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,teacher,peserta',
            'alamat' => 'nullable|string|max:500',
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'prodi' => 'nullable|string|max:100',
            'fakultas' => 'nullable|string|max:100',
            'universitas' => 'nullable|string|max:100',
            'npm' => 'nullable|string|max:100',
        ]);

        $userData = [
            'username' => $request->username,
            'nama' => $request->nama,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'prodi' => $request->prodi,
            'fakultas' => $request->fakultas,
            'universitas' => $request->universitas,
            'npm' => $request->npm,
        ];

        // Handle foto upload
        if ($request->hasFile('foto')) {
            $foto = $request->file('foto');
            $fotoName = time() . '_' . $foto->getClientOriginalName();
            $foto->storeAs('public/users', $fotoName);
            $userData['foto'] = 'users/' . $fotoName;
        }

        User::create($userData);

        return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],

            'nama' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:admin,teacher,peserta',
            'alamat' => 'nullable|string|max:500',
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'prodi' => 'nullable|string|max:100',
            'fakultas' => 'nullable|string|max:100',
            'universitas' => 'nullable|string|max:100',
            'npm' => 'nullable|string|max:100',
        ]);

        $updateData = [
            'username' => $request->username,

            'nama' => $request->nama,
            'email' => $request->email,
            'role' => $request->role,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'prodi' => $request->prodi,
            'fakultas' => $request->fakultas,
            'universitas' => $request->universitas,
            'npm' => $request->npm,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        // Handle foto upload
        if ($request->hasFile('foto')) {
            // Delete old foto if exists
            if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                Storage::disk('public')->delete($user->foto);
            }

            $foto = $request->file('foto');
            $fotoName = time() . '_' . $foto->getClientOriginalName();
            $foto->storeAs('public/users', $fotoName);
            $updateData['foto'] = 'users/' . $fotoName;
        }

        $user->update($updateData);

        return redirect()->route('users.index')->with('success', 'User berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        // Prevent admin from deleting themselves
        if ($user->id === Auth::id()) {
            return redirect()->route('users.index')->with('error', 'Anda tidak dapat menghapus akun sendiri');
        }

        // Delete foto if exists
        if ($user->foto && Storage::disk('public')->exists($user->foto)) {
            Storage::disk('public')->delete($user->foto);
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User berhasil dihapus');
    }

    /**
     * Bulk delete users
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|max:100', // Batasi maksimal 100 item
            'ids.*' => 'exists:users,id'
        ], [
            'ids.required' => 'Pilih minimal satu user untuk dihapus.',
            'ids.array' => 'Format data tidak valid.',
            'ids.max' => 'Maksimal 100 user dapat dihapus sekaligus.',
            'ids.*.exists' => 'Salah satu user tidak valid.',
        ]);

        $currentUserId = Auth::id();

        // Filter out current user ID to prevent self-deletion
        $idsToDelete = array_filter($request->ids, function ($id) use ($currentUserId) {
            return $id != $currentUserId;
        });

        if (empty($idsToDelete)) {
            return redirect()->route('users.index')->with('error', 'Tidak ada user yang dapat dihapus');
        }

        try {
            // Hapus foto user yang akan dihapus
            $usersWithFoto = User::whereIn('id', $idsToDelete)
                ->whereNotNull('foto')
                ->select('foto')
                ->get();

            foreach ($usersWithFoto as $user) {
                if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                    Storage::disk('public')->delete($user->foto);
                }
            }

            // Hapus user dalam batch
            User::whereIn('id', $idsToDelete)->delete();

            $deletedCount = count($idsToDelete);
            return redirect()->route('users.index')->with('success', "Berhasil menghapus {$deletedCount} user");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Bulk delete users error: ' . $e->getMessage());
            return redirect()->route('users.index')->with('error', 'Terjadi kesalahan saat menghapus user');
        }
    }
}
