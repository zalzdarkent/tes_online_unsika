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
            $table->timestamp('waktu_submit')->nullable()->after('waktu_terakhir_aktif');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->dropColumn('waktu_submit');
        });
    }
};
