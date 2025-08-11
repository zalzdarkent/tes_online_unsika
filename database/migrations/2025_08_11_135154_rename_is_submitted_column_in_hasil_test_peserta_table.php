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
            $table->renameColumn('is_submitted', 'is_submitted_test');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_test_peserta', function (Blueprint $table) {
            $table->renameColumn('is_submitted_test', 'is_submitted');
        });
    }
};
