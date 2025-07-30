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
            $table->dropColumn(['total_skor', 'total_nilai']);
        });

        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->integer('total_skor')->nullable()->default(0);
            $table->integer('total_nilai')->nullable()->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->dropColumn(['total_skor', 'total_nilai']);
        });

        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->integer('total_skor')->default(0);
            $table->integer('total_nilai')->default(0);
        });
    }
};
