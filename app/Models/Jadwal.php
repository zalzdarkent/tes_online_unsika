<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    protected $table = "jadwal";

    protected $fillable = [
        'kode_jadwal',
        'nama_jadwal',
        'tanggal_mulai',
        'tanggal_berakhir',
        'waktu_mulai_tes',
        'status',
        'access_mode',
        'auto_close',
        'durasi',
        'user_id',
        'id_jadwal_sebelumnya',
        'kategori_tes_id',
        'is_shuffled',
        'is_answer_shuffled'
    ];

    protected $casts = [
        'auto_close' => 'boolean',
    ];

    /**
     * Relasi ke User (pemilik jadwal)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke jadwal sebelumnya
     */
    public function jadwalSebelumnya()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal_sebelumnya');
    }

    /**
     * Relasi ke jadwal yang mereferensikan jadwal ini sebagai jadwal sebelumnya
     */
    public function jadwalBerikutnya()
    {
        return $this->hasMany(Jadwal::class, 'id_jadwal_sebelumnya');
    }

    /**
     * Relasi ke jawaban peserta
     */
    public function jawaban()
    {
        return $this->hasMany(Jawaban::class, 'id_jadwal');
    }

    public function soal()
    {
        return $this->hasMany(\App\Models\Soal::class, 'id_jadwal');
    }

    /**
     * Relasi ke kategori tes
     */
    public function kategori()
    {
        return $this->belongsTo(\App\Models\KategoriTes::class, 'kategori_tes_id');
    }

    public function hasil()
    {
        return $this->hasMany(\App\Models\HasilTestPeserta::class, 'id_jadwal', 'id');
    }

    /**
     * Relasi ke peserta yang terdaftar di jadwal ini
     */
    public function pesertaTerdaftar()
    {
        return $this->hasMany(JadwalPeserta::class, 'id_jadwal');
    }

    /**
     * Relasi ke peserta yang sudah disetujui
     */
    public function pesertaDisetujui()
    {
        return $this->hasMany(JadwalPeserta::class, 'id_jadwal')->where('status', 'disetujui');
    }

    /**
     * Relasi ke peserta yang menunggu approval
     */
    public function pesertaMenunggu()
    {
        return $this->hasMany(JadwalPeserta::class, 'id_jadwal')->where('status', 'menunggu');
    }

    /**
     * Check dan update status jadwal berdasarkan tanggal berakhir
     */
    public function checkAndUpdateStatus()
    {
        $now = \Carbon\Carbon::now();
        $tanggalBerakhir = $this->tanggal_berakhir instanceof \Carbon\Carbon
            ? $this->tanggal_berakhir
            : \Carbon\Carbon::parse($this->tanggal_berakhir);

        $shouldBeClosed = $now->gt($tanggalBerakhir);

        if ($shouldBeClosed && $this->status === 'Buka') {
            $this->update(['status' => 'Tutup']);
            \Illuminate\Support\Facades\Log::info("Auto-closed jadwal: {$this->nama_jadwal} (ID: {$this->id})");
        }

        return $shouldBeClosed ? 'Tutup' : 'Buka';
    }

    /**
     * Get real-time status (akan auto-update jika diperlukan)
     */
    public function getRealTimeStatus()
    {
        return $this->checkAndUpdateStatus();
    }

    /**
     * Static method untuk bulk update status expired jadwal
     */
    public static function updateExpiredJadwalStatus()
    {
        $now = \Carbon\Carbon::now();

        $expiredJadwal = self::where('status', 'Buka')
            ->where('tanggal_berakhir', '<', $now)
            ->get();

        $updatedCount = 0;
        foreach ($expiredJadwal as $jadwal) {
            $jadwal->update(['status' => 'Tutup']);
            $updatedCount++;
        }

        if ($updatedCount > 0) {
            \Illuminate\Support\Facades\Log::info("Bulk updated {$updatedCount} expired jadwal to Tutup status");
        }

        return $updatedCount;
    }

    /**
     * Check apakah peserta bisa mulai tes (waktu mulai tes sudah tiba)
     */
    public function canStartTest()
    {
        if (!$this->waktu_mulai_tes) {
            // Jika waktu_mulai_tes tidak diset, gunakan tanggal_mulai sebagai fallback
            $waktuMulai = $this->tanggal_mulai instanceof \Carbon\Carbon
                ? $this->tanggal_mulai
                : \Carbon\Carbon::parse($this->tanggal_mulai);
        } else {
            $waktuMulai = $this->waktu_mulai_tes instanceof \Carbon\Carbon
                ? $this->waktu_mulai_tes
                : \Carbon\Carbon::parse($this->waktu_mulai_tes);
        }

        $now = \Carbon\Carbon::now();
        return $now->gte($waktuMulai);
    }

    /**
     * Get waktu yang tersisa sebelum tes bisa dimulai (dalam menit)
     */
    public function getMinutesUntilTestStart()
    {
        if (!$this->waktu_mulai_tes) {
            $waktuMulai = $this->tanggal_mulai instanceof \Carbon\Carbon
                ? $this->tanggal_mulai
                : \Carbon\Carbon::parse($this->tanggal_mulai);
        } else {
            $waktuMulai = $this->waktu_mulai_tes instanceof \Carbon\Carbon
                ? $this->waktu_mulai_tes
                : \Carbon\Carbon::parse($this->waktu_mulai_tes);
        }

        $now = \Carbon\Carbon::now();
        if ($now->gte($waktuMulai)) {
            return 0; // Sudah bisa mulai
        }

        return $now->diffInMinutes($waktuMulai);
    }
}
