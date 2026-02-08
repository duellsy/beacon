<?php

use App\Models\Initiative;
use App\Models\Todo;
use App\Models\User;

test('a todo can be created for an initiative', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('todos.store', $initiative), [
            'body' => 'Fix the bug',
            'deadline' => '2026-02-15',
        ])
        ->assertRedirect();

    expect(Todo::count())->toBe(1);
    expect(Todo::first()->body)->toBe('Fix the bug');
    expect(Todo::first()->user_id)->toBe($user->id);
    expect(Todo::first()->initiative_id)->toBe($initiative->id);
    expect(Todo::first()->source)->toBe('manual');
});

test('todo creation requires body and deadline', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('todos.store', $initiative), [])
        ->assertSessionHasErrors(['body', 'deadline']);
});

test('a todo can be updated by its owner', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $todo = Todo::factory()->create([
        'initiative_id' => $initiative->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->put(route('todos.update', [$initiative, $todo]), [
            'body' => 'Updated body',
            'deadline' => '2026-03-01',
        ])
        ->assertRedirect();

    expect($todo->fresh()->body)->toBe('Updated body');
});

test('a todo cannot be updated by another user', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $todo = Todo::factory()->create([
        'initiative_id' => $initiative->id,
        'user_id' => $owner->id,
    ]);

    $this->actingAs($other)
        ->put(route('todos.update', [$initiative, $todo]), [
            'body' => 'Hacked',
            'deadline' => '2026-03-01',
        ])
        ->assertForbidden();
});

test('a todo can be toggled', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $todo = Todo::factory()->create([
        'initiative_id' => $initiative->id,
        'user_id' => $user->id,
        'is_complete' => false,
    ]);

    $this->actingAs($user)
        ->patch(route('todos.toggle', [$initiative, $todo]))
        ->assertRedirect();

    expect($todo->fresh()->is_complete)->toBeTrue();

    $this->actingAs($user)
        ->patch(route('todos.toggle', [$initiative, $todo]))
        ->assertRedirect();

    expect($todo->fresh()->is_complete)->toBeFalse();
});

test('a todo can be deleted by its owner', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $todo = Todo::factory()->create([
        'initiative_id' => $initiative->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->delete(route('todos.destroy', [$initiative, $todo]))
        ->assertRedirect();

    expect(Todo::count())->toBe(0);
});

test('a todo cannot be deleted by another user', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $initiative = Initiative::factory()->create();
    $todo = Todo::factory()->create([
        'initiative_id' => $initiative->id,
        'user_id' => $owner->id,
    ]);

    $this->actingAs($other)
        ->delete(route('todos.destroy', [$initiative, $todo]))
        ->assertForbidden();

    expect(Todo::count())->toBe(1);
});

test('a todo can be created with a source', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('todos.store', $initiative), [
            'body' => 'Address red RAG',
            'deadline' => '2026-02-15',
            'source' => 'rag_status',
        ])
        ->assertRedirect();

    expect(Todo::first()->source)->toBe('rag_status');
});
