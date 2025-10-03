<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreenshotViolation extends Model
{
    use HasFactory;

    protected $fillable = [
        'jadwal_id',
        'peserta_id',
        'violation_type',
        'detection_method',
        'browser_info',
        'violation_time',
        'ip_address',
        'additional_notes',
        'auto_submitted',
    ];

    protected $casts = [
        'browser_info' => 'array',
        'violation_time' => 'datetime',
        'auto_submitted' => 'boolean',
    ];

    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(Jadwal::class);
    }

    public function peserta(): BelongsTo
    {
        return $this->belongsTo(User::class, 'peserta_id');
    }

    /**
     * Get violation summary for a specific jadwal and peserta
     */
    public static function getViolationSummary(int $jadwalId, int $pesertaId): array
    {
        $violations = self::where('jadwal_id', $jadwalId)
            ->where('peserta_id', $pesertaId)
            ->orderBy('violation_time', 'desc')
            ->get();

        return [
            'total_violations' => $violations->count(),
            'violation_types' => $violations->groupBy('violation_type')->map->count(),
            'latest_violation' => $violations->first(),
            'auto_submitted' => $violations->where('auto_submitted', true)->isNotEmpty(),
        ];
    }

    /**
     * Get all violations for a jadwal (for admin view)
     */
    public static function getJadwalViolations(int $jadwalId)
    {
        return self::with(['peserta', 'jadwal'])
            ->where('jadwal_id', $jadwalId)
            ->orderBy('violation_time', 'desc')
            ->get()
            ->groupBy('peserta_id');
    }
}
