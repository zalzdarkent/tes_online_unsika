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
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->enum('status_tes', ['sedang_mengerjakan', 'terputus', 'selesai', 'tidak_dimulai'])->default('tidak_dimulai')->after('is_submitted_test');
            $table->timestamp('waktu_mulai_tes')->nullable()->after('status_tes');
            $table->timestamp('waktu_terakhir_aktif')->nullable()->after('waktu_mulai_tes');
            $table->integer('sisa_waktu_detik')->nullable()->after('waktu_terakhir_aktif'); // Sisa waktu dalam detik
            $table->boolean('boleh_dilanjutkan')->default(false)->after('sisa_waktu_detik');
            $table->text('alasan_terputus')->nullable()->after('boleh_dilanjutkan'); // Alasan kenapa terputus (pindah tab, dll)
            $table->timestamp('diizinkan_lanjut_pada')->nullable()->after('alasan_terputus'); // Kapan diizinkan lanjut
            $table->unsignedBigInteger('diizinkan_oleh')->nullable()->after('diizinkan_lanjut_pada'); // User ID yang mengizinkan

            $table->foreign('diizinkan_oleh')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->dropForeign(['diizinkan_oleh']);
            $table->dropColumn([
                'status_tes',
                'waktu_mulai_tes',
                'waktu_terakhir_aktif',
                'sisa_waktu_detik',
                'boleh_dilanjutkan',
                'alasan_terputus',
                'diizinkan_lanjut_pada',
                'diizinkan_oleh'
            ]);
        });
    }
};
