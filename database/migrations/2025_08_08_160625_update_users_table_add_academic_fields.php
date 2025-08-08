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
        Schema::table('users', function (Blueprint $table) {
            $table->string('nama', 100)->nullable(false)->change();

            $table->string('prodi')->nullable();
            $table->string('fakultas')->nullable();
            $table->string('universitas')->nullable();
            $table->string('npm')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nama', 100)->nullable()->change();

            $table->dropColumn(['prodi', 'fakultas', 'universitas', 'npm']);
        });
    }
};
