<?php

namespace Database\Factories;

use App\Models\Initiative;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Todo>
 */
class TodoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'initiative_id' => Initiative::factory(),
            'user_id' => User::factory(),
            'body' => fake()->sentence(),
            'deadline' => fake()->dateTimeBetween('now', '+30 days'),
            'is_complete' => false,
            'source' => 'manual',
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_complete' => true,
        ]);
    }
}
