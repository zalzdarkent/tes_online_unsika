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
        Schema::create('jadwal', function (Blueprint $table) {
            $table->id();
            $table->string('nama_jadwal', 255);
            $table->dateTime('tanggal_mulai');
            $table->dateTime('tanggal_berakhir');
            $table->enum('status', ['Buka', 'Tutup']);
            $table->boolean('auto_close')->default(true);
            $table->integer('durasi');
            $table->unsignedBigInteger('user_id'); // User yang membuat jadwal
            $table->unsignedBigInteger('id_jadwal_sebelumnya')->nullable();
            $table->unsignedBigInteger('kategori_tes_id')->nullable(); // Kategori tes
            $table->timestamps();

            $table->index('user_id');
            $table->index('id_jadwal_sebelumnya');
            $table->index('kategori_tes_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_jadwal_sebelumnya')->references('id')->on('jadwal')->onDelete('cascade');
            $table->foreign('kategori_tes_id')->references('id')->on('kategori_tes')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jadwal');
    }
};
