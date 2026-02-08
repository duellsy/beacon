<?php

use App\Models\Board;
use App\Models\Initiative;
use App\Models\Team;
use App\Models\User;

test('guests are redirected to login from board', function () {
    $board = Board::factory()->create();
    $this->get(route('board.show', $board))->assertRedirect(route('login'));
});

test('authenticated users can view the board', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $this->actingAs($user)
        ->get(route('board.show', $board))
        ->assertOk();
});

test('board displays teams and initiatives', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['name' => 'Payments', 'board_id' => $board->id]);
    Initiative::factory()->forTeam($team)->create(['title' => 'Build checkout']);

    $response = $this->actingAs($user)->get(route('board.show', $board));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('board')
        ->has('teams', 1)
        ->has('initiatives', 1)
    );
});

test('board export returns json with teams and initiatives', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);
    Initiative::factory()->forTeam($team)->create();

    $response = $this->actingAs($user)->get(route('board.export', $board));

    $response->assertOk();
    $response->assertJsonStructure([
        'teams' => [['id', 'name', 'color']],
        'initiatives' => [['id', 'title', 'status', 'dependencies']],
    ]);
});

test('board import replaces all data', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $existingTeam = Team::factory()->create(['board_id' => $board->id]);
    Initiative::factory()->forTeam($existingTeam)->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'Imported Team',
            ],
        ],
        'projects' => [],
        'initiatives' => [
            [
                'id' => 'init-1',
                'title' => 'Imported Initiative',
                'description' => null,
                'jira_url' => null,
                'team_id' => 'team-1',
                'status' => 'upcoming',
                'dependencies' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import', $board), $importData)
        ->assertRedirect();

    expect(Team::count())->toBe(1);
    expect(Initiative::count())->toBe(1);
    expect(Team::first()->name)->toBe('Imported Team');
    expect(Initiative::first()->title)->toBe('Imported Initiative');
});

test('board import handles invalid team references gracefully', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'Team A',
            ],
        ],
        'projects' => [],
        'initiatives' => [
            [
                'id' => 'init-1',
                'title' => 'Initiative',
                'description' => null,
                'jira_url' => null,
                'team_id' => 'nonexistent-team',
                'status' => 'upcoming',
                'dependencies' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import', $board), $importData)
        ->assertRedirect();

    expect(Initiative::first()->team_id)->toBeNull();
});

test('board import preserves valid dependencies', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $importData = [
        'teams' => [],
        'projects' => [],
        'initiatives' => [
            [
                'id' => 'init-1',
                'title' => 'Initiative A',
                'description' => null,
                'jira_url' => null,
                'team_id' => null,
                'status' => 'done',
                'dependencies' => [],
            ],
            [
                'id' => 'init-2',
                'title' => 'Initiative B',
                'description' => null,
                'jira_url' => null,
                'team_id' => null,
                'status' => 'upcoming',
                'dependencies' => ['init-1'],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import', $board), $importData)
        ->assertRedirect();

    $initiativeB = Initiative::query()->find('init-2');
    expect($initiativeB->dependencies)->toHaveCount(1);
    expect($initiativeB->dependencies->first()->id)->toBe('init-1');
});
