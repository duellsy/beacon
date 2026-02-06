<?php

use App\Models\Initiative;
use App\Models\Team;
use App\Models\User;

test('a team can be created', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'Payments',
            'delivery_lead' => 'Chris Wong',
            'product_owner' => 'Jane Smith',
            'color' => 'blue',
        ])
        ->assertRedirect(route('board'));

    expect(Team::count())->toBe(1);
    expect(Team::first()->name)->toBe('Payments');
    expect(Team::first()->color)->toBe('blue');
});

test('team creation requires name, delivery lead, and product owner', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [])
        ->assertSessionHasErrors(['name', 'delivery_lead', 'product_owner']);
});

test('a team can be updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Old Name']);

    $this->actingAs($user)
        ->put(route('teams.update', $team), [
            'name' => 'New Name',
            'delivery_lead' => 'New Lead',
            'product_owner' => 'New PO',
            'color' => 'red',
        ])
        ->assertRedirect(route('board'));

    expect($team->refresh()->name)->toBe('New Name');
    expect($team->color)->toBe('red');
});

test('deleting a team moves its initiatives to unassigned pool', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $initiative = Initiative::factory()->forTeam($team)->create();

    $this->actingAs($user)
        ->delete(route('teams.destroy', $team))
        ->assertRedirect(route('board'));

    expect(Team::count())->toBe(0);
    expect($initiative->refresh()->team_id)->toBeNull();
});

test('team creation validates color is a valid option', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), [
            'name' => 'Test',
            'delivery_lead' => 'Lead',
            'product_owner' => 'PO',
            'color' => 'neon',
        ])
        ->assertSessionHasErrors(['color']);
});

test('guests cannot create teams', function () {
    $this->post(route('teams.store'), [
        'name' => 'Test',
        'delivery_lead' => 'Lead',
        'product_owner' => 'PO',
        'color' => 'blue',
    ])->assertRedirect(route('login'));
});
