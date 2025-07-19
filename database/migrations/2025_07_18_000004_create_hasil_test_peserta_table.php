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
        Schema::create('hasil_test_peserta', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_jadwal');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_soal');
            $table->string('jawaban', 255);
            $table->string('jawaban_benar', 255);
            $table->integer('skor')->default(0);
            $table->timestamp('waktu_ujian')->useCurrent();

            $table->index('id_jadwal');
            $table->index('id_user');
            $table->index('id_soal');
            $table->foreign('id_jadwal')->references('id')->on('jadwal')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_soal')->references('id')->on('soal')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_test_peserta');
    }
};
