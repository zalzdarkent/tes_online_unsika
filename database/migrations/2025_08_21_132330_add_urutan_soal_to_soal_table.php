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
        Schema::table('soal', function (Blueprint $table) {
            $table->integer('urutan_soal')->default(0)->after('id_jadwal');
            $table->index(['id_jadwal', 'urutan_soal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropIndex(['id_jadwal', 'urutan_soal']);
            $table->dropColumn('urutan_soal');
        });
    }
};
