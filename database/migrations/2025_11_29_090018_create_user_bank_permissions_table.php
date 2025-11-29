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
        Schema::create('user_bank_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('grantee_id')->constrained('users')->onDelete('cascade');
            $table->boolean('can_view')->default(true);
            $table->boolean('can_copy')->default(true); // Can copy questions to their own bank or tests
            $table->timestamps();

            $table->unique(['owner_id', 'grantee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_bank_permissions');
    }
};
