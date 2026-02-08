<?php

use App\Models\Board;
use App\Models\Team;
use App\Models\User;

test('teams are returned in sort_order on the board', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $teamC = Team::factory()->create(['name' => 'Charlie', 'sort_order' => 2, 'board_id' => $board->id]);
    $teamA = Team::factory()->create(['name' => 'Alpha', 'sort_order' => 0, 'board_id' => $board->id]);
    $teamB = Team::factory()->create(['name' => 'Bravo', 'sort_order' => 1, 'board_id' => $board->id]);

    $this->actingAs($user)
        ->get(route('board.show', $board))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('board')
            ->has('teams', 3)
            ->where('teams.0.id', $teamA->id)
            ->where('teams.1.id', $teamB->id)
            ->where('teams.2.id', $teamC->id)
        );
});

test('reorder endpoint updates sort_order correctly', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $teamA = Team::factory()->create(['name' => 'Alpha', 'sort_order' => 0, 'board_id' => $board->id]);
    $teamB = Team::factory()->create(['name' => 'Bravo', 'sort_order' => 1, 'board_id' => $board->id]);
    $teamC = Team::factory()->create(['name' => 'Charlie', 'sort_order' => 2, 'board_id' => $board->id]);

    $this->actingAs($user)
        ->post(route('teams.reorder'), [
            'ids' => [$teamC->id, $teamA->id, $teamB->id],
        ])
        ->assertRedirect();

    expect($teamC->refresh()->sort_order)->toBe(0);
    expect($teamA->refresh()->sort_order)->toBe(1);
    expect($teamB->refresh()->sort_order)->toBe(2);
});

test('reorder requires authentication', function () {
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);

    $this->post(route('teams.reorder'), [
        'ids' => [$team->id],
    ])->assertRedirect(route('login'));
});

test('reorder validates ids are required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.reorder'), ['ids' => []])
        ->assertSessionHasErrors('ids');
});

test('reorder validates ids exist in database', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.reorder'), ['ids' => ['nonexistent-id']])
        ->assertSessionHasErrors('ids.0');
});

test('export includes sort_order', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    Team::factory()->create(['sort_order' => 5, 'board_id' => $board->id]);

    $response = $this->actingAs($user)->get(route('board.export', $board));

    $response->assertOk();
    $response->assertJsonPath('teams.0.sort_order', 5);
});

test('import preserves sort_order from exported data', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'First Team',
                'sort_order' => 3,
            ],
            [
                'id' => 'team-2',
                'name' => 'Second Team',
                'sort_order' => 1,
            ],
        ],
        'projects' => [],
        'initiatives' => [],
    ];

    $this->actingAs($user)
        ->post(route('board.import', $board), $importData)
        ->assertRedirect();

    expect(Team::query()->find('team-1')->sort_order)->toBe(3);
    expect(Team::query()->find('team-2')->sort_order)->toBe(1);
});

test('import falls back to array index when sort_order is missing', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'First Team',
            ],
            [
                'id' => 'team-2',
                'name' => 'Second Team',
            ],
        ],
        'projects' => [],
        'initiatives' => [],
    ];

    $this->actingAs($user)
        ->post(route('board.import', $board), $importData)
        ->assertRedirect();

    expect(Team::query()->find('team-1')->sort_order)->toBe(0);
    expect(Team::query()->find('team-2')->sort_order)->toBe(1);
});

test('new teams get sort_order at the end', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    Team::factory()->create(['sort_order' => 0, 'board_id' => $board->id]);
    Team::factory()->create(['sort_order' => 1, 'board_id' => $board->id]);

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'New Team',
            'color' => 'blue',
            'board_id' => $board->id,
        ])
        ->assertRedirect();

    $newTeam = Team::query()->where('name', 'New Team')->first();
    expect($newTeam->sort_order)->toBe(2);
});
