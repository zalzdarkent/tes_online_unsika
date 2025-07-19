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
        Schema::create('soal', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_jadwal');
            $table->enum('jenis_soal', ['pilihan_ganda', 'esai']);
            $table->text('pertanyaan');
            $table->string('opsi_a', 255)->nullable();
            $table->string('opsi_b', 255)->nullable();
            $table->string('opsi_c', 255)->nullable();
            $table->string('opsi_d', 255)->nullable();
            $table->string('jawaban_benar', 255);
            $table->integer('skor')->default(0);
            $table->timestamps();

            $table->index('id_jadwal');
            $table->foreign('id_jadwal')->references('id')->on('jadwal')->onDelete('cascade');;
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('soal');
    }
};
