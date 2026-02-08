<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Initiative>
 */
class InitiativeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'jira_url' => fake()->optional()->url(),
            'team_id' => null,
            'team_member_id' => null,
            'project_id' => null,
            'status' => fake()->randomElement(['upcoming', 'in_progress', 'done']),
            'rag_status' => fake()->optional()->randomElement(['red', 'amber', 'green']),
            'expected_date' => fake()->optional()->dateTimeBetween('now', '+6 months'),
        ];
    }

    public function upcoming(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'upcoming']);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'in_progress']);
    }

    public function done(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'done']);
    }

    public function forTeam(Team $team): static
    {
        return $this->state(fn (array $attributes) => ['team_id' => $team->id]);
    }

    public function unassigned(): static
    {
        return $this->state(fn (array $attributes) => ['team_id' => null]);
    }
}
