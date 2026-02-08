<?php

use App\Models\Board;
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
        ->assertRedirect();

    $userLogs = InitiativeLog::where('type', 'user')->get();
    expect($userLogs)->toHaveCount(1);
    expect($userLogs->first()->body)->toBe('Started working on this feature.');
    expect($userLogs->first()->initiative_id)->toBe($initiative->id);
    expect($userLogs->first()->user_id)->toBe($user->id);
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
        ->assertRedirect();

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
        ->assertRedirect();

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
        ->assertRedirect();

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
        ->assertRedirect();

    expect($initiative->refresh()->expected_date->toDateString())->toBe('2026-06-01');
});

test('board index includes initiative logs', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $initiative = Initiative::factory()->create();
    $initiative->logs()->create(['body' => 'Test log entry']);

    $response = $this->actingAs($user)
        ->get(route('board.show', $board));

    $response->assertSuccessful();
    $initiatives = $response->original->getData()['page']['props']['initiatives'];
    $found = collect($initiatives)->firstWhere('id', $initiative->id);
    $userLogs = collect($found['logs'])->where('type', 'user');
    expect($userLogs)->toHaveCount(1);
    expect($userLogs->first()['body'])->toBe('Test log entry');
});

test('owner can update their log body', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $log = $initiative->logs()->create([
        'body' => 'Original body',
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->put(route('initiative-logs.update', [$initiative, $log]), [
            'body' => 'Updated body',
        ])
        ->assertRedirect();

    expect($log->refresh()->body)->toBe('Updated body');
});

test('owner can delete their log', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $log = $initiative->logs()->create([
        'body' => 'To be deleted',
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->delete(route('initiative-logs.destroy', [$initiative, $log]))
        ->assertRedirect();

    expect(InitiativeLog::find($log->id))->toBeNull();
});

test('non-owner gets 403 on update', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $log = $initiative->logs()->create([
        'body' => 'Owner log',
        'user_id' => $owner->id,
    ]);

    $this->actingAs($otherUser)
        ->put(route('initiative-logs.update', [$initiative, $log]), [
            'body' => 'Hijacked',
        ])
        ->assertForbidden();

    expect($log->refresh()->body)->toBe('Owner log');
});

test('non-owner gets 403 on delete', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $log = $initiative->logs()->create([
        'body' => 'Owner log',
        'user_id' => $owner->id,
    ]);

    $this->actingAs($otherUser)
        ->delete(route('initiative-logs.destroy', [$initiative, $log]))
        ->assertForbidden();

    expect(InitiativeLog::find($log->id))->not->toBeNull();
});

test('system logs cannot be updated', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $log = $initiative->logs()->create([
        'body' => 'System generated',
        'type' => 'system',
        'user_id' => null,
    ]);

    $this->actingAs($user)
        ->put(route('initiative-logs.update', [$initiative, $log]), [
            'body' => 'Hijacked',
        ])
        ->assertForbidden();

    expect($log->refresh()->body)->toBe('System generated');
});

test('system logs cannot be deleted', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $log = $initiative->logs()->create([
        'body' => 'System generated',
        'type' => 'system',
        'user_id' => null,
    ]);

    $this->actingAs($user)
        ->delete(route('initiative-logs.destroy', [$initiative, $log]))
        ->assertForbidden();

    expect(InitiativeLog::find($log->id))->not->toBeNull();
});
