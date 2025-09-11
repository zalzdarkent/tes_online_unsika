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
        Schema::create('jadwal_peserta', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_jadwal');
            $table->unsignedBigInteger('id_peserta');
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');
            $table->enum('cara_daftar', ['mandiri', 'teacher'])->default('mandiri'); // mandiri = peserta daftar sendiri, teacher = didaftarkan teacher
            $table->timestamp('tanggal_daftar')->useCurrent();
            $table->timestamp('tanggal_approval')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable(); // ID teacher yang approve
            $table->text('keterangan')->nullable(); // Keterangan jika ditolak atau catatan lainnya
            $table->timestamps();

            // Foreign keys
            $table->foreign('id_jadwal')->references('id')->on('jadwal')->onDelete('cascade');
            $table->foreign('id_peserta')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            // Unique constraint - satu peserta hanya bisa daftar sekali per jadwal
            $table->unique(['id_jadwal', 'id_peserta']);

            // Indexes
            $table->index(['id_jadwal', 'status']);
            $table->index(['id_peserta', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jadwal_peserta');
    }
};
