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
            $table->timestamp('waktu_resume_tes')->nullable()->after('diizinkan_lanjut_pada');
            $table->integer('total_waktu_pause_detik')->default(0)->after('waktu_resume_tes'); // Total waktu yang di-pause
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->dropColumn(['waktu_resume_tes', 'total_waktu_pause_detik']);
        });
    }
};
