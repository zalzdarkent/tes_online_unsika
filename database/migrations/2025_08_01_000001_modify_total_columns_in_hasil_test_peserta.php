<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            // Ubah tipe kolom dengan cara yang aman
            DB::statement('ALTER TABLE hasil_test_peserta MODIFY total_skor DECIMAL(8,2) DEFAULT 0');
            DB::statement('ALTER TABLE hasil_test_peserta MODIFY total_nilai DECIMAL(5,2) DEFAULT 0');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            // Kembalikan ke tipe data sebelumnya jika perlu rollback
            DB::statement('ALTER TABLE hasil_test_peserta MODIFY total_skor INT DEFAULT 0');
            DB::statement('ALTER TABLE hasil_test_peserta MODIFY total_nilai INT DEFAULT 0');
        });
    }
};
