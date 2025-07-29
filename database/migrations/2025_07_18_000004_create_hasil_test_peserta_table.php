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
        Schema::create('hasil_test_peserta', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_jawaban');
            $table->unsignedBigInteger('id_user');
            $table->integer('total_skor')->default(0);
            $table->timestamps();

            $table->index('id_jawaban');
            $table->index('id_user');
            $table->foreign('id_jawaban')->references('id')->on('jawaban')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_test_peserta');
    }
};
