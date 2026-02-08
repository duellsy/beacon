<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    public function run(): void
    {
        $board = Board::query()->first();

        $teams = [
            [
                'name' => 'Platform',
                'description' => 'Core platform infrastructure and reliability',
                'color' => 'blue',
                'sort_order' => 0,
                'members' => [
                    ['name' => 'Sarah Chen', 'role' => 'Delivery Lead'],
                    ['name' => 'Mike Torres', 'role' => 'Product Owner'],
                    ['name' => 'Jordan Lee', 'role' => 'Engineer'],
                    ['name' => 'Priya Patel', 'role' => 'Engineer'],
                ],
            ],
            [
                'name' => 'Growth',
                'description' => 'User acquisition and engagement features',
                'color' => 'emerald',
                'sort_order' => 1,
                'members' => [
                    ['name' => 'James Park', 'role' => 'Delivery Lead'],
                    ['name' => 'Lisa Nguyen', 'role' => 'Product Owner'],
                    ['name' => 'Tom Wright', 'role' => 'Engineer'],
                ],
            ],
            [
                'name' => 'Payments',
                'description' => 'Payment processing and billing systems',
                'color' => 'violet',
                'sort_order' => 2,
                'members' => [
                    ['name' => 'Emma Wilson', 'role' => 'Delivery Lead'],
                    ['name' => 'David Kim', 'role' => 'Product Owner'],
                    ['name' => 'Aisha Rahman', 'role' => 'Engineer'],
                    ['name' => 'Chris Dunn', 'role' => 'QA'],
                ],
            ],
            [
                'name' => 'Mobile',
                'description' => 'Native mobile applications',
                'color' => 'amber',
                'sort_order' => 3,
                'members' => [
                    ['name' => 'Alex Rivera', 'role' => 'Delivery Lead'],
                    ['name' => 'Rachel Adams', 'role' => 'Product Owner'],
                    ['name' => 'Ben O\'Sullivan', 'role' => 'Engineer'],
                ],
            ],
        ];

        foreach ($teams as $teamData) {
            $members = $teamData['members'];
            unset($teamData['members']);

            $team = Team::factory()->create([
                ...$teamData,
                'board_id' => $board->id,
            ]);

            foreach ($members as $index => $member) {
                TeamMember::factory()->create([
                    'team_id' => $team->id,
                    'name' => $member['name'],
                    'role' => $member['role'],
                    'sort_order' => $index,
                ]);
            }
        }
    }
}
