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
            // Update skor dan jawaban_benar menjadi nullable untuk import
            $table->string('jawaban_benar', 255)->nullable()->change();
            $table->integer('skor')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            // Revert back to not nullable (with default values for safety)
            $table->string('jawaban_benar', 255)->default('')->change();
            $table->integer('skor')->default(0)->change();
        });
    }
};
