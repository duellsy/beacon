<?php

use App\Models\Initiative;
use App\Models\InitiativeLog;
use App\Models\User;

test('a log entry can be created for an initiative', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('initiative-logs.store', $initiative), [
            'body' => 'Started working on this feature.',
        ])
        ->assertRedirect(route('board'));

    $userLogs = InitiativeLog::where('type', 'user')->get();
    expect($userLogs)->toHaveCount(1);
    expect($userLogs->first()->body)->toBe('Started working on this feature.');
    expect($userLogs->first()->initiative_id)->toBe($initiative->id);
});

test('log body is required', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('initiative-logs.store', $initiative), [
            'body' => '',
        ])
        ->assertSessionHasErrors(['body']);
});

test('log body cannot exceed 10000 characters', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('initiative-logs.store', $initiative), [
            'body' => str_repeat('a', 10001),
        ])
        ->assertSessionHasErrors(['body']);
});

test('logs are deleted when initiative is deleted', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $initiative->logs()->create(['body' => 'Log entry 1']);
    $initiative->logs()->create(['body' => 'Log entry 2']);

    expect(InitiativeLog::where('type', 'user')->count())->toBe(2);

    $this->actingAs($user)
        ->delete(route('initiatives.destroy', $initiative))
        ->assertRedirect(route('board'));

    expect(InitiativeLog::count())->toBe(0);
});

test('initiative expected_date can be set when creating', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => 'Build feature',
            'status' => 'upcoming',
            'expected_date' => '2026-03-15',
        ])
        ->assertRedirect(route('board'));

    expect(Initiative::first()->expected_date->toDateString())->toBe('2026-03-15');
});

test('initiative expected_date can be null', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => 'Build feature',
            'status' => 'upcoming',
            'expected_date' => null,
        ])
        ->assertRedirect(route('board'));

    expect(Initiative::first()->expected_date)->toBeNull();
});

test('initiative expected_date must be a valid date', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('initiatives.store'), [
            'title' => 'Build feature',
            'status' => 'upcoming',
            'expected_date' => 'not-a-date',
        ])
        ->assertSessionHasErrors(['expected_date']);
});

test('initiative expected_date can be updated', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create(['status' => 'upcoming']);

    $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'status' => 'upcoming',
            'expected_date' => '2026-06-01',
        ])
        ->assertRedirect(route('board'));

    expect($initiative->refresh()->expected_date->toDateString())->toBe('2026-06-01');
});

test('board index includes initiative logs', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $initiative->logs()->create(['body' => 'Test log entry']);

    $response = $this->actingAs($user)
        ->get(route('board'));

    $response->assertSuccessful();
    $initiatives = $response->original->getData()['page']['props']['initiatives'];
    $found = collect($initiatives)->firstWhere('id', $initiative->id);
    $userLogs = collect($found['logs'])->where('type', 'user');
    expect($userLogs)->toHaveCount(1);
    expect($userLogs->first()['body'])->toBe('Test log entry');
});
