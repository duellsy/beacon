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

// --- deadline_changed ---

test('deadline_changed triggers when expected_date is modified', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineChanged()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'expected_date' => '2026-04-01',
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'expected_date' => '2026-05-01',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    $suggestions = session('todo_suggestions');
    expect($suggestions)->toHaveCount(1);
    expect($suggestions[0]['source'])->toBe('deadline_changed');
});

test('deadline_changed does not trigger when date stays the same', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineChanged()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'expected_date' => '2026-04-01',
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'expected_date' => '2026-04-01',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

test('deadline_changed does not trigger when date is set from null', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineChanged()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'expected_date' => null,
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'expected_date' => '2026-05-01',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

// --- deadline_overdue ---

test('deadline_overdue triggers when initiative is past due and not done', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineOverdue()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'expected_date' => now()->subDay(),
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'expected_date' => $initiative->expected_date->toDateString(),
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('deadline_overdue');
});

test('deadline_overdue does not trigger when initiative is done', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineOverdue()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'expected_date' => now()->subDay(),
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'done',
            'expected_date' => $initiative->expected_date->toDateString(),
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

test('deadline_overdue does not trigger when date is in the future', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineOverdue()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create([
        'expected_date' => now()->addWeek(),
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'expected_date' => $initiative->expected_date->toDateString(),
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

// --- deadline_missing ---

test('deadline_missing triggers when moved to in_progress with no expected_date', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineMissing()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->upcoming()->create([
        'expected_date' => null,
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('deadline_missing');
});

test('deadline_missing does not trigger when expected_date is set', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->deadlineMissing()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->upcoming()->create([
        'expected_date' => '2026-06-01',
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'expected_date' => '2026-06-01',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

test('deadline_missing triggers via move to in_progress', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create(['board_id' => Board::factory()->create()->id]);

    TodoRule::factory()->deadlineMissing()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->upcoming()->create([
        'expected_date' => null,
    ]);

    $response = $this->actingAs($user)
        ->patch(route('initiatives.move', $initiative), [
            'status' => 'in_progress',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('deadline_missing');
});

// --- no_rag_set ---

test('no_rag_set triggers when moved to in_progress with no rag_status', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->noRagSet()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->upcoming()->create([
        'rag_status' => null,
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('no_rag_set');
});

test('no_rag_set does not trigger when rag_status is set', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->noRagSet()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->upcoming()->create([
        'rag_status' => null,
    ]);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
            'rag_status' => 'green',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

// --- status_changed_notify_dependents ---

test('status_changed_notify_dependents triggers when status changes and has dependents', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->statusChangedNotifyDependents()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create();
    $dependent = Initiative::factory()->forTeam($team)->create();
    $dependent->dependencies()->attach($initiative->id);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'done',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('status_changed_notify_dependents');
});

test('status_changed_notify_dependents does not trigger without dependents', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->statusChangedNotifyDependents()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create();

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'done',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

test('status_changed_notify_dependents does not trigger when status stays the same', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->statusChangedNotifyDependents()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create();
    $dependent = Initiative::factory()->forTeam($team)->create();
    $dependent->dependencies()->attach($initiative->id);

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'in_progress',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

// --- moved_to_done ---

test('moved_to_done triggers when initiative moves to done', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->movedToDone()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create();

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'done',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('moved_to_done');
});

test('moved_to_done triggers via move', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create(['board_id' => Board::factory()->create()->id]);

    TodoRule::factory()->movedToDone()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->inProgress()->create();

    $response = $this->actingAs($user)
        ->patch(route('initiatives.move', $initiative), [
            'status' => 'done',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('todo_suggestions');
    expect(session('todo_suggestions')[0]['source'])->toBe('moved_to_done');
});

test('moved_to_done does not trigger when already done', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    TodoRule::factory()->movedToDone()->create(['user_id' => $user->id]);

    $initiative = Initiative::factory()->forTeam($team)->done()->create();

    $response = $this->actingAs($user)
        ->put(route('initiatives.update', $initiative), [
            'title' => $initiative->title,
            'team_id' => $initiative->team_id,
            'status' => 'done',
        ]);

    $response->assertRedirect();
    $response->assertSessionMissing('todo_suggestions');
});

test('event-based rules can be created with null trigger_to', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('todo-rules.store'), [
            'trigger_type' => 'deadline_changed',
            'trigger_from' => null,
            'trigger_to' => null,
            'suggested_body' => 'Notify about date change on {title}',
            'suggested_deadline_days' => 2,
        ])
        ->assertRedirect();

    expect(TodoRule::count())->toBe(1);
    $rule = TodoRule::first();
    expect($rule->trigger_type)->toBe('deadline_changed');
    expect($rule->trigger_to)->toBeNull();
});
