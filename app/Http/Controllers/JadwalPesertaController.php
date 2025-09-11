<?php

namespace App\Http\Controllers;

use App\Models\JadwalPeserta;
use App\Models\Jadwal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class JadwalPesertaController extends Controller
{
    /**
     * Daftar peserta untuk jadwal tertentu (untuk teacher)
     */
    public function index($jadwalId)
    {
        $jadwal = Jadwal::with(['kategori', 'user'])->findOrFail($jadwalId);

        // Hanya teacher yang bisa melihat halaman ini
        if (Auth::user()->role !== 'teacher') {
            abort(403, 'Anda tidak memiliki akses untuk melihat halaman ini.');
        }

        // Ambil semua peserta yang terdaftar di jadwal ini
        $pesertaTerdaftar = JadwalPeserta::with(['peserta', 'approver'])
            ->where('id_jadwal', $jadwalId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Ambil semua peserta (untuk bisa didaftarkan manual oleh teacher)
        $allPeserta = User::where('role', 'peserta')
            ->whereNotIn('id', function($query) use ($jadwalId) {
                $query->select('id_peserta')
                      ->from('jadwal_peserta')
                      ->where('id_jadwal', $jadwalId);
            })
            ->orderBy('nama')
            ->get();

        return Inertia::render('jadwal/peserta/index', [
            'jadwal' => $jadwal,
            'pesertaTerdaftar' => $pesertaTerdaftar,
            'allPeserta' => $allPeserta,
        ]);
    }

    /**
     * Peserta mendaftar ke jadwal
     */
    public function daftar(Request $request)
    {
        $request->validate([
            'id_jadwal' => 'required|exists:jadwal,id'
        ]);

        $user = Auth::user();

        // Pastikan user adalah peserta
        if ($user->role !== 'peserta') {
            return redirect()->back()->withErrors(['error' => 'Hanya peserta yang dapat mendaftar tes.']);
        }

        // Check apakah profil lengkap
        if (!$user->isProfileComplete()) {
            $missingFields = $user->getMissingProfileFields();
            return redirect()->back()->withErrors([
                'error' => 'Profil Anda belum lengkap. Harap lengkapi: ' . implode(', ', $missingFields)
            ]);
        }

        $jadwal = Jadwal::findOrFail($request->id_jadwal);

        // Check apakah jadwal masih buka untuk pendaftaran
        if ($jadwal->status !== 'Buka') {
            return redirect()->back()->withErrors(['error' => 'Jadwal tes ini sudah tidak menerima pendaftaran.']);
        }

        // Check apakah sudah terdaftar
        $existingRegistration = JadwalPeserta::where('id_jadwal', $request->id_jadwal)
            ->where('id_peserta', $user->id)
            ->first();

        if ($existingRegistration) {
            return redirect()->back()->withErrors(['error' => 'Anda sudah terdaftar untuk tes ini.']);
        }

        // Daftar ke jadwal
        try {
            JadwalPeserta::create([
                'id_jadwal' => $request->id_jadwal,
                'id_peserta' => $user->id,
                'status' => 'menunggu',
                'cara_daftar' => 'mandiri',
                'tanggal_daftar' => now(),
            ]);

            return redirect()->back()->with('success', 'Pendaftaran berhasil! Menunggu persetujuan dari penyelenggara tes.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.']);
        }
    }

    /**
     * Teacher mendaftarkan peserta manual
     */
    public function daftarkanPeserta(Request $request, $jadwalId)
    {
        $request->validate([
            'id_peserta' => 'required|array|min:1',
            'id_peserta.*' => 'exists:users,id'
        ]);

        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk mendaftarkan peserta.']);
        }

        $jadwal = Jadwal::findOrFail($jadwalId);
        $successCount = 0;
        $errors = [];

        foreach ($request->id_peserta as $pesertaId) {
            // Check apakah sudah terdaftar
            $existingRegistration = JadwalPeserta::where('id_jadwal', $jadwalId)
                ->where('id_peserta', $pesertaId)
                ->first();

            if (!$existingRegistration) {
                try {
                    JadwalPeserta::create([
                        'id_jadwal' => $jadwalId,
                        'id_peserta' => $pesertaId,
                        'status' => 'disetujui', // Langsung disetujui karena didaftarkan teacher
                        'cara_daftar' => 'teacher',
                        'tanggal_daftar' => now(),
                        'tanggal_approval' => now(),
                        'approved_by' => $user->id,
                    ]);
                    $successCount++;
                } catch (\Exception $e) {
                    $peserta = User::find($pesertaId);
                    $pesertaName = $peserta ? $peserta->nama : 'peserta ID ' . $pesertaId;
                    $errors[] = "Gagal mendaftarkan {$pesertaName}: " . $e->getMessage();
                    Log::error("Error mendaftarkan peserta {$pesertaId}: " . $e->getMessage());
                }
            }
        }

        $message = "{$successCount} peserta berhasil didaftarkan.";
        if (!empty($errors)) {
            $message .= " Beberapa peserta gagal didaftarkan: " . implode(', ', $errors);
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Approve pendaftaran peserta
     */
    public function approve(Request $request, $jadwalId, $registrationId)
    {
        $registration = JadwalPeserta::findOrFail($registrationId);
        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk approve peserta.']);
        }

        $registration->update([
            'status' => 'disetujui',
            'tanggal_approval' => now(),
            'approved_by' => $user->id,
        ]);

        return redirect()->back()->with('success', 'Peserta berhasil disetujui.');
    }

    /**
     * Tolak pendaftaran peserta
     */
    public function reject(Request $request, $jadwalId, $registrationId)
    {
        $request->validate([
            'keterangan' => 'nullable|string|max:500'
        ]);

        $registration = JadwalPeserta::findOrFail($registrationId);
        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk menolak peserta.']);
        }

        $registration->update([
            'status' => 'ditolak',
            'tanggal_approval' => now(),
            'approved_by' => $user->id,
            'keterangan' => $request->keterangan,
        ]);

        return redirect()->back()->with('success', 'Peserta ditolak.');
    }

    /**
     * Bulk approve peserta
     */
    public function bulkApprove(Request $request, $jadwalId)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:jadwal_peserta,id'
        ]);

        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk approve peserta.']);
        }

        $updatedCount = JadwalPeserta::whereIn('id', $request->ids)
            ->where('status', 'menunggu')
            ->update([
                'status' => 'disetujui',
                'tanggal_approval' => now(),
                'approved_by' => $user->id,
            ]);

        return redirect()->back()->with('success', "{$updatedCount} peserta berhasil disetujui.");
    }

    /**
     * Bulk reject peserta
     */
    public function bulkReject(Request $request, $jadwalId)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:jadwal_peserta,id',
            'keterangan' => 'nullable|string|max:500'
        ]);

        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk menolak peserta.']);
        }

        $updatedCount = JadwalPeserta::whereIn('id', $request->ids)
            ->where('status', 'menunggu')
            ->update([
                'status' => 'ditolak',
                'tanggal_approval' => now(),
                'approved_by' => $user->id,
                'keterangan' => $request->keterangan,
            ]);

        return redirect()->back()->with('success', "{$updatedCount} peserta ditolak.");
    }

    /**
     * Hapus peserta dari jadwal
     */
    public function destroy($jadwalId, $registrationId)
    {
        $registration = JadwalPeserta::findOrFail($registrationId);
        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk menghapus peserta.']);
        }

        $registration->delete();

        return redirect()->back()->with('success', 'Peserta berhasil dihapus dari jadwal.');
    }

    /**
     * Hapus beberapa peserta sekaligus dari jadwal
     */
    public function bulkDelete(Request $request, $jadwalId)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:jadwal_peserta,id'
        ]);

        $user = Auth::user();

        // Pastikan user adalah teacher
        if ($user->role !== 'teacher') {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses untuk menghapus peserta.']);
        }

        $deletedCount = JadwalPeserta::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', "{$deletedCount} peserta berhasil dihapus dari jadwal.");
    }
}
