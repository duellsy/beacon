<?php

use App\Models\Initiative;
use App\Models\InitiativeLog;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;

test('creating an initiative logs "Initiative created"', function () {
    $initiative = Initiative::factory()->create();

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe('Initiative created');
});

test('changing status logs the change', function () {
    $initiative = Initiative::factory()->create(['status' => 'upcoming']);

    $initiative->update(['status' => 'in_progress']);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'like', 'Status changed%')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe('Status changed from Upcoming to In Progress');
});

test('changing team logs the change with team names', function () {
    $teamA = Team::factory()->create(['name' => 'Team Alpha']);
    $teamB = Team::factory()->create(['name' => 'Team Beta']);
    $initiative = Initiative::factory()->forTeam($teamA)->create();

    $initiative->update(['team_id' => $teamB->id]);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'like', 'Team changed%')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe('Team changed from Team Alpha to Team Beta');
});

test('unassigning team logs correctly', function () {
    $team = Team::factory()->create(['name' => 'Team Alpha']);
    $initiative = Initiative::factory()->forTeam($team)->create();

    $initiative->update(['team_id' => null]);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'like', 'Team changed%')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe('Team changed from Team Alpha to Unassigned');
});

test('changing project logs the change', function () {
    $project = Project::factory()->create(['name' => 'Project X']);
    $initiative = Initiative::factory()->create();

    $initiative->update(['project_id' => $project->id]);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'like', 'Project changed%')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe('Project changed to Project X');
});

test('removing project logs correctly', function () {
    $project = Project::factory()->create(['name' => 'Project X']);
    $initiative = Initiative::factory()->create(['project_id' => $project->id]);

    $initiative->update(['project_id' => null]);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'Project removed')
        ->first();

    expect($log)->not->toBeNull();
});

test('changing expected date logs the change', function () {
    $initiative = Initiative::factory()->create(['expected_date' => null]);

    $initiative->update(['expected_date' => '2026-03-15']);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'like', 'Expected date changed%')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe('Expected date changed to 15 Mar 2026');
});

test('removing expected date logs correctly', function () {
    $initiative = Initiative::factory()->create(['expected_date' => '2026-03-15']);

    $initiative->update(['expected_date' => null]);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'Expected date removed')
        ->first();

    expect($log)->not->toBeNull();
});

test('changing title logs the change', function () {
    $initiative = Initiative::factory()->create(['title' => 'Old Title']);

    $initiative->update(['title' => 'New Title']);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'like', 'Title changed%')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->body)->toBe("Title changed from 'Old Title' to 'New Title'");
});

test('changing description logs "Description updated"', function () {
    $initiative = Initiative::factory()->create(['description' => 'Old desc']);

    $initiative->update(['description' => 'New desc']);

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'Description updated')
        ->first();

    expect($log)->not->toBeNull();
});

test('multiple field changes create multiple log entries', function () {
    $initiative = Initiative::factory()->create([
        'status' => 'upcoming',
        'title' => 'Old Title',
    ]);

    $initiative->update([
        'status' => 'done',
        'title' => 'New Title',
    ]);

    $systemLogs = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', '!=', 'Initiative created')
        ->get();

    expect($systemLogs)->toHaveCount(2);
});

test('adding a dependency logs "Dependency added"', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $dependency = Initiative::factory()->create(['title' => 'Blocker Task']);

    $this->actingAs($user)
        ->post(route('dependencies.store', $initiative), [
            'dependency_id' => $dependency->id,
        ])
        ->assertRedirect();

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'Dependency added: Blocker Task')
        ->first();

    expect($log)->not->toBeNull();
});

test('removing a dependency logs "Dependency removed"', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $dependency = Initiative::factory()->create(['title' => 'Blocker Task']);
    $initiative->dependencies()->attach($dependency->id);

    $this->actingAs($user)
        ->delete(route('dependencies.destroy', [
            'initiative' => $initiative->id,
            'dependency' => $dependency->id,
        ]))
        ->assertRedirect();

    $log = InitiativeLog::where('initiative_id', $initiative->id)
        ->where('type', 'system')
        ->where('body', 'Dependency removed: Blocker Task')
        ->first();

    expect($log)->not->toBeNull();
});

test('user log entries default to type "user"', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('initiative-logs.store', $initiative), [
            'body' => 'A user comment',
        ]);

    $log = InitiativeLog::where('body', 'A user comment')->first();

    expect($log->type)->toBe('user');
});
