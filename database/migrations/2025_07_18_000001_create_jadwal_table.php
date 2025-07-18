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
            $table->id('id_jadwal');
            $table->string('nama_jadwal', 255);
            $table->dateTime('tanggal_mulai');
            $table->dateTime('tanggal_berakhir');
            $table->enum('status', ['Buka', 'Tutup']);
            $table->boolean('auto_close')->default(true);
            $table->unsignedBigInteger('id_jadwal_sebelumnya')->nullable();

            $table->index('id_jadwal_sebelumnya');
            $table->foreign('id_jadwal_sebelumnya')->references('id_jadwal')->on('jadwal');
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
