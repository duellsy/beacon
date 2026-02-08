<?php

use App\Models\Board;
use App\Models\Initiative;
use App\Models\Team;
use App\Models\TodoRule;
use App\Models\User;

test('todo rules index page renders', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('todo-rules.index'))
        ->assertOk();
});

test('a todo rule can be created', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('todo-rules.store'), [
            'trigger_type' => 'rag_status_changed',
            'trigger_from' => null,
            'trigger_to' => 'red',
            'suggested_body' => 'Address red RAG on {title}',
            'suggested_deadline_days' => 3,
        ])
        ->assertRedirect();

    expect(TodoRule::count())->toBe(1);
    $rule = TodoRule::first();
    expect($rule->trigger_type)->toBe('rag_status_changed');
    expect($rule->trigger_to)->toBe('red');
    expect($rule->user_id)->toBe($user->id);
    expect($rule->is_active)->toBeTrue();
});

test('a todo rule can be updated', function () {
    $user = User::factory()->create();
    $rule = TodoRule::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put(route('todo-rules.update', $rule), [
            'trigger_type' => 'status_changed',
            'trigger_from' => 'in_progress',
            'trigger_to' => 'done',
            'suggested_body' => 'Create changelog for {title}',
            'suggested_deadline_days' => 5,
            'is_active' => true,
        ])
        ->assertRedirect();

    $rule->refresh();
    expect($rule->trigger_type)->toBe('status_changed');
    expect($rule->trigger_to)->toBe('done');
    expect($rule->suggested_deadline_days)->toBe(5);
});

test('a todo rule can be deleted', function () {
    $user = User::factory()->create();
    $rule = TodoRule::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('todo-rules.destroy', $rule))
        ->assertRedirect();

    expect(TodoRule::count())->toBe(0);
});

test('cannot update another users todo rule', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $rule = TodoRule::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->put(route('todo-rules.update', $rule), [
            'trigger_type' => 'rag_status_changed',
            'trigger_from' => null,
            'trigger_to' => 'red',
            'suggested_body' => 'test',
            'suggested_deadline_days' => 1,
        ])
        ->assertForbidden();
});

test('cannot delete another users todo rule', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $rule = TodoRule::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->delete(route('todo-rules.destroy', $rule))
        ->assertForbidden();
});

test('rag status change triggers matching rule suggestion', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);

    TodoRule::factory()->create([
        'user_id' => $user->id,
        'trigger_type' => 'rag_status_changed',
        'trigger_from' => null,
        'trigger_to' => 'red',
        'suggested_body' => 'Fix {title} RAG',
        'suggested_deadline_days' => 3,
    ]);

    $initiative = Initiative::factory()->create([
        'team_id' => $team->id,
        'status' => 'in_progress',
        'rag_status' => 'green',
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'rag_status' => 'red',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    $suggestions = session('todo_suggestions');
    expect($suggestions)->toHaveCount(1);
    expect($suggestions[0]['body'])->toContain($initiative->title);
    expect($suggestions[0]['source'])->toBe('rag_status_changed');
});

test('status change via move triggers matching rule suggestion', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);

    TodoRule::factory()->statusChanged()->create([
        'user_id' => $user->id,
    ]);

    $initiative = Initiative::factory()->create([
        'team_id' => $team->id,
        'status' => 'in_progress',
    ]);

    $response = $this->actingAs($user)
        ->patch(route('initiatives.move', $initiative), [
            'status' => 'done',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    $suggestions = session('todo_suggestions');
    expect($suggestions)->toHaveCount(1);
    expect($suggestions[0]['source'])->toBe('status_changed');
});

test('inactive rules do not trigger suggestions', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);

    TodoRule::factory()->inactive()->create([
        'user_id' => $user->id,
        'trigger_to' => 'red',
    ]);

    $initiative = Initiative::factory()->create([
        'team_id' => $team->id,
        'status' => 'in_progress',
        'rag_status' => 'green',
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'rag_status' => 'red',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

test('no suggestion when trigger_from does not match', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create();
    $team = Team::factory()->create(['board_id' => $board->id]);

    TodoRule::factory()->create([
        'user_id' => $user->id,
        'trigger_from' => 'amber',
        'trigger_to' => 'red',
    ]);

    $initiative = Initiative::factory()->create([
        'team_id' => $team->id,
        'status' => 'in_progress',
        'rag_status' => 'green',
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'rag_status' => 'red',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});
