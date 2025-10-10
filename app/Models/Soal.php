<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    protected $table = 'soal';

    protected $fillable = [
        'id_jadwal',
        'urutan_soal',
        'jenis_soal',
        'pertanyaan',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'jawaban_benar',
        'media',
        'skala_min',
        'skala_maks',
        'skala_label_min',
        'skala_label_maks',
        'equation',
        'skor'
    ];

    /**
     * Delete media file associated with the soal
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

    public function jadwal()
    {
        return $this->belongsTo('App\Models\Jadwal', 'id_jadwal');
    }

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'user_id');
    }

    /**
     * Shuffle jawaban pilihan ganda dan update jawaban_benar sesuai urutan baru
     * Menggunakan seed yang konsisten berdasarkan user ID dan soal ID
     */
    public function getShuffledAnswers($userId)
    {
        // Hanya shuffle untuk pilihan ganda dan multi_choice
        if (!in_array($this->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
            return [
                'opsi_a' => $this->opsi_a,
                'opsi_b' => $this->opsi_b,
                'opsi_c' => $this->opsi_c,
                'opsi_d' => $this->opsi_d,
                'jawaban_benar' => $this->jawaban_benar,
            ];
        }

        // Buat seed yang konsisten berdasarkan user ID dan soal ID
        $seed = (int)($userId . $this->id);
        srand($seed);

        // Array opsi asli dengan key-nya
        $opsiAsli = [
            'a' => $this->opsi_a,
            'b' => $this->opsi_b,
            'c' => $this->opsi_c,
            'd' => $this->opsi_d,
        ];

        // Filter opsi yang tidak null/empty
        $opsiTersedia = array_filter($opsiAsli, function ($nilai) {
            return !empty($nilai);
        });

        // Jika kurang dari 2 opsi, return original
        if (count($opsiTersedia) < 2) {
            srand(); // Reset seed
            return [
                'opsi_a' => $this->opsi_a,
                'opsi_b' => $this->opsi_b,
                'opsi_c' => $this->opsi_c,
                'opsi_d' => $this->opsi_d,
                'jawaban_benar' => $this->jawaban_benar,
            ];
        }

        // Buat array keys untuk shuffle
        $keys = array_keys($opsiTersedia);
        shuffle($keys);

        // Mapping urutan baru
        $mapping = [];
        $urutanBaru = ['a', 'b', 'c', 'd'];
        for ($i = 0; $i < count($keys); $i++) {
            $mapping[$keys[$i]] = $urutanBaru[$i];
        }

        // Susun opsi dengan urutan baru
        $opsiShuffled = [
            'opsi_a' => null,
            'opsi_b' => null,
            'opsi_c' => null,
            'opsi_d' => null,
        ];

        foreach ($mapping as $keyLama => $keyBaru) {
            $opsiShuffled['opsi_' . $keyBaru] = $opsiAsli[$keyLama];
        }

        // Update jawaban_benar sesuai mapping
        $jawabanBenarBaru = $this->jawaban_benar;

        if ($this->jenis_soal === 'multi_choice') {
            // Untuk multi choice, jawaban bisa berupa "a,c" atau "b,d", dll
            $jawabanArray = explode(',', strtolower($this->jawaban_benar));
            $jawabanBaruArray = [];

            foreach ($jawabanArray as $jawaban) {
                $jawaban = trim($jawaban);
                if (isset($mapping[$jawaban])) {
                    $jawabanBaruArray[] = $mapping[$jawaban];
                }
            }

            if (!empty($jawabanBaruArray)) {
                sort($jawabanBaruArray); // Sort untuk konsistensi
                $jawabanBenarBaru = implode(',', $jawabanBaruArray);
            }
        } else {
            // Untuk pilihan ganda biasa
            $jawaban = strtolower(trim($this->jawaban_benar));
            if (isset($mapping[$jawaban])) {
                $jawabanBenarBaru = $mapping[$jawaban];
            }
        }

        // Reset random seed
        srand();

        return array_merge($opsiShuffled, [
            'jawaban_benar' => $jawabanBenarBaru,
        ]);
    }
}
