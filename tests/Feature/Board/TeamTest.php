<?php

use App\Models\Board;
use App\Models\Initiative;
use App\Models\Team;
use App\Models\User;

test('a team can be created', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'Payments',
            'color' => 'blue',
            'board_id' => $board->id,
        ])
        ->assertRedirect();

    expect(Team::count())->toBe(1);
    expect(Team::first()->name)->toBe('Payments');
    expect(Team::first()->color)->toBe('blue');
});

test('team creation requires name', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'board_id' => $board->id,
        ])
        ->assertSessionHasErrors(['name']);
});

test('a team can be updated', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['name' => 'Old Name', 'board_id' => $board->id]);

    $this->actingAs($user)
        ->put(route('teams.update', $team), [
            'name' => 'New Name',
            'color' => 'red',
        ])
        ->assertRedirect();

    expect($team->refresh()->name)->toBe('New Name');
    expect($team->color)->toBe('red');
});

test('deleting a team moves its initiatives to unassigned pool', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);
    $initiative = Initiative::factory()->forTeam($team)->create();

    $this->actingAs($user)
        ->delete(route('teams.destroy', $team))
        ->assertRedirect();

    expect(Team::count())->toBe(0);
    expect($initiative->refresh()->team_id)->toBeNull();
});

test('team creation validates color is a valid option', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'Test',
            'color' => 'neon',
            'board_id' => $board->id,
        ])
        ->assertSessionHasErrors(['color']);
});

test('guests cannot create teams', function () {
    $board = Board::factory()->create();

    $this->post(route('teams.store'), [
        'name' => 'Test',
        'color' => 'blue',
        'board_id' => $board->id,
    ])->assertRedirect(route('login'));
});
