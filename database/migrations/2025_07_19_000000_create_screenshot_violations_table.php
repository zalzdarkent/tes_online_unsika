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
        // Cek apakah tabel sudah ada sebelum membuat
        if (!Schema::hasTable('screenshot_violations')) {
            Schema::create('screenshot_violations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('jadwal_id')->constrained('jadwal')->onDelete('cascade');
                $table->foreignId('peserta_id')->constrained('users')->onDelete('cascade');
                $table->string('violation_type'); // 'screenshot_attempt', 'print_screen', 'snipping_tool', etc.
                $table->string('detection_method'); // 'keyboard_shortcut', 'visibility_change', 'context_menu', etc.
                $table->json('browser_info')->nullable(); // User agent, screen size, etc.
                $table->timestamp('violation_time');
                $table->string('ip_address')->nullable();
                $table->text('additional_notes')->nullable();
                $table->boolean('auto_submitted')->default(false); // Apakah menyebabkan auto submit
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screenshot_violations');
    }
};
