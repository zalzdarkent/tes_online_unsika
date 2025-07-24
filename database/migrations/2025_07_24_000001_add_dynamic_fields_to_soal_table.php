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
            $table->enum('tipe_jawaban', [
                'single_choice', 'multi_choice', 'essay', 'essay_gambar', 'essay_audio', 'skala', 'equation'
            ])->default('single_choice')->after('jenis_soal');
            $table->string('media')->nullable()->after('jawaban_benar');
            $table->string('tipe_skala')->nullable()->after('media');
            $table->text('equation')->nullable()->after('tipe_skala');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropColumn([
                'tipe_jawaban',
                'opsi_jawaban',
                'jawaban_benar_multi',
                'media',
                'tipe_skala',
                'equation',
            ]);
        });
    }
};
