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
        Schema::table('initiatives', function (Blueprint $table) {
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('initiatives', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_id');
        });
    }
};
