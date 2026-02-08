<?php

use App\Models\Board;
use App\Models\Team;
use App\Models\User;

test('a board can be created', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('boards.store'), ['name' => 'Q1 Planning'])
        ->assertRedirect();

    expect(Board::count())->toBe(1);
    expect(Board::first()->name)->toBe('Q1 Planning');
});

test('a board can be updated', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['name' => 'Old Name']);

    $this->actingAs($user)
        ->put(route('boards.update', $board), ['name' => 'New Name'])
        ->assertRedirect();

    expect($board->refresh()->name)->toBe('New Name');
});

test('a board can be deleted', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $this->actingAs($user)
        ->delete(route('boards.destroy', $board))
        ->assertRedirect();

    expect(Board::count())->toBe(0);
});

test('deleting a board cascades to teams', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    Team::factory()->create(['board_id' => $board->id]);

    $this->actingAs($user)
        ->delete(route('boards.destroy', $board));

    expect(Board::count())->toBe(0);
    expect(Team::count())->toBe(0);
});

test('new boards get incrementing sort order', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('boards.store'), ['name' => 'First']);
    $this->actingAs($user)->post(route('boards.store'), ['name' => 'Second']);

    expect(Board::where('name', 'First')->first()->sort_order)->toBe(0);
    expect(Board::where('name', 'Second')->first()->sort_order)->toBe(1);
});

test('board show route displays scoped teams', function () {
    $user = User::factory()->create();
    $boardA = Board::factory()->create();
    $boardB = Board::factory()->create();

    Team::factory()->create(['name' => 'Team A', 'board_id' => $boardA->id]);
    Team::factory()->create(['name' => 'Team B', 'board_id' => $boardB->id]);

    $this->actingAs($user)
        ->get(route('board.show', $boardA))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('board')
            ->has('teams', 1)
            ->where('teams.0.name', 'Team A')
            ->has('board')
            ->where('board.id', $boardA->id)
        );
});

test('legacy board route redirects to first board', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();

    $this->actingAs($user)
        ->get(route('board'))
        ->assertRedirect(route('board.show', $board));
});

test('board name is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('boards.store'), ['name' => ''])
        ->assertSessionHasErrors('name');
});
