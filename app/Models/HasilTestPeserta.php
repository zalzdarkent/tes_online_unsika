<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilTestPeserta extends Model
{
    protected $table = 'hasil_test_peserta';

    protected $fillable = [
        'id_jadwal',
        'id_user',
        'total_skor',
        'total_nilai',
        'start_time',
        'status_koreksi',
        'is_submitted_test',
        'status_tes',
        'waktu_mulai_tes',
        'waktu_terakhir_aktif',
        'sisa_waktu_detik',
        'boleh_dilanjutkan',
        'alasan_terputus',
        'diizinkan_lanjut_pada',
        'diizinkan_oleh',
        'waktu_resume_tes',
        'total_waktu_pause_detik'
    ];

    protected $casts = [
        'waktu_mulai_tes' => 'datetime',
        'waktu_terakhir_aktif' => 'datetime',
        'diizinkan_lanjut_pada' => 'datetime',
        'waktu_resume_tes' => 'datetime',
        'boleh_dilanjutkan' => 'boolean',
        'is_submitted_test' => 'boolean'
    ];

    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function pemberiIzin()
    {
        return $this->belongsTo(User::class, 'diizinkan_oleh');
    }

    /**
     * Check apakah peserta bisa melanjutkan tes
     */
    public function bisaDilanjutkan()
    {
        return $this->boleh_dilanjutkan &&
               $this->status_tes === 'terputus' &&
               $this->getSisaWaktuRealTime() > 0;
    }

    /**
     * Hitung sisa waktu real-time dengan logic pause/resume
     */
    public function getSisaWaktuRealTime()
    {
        if (!$this->sisa_waktu_detik || !$this->waktu_mulai_tes) {
            return 0;
        }

        // Jika tes terputus dan belum diresume, waktu tidak berkurang (PAUSE)
        if ($this->status_tes === 'terputus' && !$this->waktu_resume_tes) {
            return $this->sisa_waktu_detik;
        }

        // Jika tes sudah diresume, hitung waktu berlalu sejak resume
        if ($this->status_tes === 'sedang_mengerjakan' && $this->waktu_resume_tes) {
            $waktuResume = \Carbon\Carbon::parse($this->waktu_resume_tes);
            $waktuSekarang = now();
            $detikSejakResume = $waktuSekarang->diffInSeconds($waktuResume);
            
            // Kurangi sisa waktu dengan waktu sejak resume
            $sisaWaktuSekarang = max(0, $this->sisa_waktu_detik - $detikSejakResume);
            return $sisaWaktuSekarang;
        }

        // Jika tes sedang berjalan normal (belum pernah terputus)
        if ($this->status_tes === 'sedang_mengerjakan' && !$this->waktu_resume_tes) {
            $jadwal = $this->jadwal;
            if (!$jadwal) return 0;
            
            $waktuMulai = \Carbon\Carbon::parse($this->waktu_mulai_tes);
            $waktuSekarang = now();
            $waktuTerpakai = $waktuMulai->diffInSeconds($waktuSekarang);
            $totalWaktu = $jadwal->durasi * 60;
            
            return max(0, $totalWaktu - $waktuTerpakai);
        }

        // Default: return sisa waktu yang tersimpan
        return $this->sisa_waktu_detik;
    }

    /**
     * Hitung sisa waktu dalam format yang mudah dibaca
     */
    public function getSisaWaktuFormatted()
    {
        $sisaWaktuDetik = $this->getSisaWaktuRealTime();
        
        if (!$sisaWaktuDetik) {
            return '0 menit';
        }

        $totalMenit = ceil($sisaWaktuDetik / 60);
        $jam = floor($totalMenit / 60);
        $menit = $totalMenit % 60;

        if ($jam > 0 && $menit > 0) {
            return "{$jam} jam {$menit} menit";
        } elseif ($jam > 0) {
            return "{$jam} jam";
        } else {
            return "{$menit} menit";
        }
    }
}
