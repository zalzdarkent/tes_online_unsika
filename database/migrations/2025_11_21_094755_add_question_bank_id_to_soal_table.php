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
            $table->unsignedBigInteger('question_bank_id')->nullable()->after('id');
            $table->foreign('question_bank_id')->references('id')->on('question_banks')->onDelete('set null');
            $table->index('question_bank_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropForeign(['question_bank_id']);
            $table->dropIndex(['question_bank_id']);
            $table->dropColumn('question_bank_id');
        });
    }
};
