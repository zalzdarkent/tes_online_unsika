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
        Schema::create('kategori_tes', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->unsignedBigInteger('user_id'); // User yang membuat kategori
            $table->timestamps();
            $table->softDeletes(); // Menambahkan kolom deleted_at untuk soft delete

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['nama', 'user_id']); // Nama kategori harus unik per user
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kategori_tes');
    }
};
