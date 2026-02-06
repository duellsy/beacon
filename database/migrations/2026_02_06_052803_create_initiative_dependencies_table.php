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
        Schema::create('initiative_dependencies', function (Blueprint $table) {
            $table->foreignUuid('initiative_id')->constrained('initiatives')->cascadeOnDelete();
            $table->foreignUuid('dependency_id')->constrained('initiatives')->cascadeOnDelete();
            $table->primary(['initiative_id', 'dependency_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('initiative_dependencies');
    }
};
