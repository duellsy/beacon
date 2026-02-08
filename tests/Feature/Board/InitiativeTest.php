<?php

use App\Models\Initiative;
use App\Models\Team;
use App\Models\User;

test('an initiative can be created', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => 'Build checkout flow',
            'status' => 'upcoming',
        ])
        ->assertRedirect();

    expect(Initiative::count())->toBe(1);
    expect(Initiative::first()->title)->toBe('Build checkout flow');
    expect(Initiative::first()->team_id)->toBeNull();
});

test('an initiative can be created with all fields', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => 'Build checkout flow',
            'description' => 'A detailed description',
            'jira_url' => 'https://jira.example.com/PROJ-123',
            'team_id' => $team->id,
            'status' => 'in_progress',
        ])
        ->assertRedirect();

    $initiative = Initiative::first();
    expect($initiative->title)->toBe('Build checkout flow');
    expect($initiative->description)->toBe('A detailed description');
    expect($initiative->jira_url)->toBe('https://jira.example.com/PROJ-123');
    expect($initiative->team_id)->toBe($team->id);
    expect($initiative->status)->toBe('in_progress');
});

test('initiative title is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), ['status' => 'upcoming'])
        ->assertSessionHasErrors(['title']);
});

test('initiative title max length is 120', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => str_repeat('a', 121),
            'status' => 'upcoming',
        ])
        ->assertSessionHasErrors(['title']);
});

test('initiative jira url must be valid url', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => 'Test',
            'status' => 'upcoming',
            'jira_url' => 'not-a-url',
        ])
        ->assertSessionHasErrors(['jira_url']);
});

test('an initiative can be updated', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create(['title' => 'Old Title', 'status' => 'upcoming']);

    $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => 'New Title',
            'status' => 'in_progress',
        ])
        ->assertRedirect();

    expect($initiative->refresh()->title)->toBe('New Title');
    expect($initiative->refresh()->status)->toBe('in_progress');
});

test('an initiative can be moved between teams and statuses', function () {
    $user = User::factory()->create();
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $initiative = Initiative::factory()->forTeam($teamA)->upcoming()->create();

    $this->actingAs($user)
        ->patch(route('initiatives.move', $initiative), [
            'team_id' => $teamB->id,
            'status' => 'in_progress',
        ])
        ->assertRedirect();

    $initiative->refresh();
    expect($initiative->team_id)->toBe($teamB->id);
    expect($initiative->status)->toBe('in_progress');
});

test('an initiative can be moved to unassigned pool', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $initiative = Initiative::factory()->forTeam($team)->create();

    $this->actingAs($user)
        ->patch(route('initiatives.move', $initiative), [
            'team_id' => null,
        ])
        ->assertRedirect();

    expect($initiative->refresh()->team_id)->toBeNull();
});

test('deleting an initiative removes its dependencies', function () {
    $user = User::factory()->create();
    $initiativeA = Initiative::factory()->done()->create();
    $initiativeB = Initiative::factory()->upcoming()->create();
    $initiativeB->dependencies()->attach($initiativeA->id);

    $this->actingAs($user)
        ->delete(route('initiatives.destroy', $initiativeA))
        ->assertRedirect();

    expect(Initiative::find($initiativeA->id))->toBeNull();
    expect($initiativeB->refresh()->dependencies)->toHaveCount(0);
});
