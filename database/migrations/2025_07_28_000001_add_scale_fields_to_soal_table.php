<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            // Hapus kolom tipe_skala yang lama jika ada
            if (Schema::hasColumn('soal', 'tipe_skala')) {
                $table->dropColumn('tipe_skala');
            }

            // Tambah kolom-kolom baru untuk skala
            $table->integer('skala_min')->nullable()->after('media')->comment('Nilai minimum untuk skala (contoh: 1)');
            $table->integer('skala_maks')->nullable()->after('skala_min')->comment('Nilai maksimum untuk skala (contoh: 5)');
            $table->string('skala_label_min', 255)->nullable()->after('skala_maks')->comment('Label untuk nilai minimum (contoh: Sangat Tidak Setuju)');
            $table->string('skala_label_maks', 255)->nullable()->after('skala_label_min')->comment('Label untuk nilai maksimum (contoh: Sangat Setuju)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropColumn([
                'skala_min',
                'skala_maks',
                'skala_label_min',
                'skala_label_maks'
            ]);

            // Kembalikan kolom tipe_skala yang lama
            $table->string('tipe_skala')->nullable()->after('media');
        });
    }
};
