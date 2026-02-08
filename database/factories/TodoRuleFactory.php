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

    public function deadlineChanged(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'deadline_changed',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Notify stakeholders about date change on {title}',
        ]);
    }

    public function deadlineOverdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'deadline_overdue',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Escalate overdue initiative {title}',
        ]);
    }

    public function deadlineMissing(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'deadline_missing',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Set a due date for {title}',
        ]);
    }

    public function noRagSet(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'no_rag_set',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Set RAG status for {title}',
        ]);
    }

    public function statusChangedNotifyDependents(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'status_changed_notify_dependents',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Notify dependent teams about status change on {title}',
        ]);
    }

    public function movedToDone(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'moved_to_done',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Write retrospective for {title}',
        ]);
    }
}
