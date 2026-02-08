<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Initiative extends Model
{
    /** @use HasFactory<\Database\Factories\InitiativeFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'description',
        'jira_url',
        'team_id',
        'team_member_id',
        'project_id',
        'status',
        'rag_status',
        'expected_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expected_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return BelongsTo<TeamMember, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(TeamMember::class, 'team_member_id');
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Initiatives that this initiative depends on (blockers).
     *
     * @return BelongsToMany<Initiative, $this>
     */
    public function dependencies(): BelongsToMany
    {
        return $this->belongsToMany(
            Initiative::class,
            'initiative_dependencies',
            'initiative_id',
            'dependency_id',
        );
    }

    /**
     * Initiatives that depend on this initiative (dependents).
     *
     * @return BelongsToMany<Initiative, $this>
     */
    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(
            Initiative::class,
            'initiative_dependencies',
            'dependency_id',
            'initiative_id',
        );
    }

    /**
     * @return HasMany<InitiativeLog, $this>
     */
    public function logs(): HasMany
    {
        return $this->hasMany(InitiativeLog::class);
    }

    /**
     * @return HasMany<Todo, $this>
     */
    public function todos(): HasMany
    {
        return $this->hasMany(Todo::class);
    }

    public function isBlocked(): bool
    {
        return $this->dependencies()->where('status', '!=', 'done')->exists();
    }
}
