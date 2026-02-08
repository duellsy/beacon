<?php

namespace Database\Seeders;

use App\Models\Initiative;
use App\Models\Team;
use Illuminate\Database\Seeder;

class InitiativeSeeder extends Seeder
{
    public function run(): void
    {
        Team::with('members')->get()->each(function (Team $team) {
            $members = $team->members;

            Initiative::factory()
                ->count(5)
                ->forTeam($team)
                ->create()
                ->each(function (Initiative $initiative) use ($members) {
                    if ($members->isNotEmpty() && fake()->boolean(60)) {
                        $initiative->update([
                            'team_member_id' => $members->random()->id,
                        ]);
                    }
                });
        });
    }
}
