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
        Schema::create('initiatives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 120);
            $table->text('description')->nullable();
            $table->string('jira_url')->nullable();
            $table->foreignUuid('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('status')->default('upcoming');
            $table->string('engineer_owner')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('initiatives');
    }
};
