<?php

use App\Models\Initiative;
use App\Models\Team;
use App\Models\User;

test('dashboard shows stats for initiatives', function () {
    $user = User::factory()->create();

    Initiative::factory()->count(2)->create(['status' => 'in_progress']);
    Initiative::factory()->count(3)->create(['status' => 'upcoming']);
    Initiative::factory()->create(['status' => 'done']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertSuccessful();
    $stats = $response->original->getData()['page']['props']['stats'];
    expect($stats['total'])->toBe(6);
    expect($stats['inProgress'])->toBe(2);
    expect($stats['upcoming'])->toBe(3);
    expect($stats['done'])->toBe(1);
});

test('dashboard returns per-team data with counts and in-progress initiatives', function () {
    $user = User::factory()->create();

    $teamA = Team::factory()->create(['name' => 'Alpha', 'color' => 'blue']);
    $teamB = Team::factory()->create(['name' => 'Bravo', 'color' => 'red']);

    Initiative::factory()->forTeam($teamA)->inProgress()->create(['title' => 'Alpha Task 1']);
    Initiative::factory()->forTeam($teamA)->inProgress()->create(['title' => 'Alpha Task 2']);
    Initiative::factory()->forTeam($teamA)->upcoming()->create();
    Initiative::factory()->forTeam($teamA)->done()->create();

    Initiative::factory()->forTeam($teamB)->inProgress()->create(['title' => 'Bravo Task 1']);
    Initiative::factory()->forTeam($teamB)->upcoming()->count(2)->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertSuccessful();
    $teams = $response->original->getData()['page']['props']['teams'];

    $alpha = collect($teams)->firstWhere('name', 'Alpha');
    expect($alpha['color'])->toBe('blue');
    expect($alpha['counts']['in_progress'])->toBe(2);
    expect($alpha['counts']['upcoming'])->toBe(1);
    expect($alpha['counts']['done'])->toBe(1);
    expect($alpha['inProgressInitiatives'])->toHaveCount(2);
    expect(collect($alpha['inProgressInitiatives'])->pluck('title')->all())
        ->toContain('Alpha Task 1', 'Alpha Task 2');

    $bravo = collect($teams)->firstWhere('name', 'Bravo');
    expect($bravo['counts']['in_progress'])->toBe(1);
    expect($bravo['counts']['upcoming'])->toBe(2);
    expect($bravo['counts']['done'])->toBe(0);
    expect($bravo['inProgressInitiatives'])->toHaveCount(1);
});

test('dashboard returns unassigned initiatives data', function () {
    $user = User::factory()->create();

    Initiative::factory()->unassigned()->inProgress()->create(['title' => 'Orphan Task']);
    Initiative::factory()->unassigned()->upcoming()->count(2)->create();
    Initiative::factory()->unassigned()->done()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertSuccessful();
    $unassigned = $response->original->getData()['page']['props']['unassigned'];

    expect($unassigned['counts']['in_progress'])->toBe(1);
    expect($unassigned['counts']['upcoming'])->toBe(2);
    expect($unassigned['counts']['done'])->toBe(1);
    expect($unassigned['inProgressInitiatives'])->toHaveCount(1);
    expect($unassigned['inProgressInitiatives'][0]['title'])->toBe('Orphan Task');
});

test('dashboard shows recent activity', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $initiative->logs()->create(['body' => 'Test activity log']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertSuccessful();
    $activity = $response->original->getData()['page']['props']['recentActivity'];
    $userLogs = collect($activity)->where('type', 'user');
    expect($userLogs)->toHaveCount(1);
    expect($userLogs->first()['body'])->toBe('Test activity log');
    expect($userLogs->first()['initiative_title'])->toBe($initiative->title);
});

test('dashboard requires authentication', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});
