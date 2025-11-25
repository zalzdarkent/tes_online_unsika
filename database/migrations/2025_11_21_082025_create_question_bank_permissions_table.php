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
        Schema::create('question_bank_permissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_bank_id');
            $table->unsignedBigInteger('owner_id'); // Yang punya soal
            $table->unsignedBigInteger('requester_id'); // Yang minta/diberi akses
            $table->enum('permission_type', ['request', 'shared']); // request = minta izin, shared = langsung diberi
            $table->enum('status', ['pending', 'approved', 'rejected', 'active'])->default('pending');
            $table->text('message')->nullable(); // Pesan saat request
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('expires_at')->nullable(); // Kapan permission expire
            $table->timestamps();

            // Indexes
            $table->index('question_bank_id');
            $table->index('owner_id');
            $table->index('requester_id');
            $table->index('status');

            // Foreign keys
            $table->foreign('question_bank_id')->references('id')->on('question_banks')->onDelete('cascade');
            $table->foreign('owner_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('requester_id')->references('id')->on('users')->onDelete('cascade');

            // Unique constraint dengan nama custom yang lebih pendek
            $table->unique(['question_bank_id', 'owner_id', 'requester_id'], 'qb_permissions_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_bank_permissions');
    }
};
