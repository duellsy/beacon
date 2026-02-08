<?php

use App\Models\Board;
use App\Models\Initiative;
use App\Models\Team;
use App\Models\Todo;
use App\Models\User;

test('dashboard returns in-progress initiatives with correct shape', function () {
    $user = User::factory()->create();

    $board = Board::factory()->create(['name' => 'Q1 Board']);
    $team = Team::factory()->create(['name' => 'Alpha', 'color' => 'blue', 'board_id' => $board->id]);
    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'title' => 'Build feature',
        'rag_status' => 'amber',
        'expected_date' => '2026-03-15',
    ]);

    Todo::factory()->count(3)->create(['initiative_id' => $initiative->id, 'user_id' => $user->id]);
    Todo::factory()->completed()->create(['initiative_id' => $initiative->id, 'user_id' => $user->id]);

    Initiative::factory()->upcoming()->create();
    Initiative::factory()->done()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertSuccessful();
    $items = $response->original->getData()['page']['props']['inProgressInitiatives'];

    expect($items)->toHaveCount(1);
    expect($items[0])->toMatchArray([
        'id' => $initiative->id,
        'title' => 'Build feature',
        'team_name' => 'Alpha',
        'team_color' => 'blue',
        'board_id' => $board->id,
        'board_name' => 'Q1 Board',
        'todo_count' => 4,
        'incomplete_todo_count' => 3,
        'rag_status' => 'amber',
        'expected_date' => '2026-03-15',
    ]);
});

test('dashboard includes unassigned in-progress initiatives', function () {
    $user = User::factory()->create();

    Initiative::factory()->unassigned()->inProgress()->create(['title' => 'Orphan Task']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertSuccessful();
    $items = $response->original->getData()['page']['props']['inProgressInitiatives'];

    expect($items)->toHaveCount(1);
    expect($items[0]['title'])->toBe('Orphan Task');
    expect($items[0]['team_name'])->toBeNull();
    expect($items[0]['board_id'])->toBeNull();
    expect($items[0]['board_name'])->toBeNull();
});

test('dashboard orders in-progress initiatives by expected_date desc then team name', function () {
    $user = User::factory()->create();

    $teamB = Team::factory()->create(['name' => 'Bravo']);
    $teamA = Team::factory()->create(['name' => 'Alpha']);

    $first = Initiative::factory()->forTeam($teamA)->inProgress()->create([
        'title' => 'Far future',
        'expected_date' => '2026-06-01',
    ]);
    $second = Initiative::factory()->forTeam($teamA)->inProgress()->create([
        'title' => 'Soon Alpha',
        'expected_date' => '2026-03-01',
    ]);
    $third = Initiative::factory()->forTeam($teamB)->inProgress()->create([
        'title' => 'Soon Bravo',
        'expected_date' => '2026-03-01',
    ]);
    $fourth = Initiative::factory()->unassigned()->inProgress()->create([
        'title' => 'No date',
        'expected_date' => null,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $items = $response->original->getData()['page']['props']['inProgressInitiatives'];
    $titles = collect($items)->pluck('title')->all();

    expect($titles)->toBe(['Far future', 'Soon Alpha', 'Soon Bravo', 'No date']);
});

test('dashboard requires authentication', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});
