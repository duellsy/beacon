<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TodoRule>
 */
class TodoRuleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'trigger_type' => 'rag_status_changed',
            'trigger_from' => null,
            'trigger_to' => 'red',
            'suggested_body' => 'Address red RAG status on {title}',
            'suggested_deadline_days' => 3,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function statusChanged(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'status_changed',
            'trigger_from' => null,
            'trigger_to' => 'done',
            'suggested_body' => 'Create changelog for {title}',
        ]);
    }
}
