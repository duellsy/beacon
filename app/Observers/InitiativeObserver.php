<?php

namespace App\Observers;

use App\Models\Initiative;
use App\Models\Project;
use App\Models\Team;

class InitiativeObserver
{
    public function created(Initiative $initiative): void
    {
        $initiative->logs()->create([
            'body' => 'Initiative created',
            'type' => 'system',
        ]);
    }

    public function updated(Initiative $initiative): void
    {
        $dirty = $initiative->getDirty();

        foreach ($dirty as $field => $newValue) {
            $originalValue = $initiative->getOriginal($field);
            $message = $this->describeChange($field, $originalValue, $newValue);

            if ($message) {
                $initiative->logs()->create([
                    'body' => $message,
                    'type' => 'system',
                ]);
            }
        }
    }

    private function describeChange(string $field, mixed $original, mixed $new): ?string
    {
        return match ($field) {
            'status' => sprintf(
                'Status changed from %s to %s',
                $this->formatStatus($original),
                $this->formatStatus($new),
            ),
            'team_id' => sprintf(
                'Team changed from %s to %s',
                $this->resolveTeamName($original),
                $this->resolveTeamName($new),
            ),
            'project_id' => $new
                ? sprintf('Project changed to %s', $this->resolveProjectName($new))
                : 'Project removed',
            'engineer_owner' => $new
                ? sprintf('Engineer owner changed to %s', $new)
                : 'Engineer owner removed',
            'expected_date' => $new
                ? sprintf('Expected date changed to %s', $this->formatDate($new))
                : 'Expected date removed',
            'title' => sprintf(
                "Title changed from '%s' to '%s'",
                $original,
                $new,
            ),
            'description' => 'Description updated',
            default => null,
        };
    }

    private function formatStatus(?string $status): string
    {
        return match ($status) {
            'upcoming' => 'Upcoming',
            'in_progress' => 'In Progress',
            'done' => 'Done',
            default => $status ?? 'Unknown',
        };
    }

    private function resolveTeamName(?string $teamId): string
    {
        if (! $teamId) {
            return 'Unassigned';
        }

        return Team::find($teamId)?->name ?? 'Unknown';
    }

    private function resolveProjectName(?string $projectId): string
    {
        if (! $projectId) {
            return 'None';
        }

        return Project::find($projectId)?->name ?? 'Unknown';
    }

    private function formatDate(mixed $date): string
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('j M Y');
        }

        try {
            return (new \DateTime($date))->format('j M Y');
        } catch (\Exception) {
            return (string) $date;
        }
    }
}
