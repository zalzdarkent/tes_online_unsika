<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionBank extends Model
{
    protected $table = 'question_banks';

    protected $fillable = [
        'title',
        'pertanyaan',
        'jenis_soal',
        'tipe_jawaban',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'jawaban_benar',
        'media',
        'tipe_skala',
        'equation',
        'skala_min',
        'skala_maks',
        'skala_label_min',
        'skala_label_maks',
        'skor',
        'difficulty_level',
        'is_public',
        'usage_count',
        'user_id'
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'usage_count' => 'integer',
        'skor' => 'integer',
        'skala_min' => 'integer',
        'skala_maks' => 'integer'
    ];

    /**
     * Get the user that owns the question
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }



    /**
     * Get all permissions for this question
     */
    public function permissions(): HasMany
    {
        return $this->hasMany(QuestionBankPermission::class);
    }

    /**
     * Get all soal that use this question bank
     */
    public function soals(): HasMany
    {
        return $this->hasMany(Soal::class, 'question_bank_id');
    }

    /**
     * Get all users this question bank is shared with
     */
    public function sharedWith(): HasMany
    {
        return $this->hasMany(UserBankPermission::class, 'owner_id', 'user_id');
    }

    /**
     * Get actual usage count from soal table
     */
    public function getActualUsageCountAttribute(): int
    {
        return $this->soals()->count();
    }

    /**
     * Scope untuk mengambil soal milik user tertentu
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope untuk mengambil soal public
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }



    /**
     * Scope untuk mengambil soal berdasarkan tingkat kesulitan
     */
    public function scopeByDifficulty($query, $difficulty)
    {
        return $query->where('difficulty_level', $difficulty);
    }

    /**
     * Scope untuk soal yang bisa diakses user (owned + shared + public)
     */
    public function scopeAccessibleBy($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_id', $userId) // Own questions
              ->orWhere('is_public', true) // Public questions
              ->orWhereHas('permissions', function ($permQuery) use ($userId) { // Shared questions
                  $permQuery->where('requester_id', $userId)
                           ->where('status', 'active');
              });
        });
    }

    /**
     * Increment usage count
     */
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }

    /**
     * Delete media file associated with the question
     */
    public function deleteMedia()
    {
        if ($this->media) {
            $path = storage_path('app/public/' . $this->media);
            if (file_exists($path)) {
                unlink($path);
            }
        }
    }

    /**
     * Get shuffled answers similar to Soal model for consistency
     */
    public function getShuffledAnswers($userId)
    {
        // Reuse logic from Soal model for consistency
        if (!in_array($this->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
            return [
                'opsi_a' => $this->opsi_a,
                'opsi_b' => $this->opsi_b,
                'opsi_c' => $this->opsi_c,
                'opsi_d' => $this->opsi_d,
                'jawaban_benar' => $this->jawaban_benar,
            ];
        }

        $seed = (int)($userId . $this->id);
        srand($seed);

        $opsiAsli = [
            'a' => $this->opsi_a,
            'b' => $this->opsi_b,
            'c' => $this->opsi_c,
            'd' => $this->opsi_d,
        ];

        $opsiTersedia = array_filter($opsiAsli, function ($nilai) {
            return !empty($nilai);
        });

        if (count($opsiTersedia) < 2) {
            srand();
            return [
                'opsi_a' => $this->opsi_a,
                'opsi_b' => $this->opsi_b,
                'opsi_c' => $this->opsi_c,
                'opsi_d' => $this->opsi_d,
                'jawaban_benar' => $this->jawaban_benar,
            ];
        }

        $keys = array_keys($opsiTersedia);
        shuffle($keys);

        $mapping = [];
        $urutanBaru = ['a', 'b', 'c', 'd'];
        for ($i = 0; $i < count($keys); $i++) {
            $mapping[$keys[$i]] = $urutanBaru[$i];
        }

        $opsiShuffled = [
            'opsi_a' => null,
            'opsi_b' => null,
            'opsi_c' => null,
            'opsi_d' => null,
        ];

        foreach ($mapping as $keyLama => $keyBaru) {
            $opsiShuffled['opsi_' . $keyBaru] = $opsiAsli[$keyLama];
        }

        $jawabanBenarBaru = $this->jawaban_benar;

        if ($this->jenis_soal === 'multi_choice') {
            $jawabanArray = explode(',', strtolower($this->jawaban_benar));
            $jawabanBaruArray = [];

            foreach ($jawabanArray as $jawaban) {
                $jawaban = trim($jawaban);
                if (isset($mapping[$jawaban])) {
                    $jawabanBaruArray[] = $mapping[$jawaban];
                }
            }

            if (!empty($jawabanBaruArray)) {
                sort($jawabanBaruArray);
                $jawabanBenarBaru = implode(',', $jawabanBaruArray);
            }
        } else {
            $jawaban = strtolower(trim($this->jawaban_benar));
            if (isset($mapping[$jawaban])) {
                $jawabanBenarBaru = $mapping[$jawaban];
            }
        }

        srand();

        return array_merge($opsiShuffled, [
            'jawaban_benar' => $jawabanBenarBaru,
        ]);
    }
}
