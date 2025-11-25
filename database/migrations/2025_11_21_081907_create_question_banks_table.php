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
        Schema::create('question_banks', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Judul/nama soal untuk identifikasi
            $table->text('pertanyaan'); // Pertanyaan soal
            $table->enum('jenis_soal', [
                'pilihan_ganda',
                'multi_choice',
                'esai',
                'essay_gambar',
                'essay_audio',
                'skala',
                'equation'
            ]);
            $table->enum('tipe_jawaban', [
                'single_choice', 'multi_choice', 'essay', 'essay_gambar', 'essay_audio', 'skala', 'equation'
            ])->default('single_choice');

            // Opsi jawaban untuk pilihan ganda
            $table->string('opsi_a', 255)->nullable();
            $table->string('opsi_b', 255)->nullable();
            $table->string('opsi_c', 255)->nullable();
            $table->string('opsi_d', 255)->nullable();
            $table->string('jawaban_benar', 255)->nullable();

            // Media dan additional fields
            $table->string('media')->nullable();
            $table->string('tipe_skala')->nullable();
            $table->text('equation')->nullable();
            $table->integer('skala_min')->nullable();
            $table->integer('skala_maks')->nullable();
            $table->string('skala_label_min')->nullable();
            $table->string('skala_label_maks')->nullable();

            $table->integer('skor')->default(1);
            $table->enum('difficulty_level', ['easy', 'medium', 'hard', 'expert'])->default('medium');
            $table->text('tags')->nullable(); // JSON field untuk tags
            $table->text('explanation')->nullable(); // Penjelasan jawaban
            $table->boolean('is_public')->default(false); // Apakah bisa diakses public
            $table->integer('usage_count')->default(0); // Berapa kali digunakan

            // Ownership & relationships
            $table->unsignedBigInteger('user_id'); // Creator
            $table->unsignedBigInteger('kategori_tes_id')->nullable(); // Kategori

            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('kategori_tes_id');
            $table->index('jenis_soal');
            $table->index('difficulty_level');
            $table->index('is_public');

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('kategori_tes_id')->references('id')->on('kategori_tes')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_banks');
    }
};
