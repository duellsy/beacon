<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate existing delivery_lead and product_owner to team_members
        $teams = DB::table('teams')->get();

        foreach ($teams as $team) {
            if ($team->delivery_lead) {
                DB::table('team_members')->insert([
                    'id' => Str::uuid()->toString(),
                    'team_id' => $team->id,
                    'name' => $team->delivery_lead,
                    'role' => 'Delivery Lead',
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if ($team->product_owner) {
                DB::table('team_members')->insert([
                    'id' => Str::uuid()->toString(),
                    'team_id' => $team->id,
                    'name' => $team->product_owner,
                    'role' => 'Product Owner',
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['delivery_lead', 'product_owner']);
        });

        Schema::table('initiatives', function (Blueprint $table) {
            $table->dropColumn('engineer_owner');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->string('delivery_lead')->nullable();
            $table->string('product_owner')->nullable();
        });

        Schema::table('initiatives', function (Blueprint $table) {
            $table->string('engineer_owner')->nullable();
        });
    }
};
