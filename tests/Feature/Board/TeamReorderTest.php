<?php

use App\Models\Team;
use App\Models\User;

test('teams are returned in sort_order on the board', function () {
    $user = User::factory()->create();
    $teamC = Team::factory()->create(['name' => 'Charlie', 'sort_order' => 2]);
    $teamA = Team::factory()->create(['name' => 'Alpha', 'sort_order' => 0]);
    $teamB = Team::factory()->create(['name' => 'Bravo', 'sort_order' => 1]);

    $this->actingAs($user)
        ->get(route('board'))
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
    $teamA = Team::factory()->create(['name' => 'Alpha', 'sort_order' => 0]);
    $teamB = Team::factory()->create(['name' => 'Bravo', 'sort_order' => 1]);
    $teamC = Team::factory()->create(['name' => 'Charlie', 'sort_order' => 2]);

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
    $team = Team::factory()->create();

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
    Team::factory()->create(['sort_order' => 5]);

    $response = $this->actingAs($user)->get(route('board.export'));

    $response->assertOk();
    $response->assertJsonPath('teams.0.sort_order', 5);
});

test('import preserves sort_order from exported data', function () {
    $user = User::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'First Team',
                'delivery_lead' => 'Lead A',
                'product_owner' => 'PO A',
                'sort_order' => 3,
            ],
            [
                'id' => 'team-2',
                'name' => 'Second Team',
                'delivery_lead' => 'Lead B',
                'product_owner' => 'PO B',
                'sort_order' => 1,
            ],
        ],
        'projects' => [],
        'initiatives' => [],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    expect(Team::query()->find('team-1')->sort_order)->toBe(3);
    expect(Team::query()->find('team-2')->sort_order)->toBe(1);
});

test('import falls back to array index when sort_order is missing', function () {
    $user = User::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'First Team',
                'delivery_lead' => 'Lead A',
                'product_owner' => 'PO A',
            ],
            [
                'id' => 'team-2',
                'name' => 'Second Team',
                'delivery_lead' => 'Lead B',
                'product_owner' => 'PO B',
            ],
        ],
        'projects' => [],
        'initiatives' => [],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    expect(Team::query()->find('team-1')->sort_order)->toBe(0);
    expect(Team::query()->find('team-2')->sort_order)->toBe(1);
});

test('new teams get sort_order at the end', function () {
    $user = User::factory()->create();
    Team::factory()->create(['sort_order' => 0]);
    Team::factory()->create(['sort_order' => 1]);

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'New Team',
            'delivery_lead' => 'Lead',
            'product_owner' => 'PO',
            'color' => 'blue',
        ])
        ->assertRedirect(route('board'));

    $newTeam = Team::query()->where('name', 'New Team')->first();
    expect($newTeam->sort_order)->toBe(2);
});
