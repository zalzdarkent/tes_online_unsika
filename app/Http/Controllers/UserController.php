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
        // Sementara tidak pakai pagination untuk debug
        $users = User::select('id', 'username', 'nama', 'email', 'role', 'alamat', 'no_hp', 'foto', 'created_at', 'updated_at', 'prodi', 'fakultas', 'universitas', 'npm')
            ->orderBy('created_at', 'desc')
            ->get(); // Ubah dari paginate menjadi get()

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

    /**
     * Import users from Excel/CSV file.
     */
    public function import(Request $request)
    {
        try {
            $request->validate([
                'users' => 'required|array',
                'users.*.email' => 'required|email|max:255',
                'users.*.username' => 'required|string|max:255',
                'users.*.nama' => 'required|string|max:255',
                'users.*.password' => 'required|string|min:4',
                'users.*.role' => 'required|in:admin,teacher,peserta',
                'users.*.npm' => 'nullable|string|max:100',
                'users.*.prodi' => 'nullable|string|max:100',
                'users.*.fakultas' => 'nullable|string|max:100',
                'users.*.universitas' => 'nullable|string|max:100',
                'users.*.no_hp' => 'nullable|string|max:20',
                'users.*.alamat' => 'nullable|string|max:500',
            ]);

            $users = $request->input('users');
            $successCount = 0;
            $errors = [];

            // Validasi unique constraints sebelum bulk insert
            $usernames = array_column($users, 'username');
            $emails = array_column($users, 'email');

            // Check for duplicate usernames in the input
            if (count($usernames) !== count(array_unique($usernames))) {
                return redirect()->back()->withErrors([
                    'message' => 'Terdapat username yang duplikat dalam data import.'
                ]);
            }

            // Check for duplicate emails in the input
            if (count($emails) !== count(array_unique($emails))) {
                return redirect()->back()->withErrors([
                    'message' => 'Terdapat email yang duplikat dalam data import.'
                ]);
            }

            // Check for existing usernames and emails in database
            $existingUsernames = User::whereIn('username', $usernames)->pluck('username')->toArray();
            $existingEmails = User::whereIn('email', $emails)->pluck('email')->toArray();

            if (!empty($existingUsernames)) {
                return redirect()->back()->withErrors([
                    'message' => 'Username sudah ada di database: ' . implode(', ', $existingUsernames)
                ]);
            }

            if (!empty($existingEmails)) {
                return redirect()->back()->withErrors([
                    'message' => 'Email sudah ada di database: ' . implode(', ', $existingEmails)
                ]);
            }

            // Process each user
            foreach ($users as $userData) {
                try {
                    $user = new User();
                    $user->email = $userData['email'];
                    $user->username = $userData['username'];
                    $user->nama = $userData['nama'];
                    $user->password = Hash::make($userData['password']);
                    $user->role = $userData['role'];
                    $user->npm = $userData['npm'] ?? null;
                    $user->prodi = $userData['prodi'] ?? null;
                    $user->fakultas = $userData['fakultas'] ?? null;
                    $user->universitas = $userData['universitas'] ?? null;
                    $user->no_hp = $userData['no_hp'] ?? null;
                    $user->alamat = $userData['alamat'] ?? null;

                    $user->save();
                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "User {$userData['username']}: " . $e->getMessage();
                }
            }

            if ($successCount > 0) {
                $message = "{$successCount} user berhasil diimpor.";
                if (!empty($errors)) {
                    $message .= " " . count($errors) . " user gagal diimpor.";
                }
                return redirect()->back()->with('success', $message);
            } else {
                return redirect()->back()->withErrors(['message' => 'Tidak ada user yang berhasil diimpor. ' . implode(' ', $errors)]);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = [];
            foreach ($e->errors() as $field => $messages) {
                $errors[] = $field . ': ' . implode(', ', $messages);
            }
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
     * Download template file for user import.
     */
    public function downloadTemplate()
    {
        $filePath = public_path('template-user.xlsx');

        if (!file_exists($filePath)) {
            // Create template file if it doesn't exist
            $this->createUserTemplate($filePath);
        }

        $filename = 'template-user.xlsx';
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return response()->download($filePath, $filename, $headers);
    }

    /**
     * Create user template Excel file.
     */
    private function createUserTemplate($filePath)
    {
        // Sample data for template
        $data = [
            [
                'email' => 'john@example.com',
                'username' => 'johndoe',
                'nama' => 'John Doe',
                'npm' => '1234567890',
                'prodi' => 'Teknik Informatika',
                'fakultas' => 'Fakultas Teknik',
                'universitas' => 'Universitas Singaperbangsa Karawang',
                'no_hp' => '081234567890',
                'alamat' => 'Jl. Contoh No. 123, Karawang'
            ],
            [
                'email' => 'jane@example.com',
                'username' => 'janedoe',
                'nama' => 'Jane Doe',
                'npm' => '0987654321',
                'prodi' => 'Sistem Informasi',
                'fakultas' => 'Fakultas Teknik',
                'universitas' => 'Universitas Singaperbangsa Karawang',
                'no_hp' => '082345678901',
                'alamat' => 'Jl. Contoh No. 456, Karawang'
            ]
        ];

        // Create simple CSV for Excel template
        $headers = ['email', 'username', 'nama', 'npm', 'prodi', 'fakultas', 'universitas', 'no_hp', 'alamat'];

        $fp = fopen($filePath, 'w');
        fputcsv($fp, $headers);
        foreach ($data as $row) {
            fputcsv($fp, $row);
        }
        fclose($fp);

        // Convert CSV to XLSX using simple method
        // Note: In production, you might want to use a proper Excel library like PhpSpreadsheet
        // For now, we'll rename the CSV to xlsx as many Excel applications can read CSV files
        $xlsxPath = str_replace('.xlsx', '.csv', $filePath);
        rename($filePath, $xlsxPath);
        rename($xlsxPath, $filePath);
    }
}
