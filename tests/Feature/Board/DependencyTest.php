<?php

use App\Models\Initiative;
use App\Models\User;

test('a dependency can be added to an initiative', function () {
    $user = User::factory()->create();
    $initiativeA = Initiative::factory()->done()->create();
    $initiativeB = Initiative::factory()->upcoming()->create();

    $this->actingAs($user)
        ->post(route('dependencies.store', $initiativeB), [
            'dependency_id' => $initiativeA->id,
        ])
        ->assertRedirect();

    expect($initiativeB->refresh()->dependencies)->toHaveCount(1);
    expect($initiativeB->dependencies->first()->id)->toBe($initiativeA->id);
});

test('a dependency can be removed from an initiative', function () {
    $user = User::factory()->create();
    $initiativeA = Initiative::factory()->done()->create();
    $initiativeB = Initiative::factory()->upcoming()->create();
    $initiativeB->dependencies()->attach($initiativeA->id);

    $this->actingAs($user)
        ->delete(route('dependencies.destroy', [
            'initiative' => $initiativeB->id,
            'dependency' => $initiativeA->id,
        ]))
        ->assertRedirect();

    expect($initiativeB->refresh()->dependencies)->toHaveCount(0);
});

test('an initiative cannot depend on itself', function () {
    $user = User::factory()->create();
    $initiative = Initiative::factory()->create();

    $this->actingAs($user)
        ->post(route('dependencies.store', $initiative), [
            'dependency_id' => $initiative->id,
        ])
        ->assertSessionHasErrors(['dependency_id']);
});

test('duplicate dependencies are rejected', function () {
    $user = User::factory()->create();
    $initiativeA = Initiative::factory()->create();
    $initiativeB = Initiative::factory()->create();
    $initiativeB->dependencies()->attach($initiativeA->id);

    $this->actingAs($user)
        ->post(route('dependencies.store', $initiativeB), [
            'dependency_id' => $initiativeA->id,
        ])
        ->assertSessionHasErrors(['dependency_id']);
});

test('circular dependencies are prevented', function () {
    $user = User::factory()->create();
    $initiativeA = Initiative::factory()->create();
    $initiativeB = Initiative::factory()->create();
    $initiativeC = Initiative::factory()->create();

    // A depends on B
    $initiativeA->dependencies()->attach($initiativeB->id);
    // B depends on C
    $initiativeB->dependencies()->attach($initiativeC->id);

    // C depends on A should be rejected (cycle: A -> B -> C -> A)
    $this->actingAs($user)
        ->post(route('dependencies.store', $initiativeC), [
            'dependency_id' => $initiativeA->id,
        ])
        ->assertSessionHasErrors(['dependency_id']);
});

test('blocked status is computed correctly', function () {
    $initiativeA = Initiative::factory()->upcoming()->create();
    $initiativeB = Initiative::factory()->upcoming()->create();
    $initiativeB->dependencies()->attach($initiativeA->id);

    expect($initiativeB->isBlocked())->toBeTrue();

    $initiativeA->update(['status' => 'done']);

    expect($initiativeB->isBlocked())->toBeFalse();
});

test('initiative is not blocked when all dependencies are done', function () {
    $depA = Initiative::factory()->done()->create();
    $depB = Initiative::factory()->done()->create();
    $initiative = Initiative::factory()->upcoming()->create();
    $initiative->dependencies()->attach([$depA->id, $depB->id]);

    expect($initiative->isBlocked())->toBeFalse();
});

test('initiative is blocked when any dependency is not done', function () {
    $depA = Initiative::factory()->done()->create();
    $depB = Initiative::factory()->inProgress()->create();
    $initiative = Initiative::factory()->upcoming()->create();
    $initiative->dependencies()->attach([$depA->id, $depB->id]);

    expect($initiative->isBlocked())->toBeTrue();
});
