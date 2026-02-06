<?php

use App\Models\Initiative;
use App\Models\Team;
use App\Models\User;

test('guests are redirected to login from board', function () {
    $this->get(route('board'))->assertRedirect(route('login'));
});

test('authenticated users can view the board', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('board'))
        ->assertOk();
});

test('board displays teams and initiatives', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Payments']);
    Initiative::factory()->forTeam($team)->create(['title' => 'Build checkout']);

    $response = $this->actingAs($user)->get(route('board'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('board')
        ->has('teams', 1)
        ->has('initiatives', 1)
    );
});

test('board export returns json with teams and initiatives', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    Initiative::factory()->forTeam($team)->create();

    $response = $this->actingAs($user)->get(route('board.export'));

    $response->assertOk();
    $response->assertJsonStructure([
        'teams' => [['id', 'name', 'delivery_lead', 'product_owner', 'color']],
        'initiatives' => [['id', 'title', 'status', 'dependencies']],
    ]);
});

test('board import replaces all data', function () {
    $user = User::factory()->create();
    Team::factory()->create();
    Initiative::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'Imported Team',
                'delivery_lead' => 'Lead A',
                'product_owner' => 'PO A',
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
                'engineer_owner' => null,
                'dependencies' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    expect(Team::count())->toBe(1);
    expect(Initiative::count())->toBe(1);
    expect(Team::first()->name)->toBe('Imported Team');
    expect(Initiative::first()->title)->toBe('Imported Initiative');
});

test('board import handles invalid team references gracefully', function () {
    $user = User::factory()->create();

    $importData = [
        'teams' => [
            [
                'id' => 'team-1',
                'name' => 'Team A',
                'delivery_lead' => 'Lead',
                'product_owner' => 'PO',
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
                'engineer_owner' => null,
                'dependencies' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    expect(Initiative::first()->team_id)->toBeNull();
});

test('board import preserves valid dependencies', function () {
    $user = User::factory()->create();

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
                'engineer_owner' => null,
                'dependencies' => [],
            ],
            [
                'id' => 'init-2',
                'title' => 'Initiative B',
                'description' => null,
                'jira_url' => null,
                'team_id' => null,
                'status' => 'upcoming',
                'engineer_owner' => null,
                'dependencies' => ['init-1'],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    $initiativeB = Initiative::query()->find('init-2');
    expect($initiativeB->dependencies)->toHaveCount(1);
    expect($initiativeB->dependencies->first()->id)->toBe('init-1');
});
