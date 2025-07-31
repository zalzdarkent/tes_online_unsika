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
        'status',
        'auto_close',
        'durasi',
        'user_id',
        'id_jadwal_sebelumnya',
        'kategori_tes_id',
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
}
