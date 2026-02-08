<?php

use App\Mcp\Prompts\DayPlannerPrompt;
use App\Mcp\Servers\PlanningServer;
use App\Mcp\Tools\GetActiveInitiativesTool;
use App\Models\Board;
use App\Models\Initiative;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;

test('get active initiatives tool returns in-progress and upcoming initiatives', function () {
    $board = Board::factory()->create();
    $team = Team::factory()->create(['name' => 'Platform', 'board_id' => $board->id]);
    $member = TeamMember::factory()->create(['team_id' => $team->id, 'name' => 'Alice']);
    $project = Project::factory()->create(['name' => 'Checkout']);

    Initiative::factory()
        ->inProgress()
        ->forTeam($team)
        ->create([
            'title' => 'Build payment flow',
            'project_id' => $project->id,
            'team_member_id' => $member->id,
        ]);

    Initiative::factory()
        ->upcoming()
        ->create(['title' => 'Design onboarding']);

    Initiative::factory()
        ->done()
        ->create(['title' => 'Completed task']);

    $response = PlanningServer::tool(GetActiveInitiativesTool::class);

    $response
        ->assertOk()
        ->assertSee('Build payment flow')
        ->assertSee('Design onboarding')
        ->assertSee('Platform')
        ->assertSee('Checkout')
        ->assertSee('Alice');
});

test('get active initiatives tool excludes done initiatives', function () {
    Initiative::factory()->done()->create(['title' => 'Already done']);

    $response = PlanningServer::tool(GetActiveInitiativesTool::class);

    $response
        ->assertOk()
        ->assertSee('No active initiatives found.');
});

test('get active initiatives tool includes blocker information', function () {
    $blocker = Initiative::factory()
        ->inProgress()
        ->create(['title' => 'Blocking initiative']);

    $blocked = Initiative::factory()
        ->upcoming()
        ->create(['title' => 'Blocked initiative']);

    $blocked->dependencies()->attach($blocker);

    $response = PlanningServer::tool(GetActiveInitiativesTool::class);

    $response
        ->assertOk()
        ->assertSee('Blocked initiative')
        ->assertSee('Blocking initiative')
        ->assertSee('"is_blocked": true');
});

test('get active initiatives tool shows unblocked when dependency is done', function () {
    $doneDep = Initiative::factory()
        ->done()
        ->create(['title' => 'Done dependency']);

    $initiative = Initiative::factory()
        ->inProgress()
        ->create(['title' => 'Unblocked initiative']);

    $initiative->dependencies()->attach($doneDep);

    $response = PlanningServer::tool(GetActiveInitiativesTool::class);

    $response
        ->assertOk()
        ->assertSee('Unblocked initiative')
        ->assertSee('"is_blocked": false')
        ->assertSee('"blocked_by": []');
});

test('day planner prompt returns planning messages', function () {
    $response = PlanningServer::prompt(DayPlannerPrompt::class);

    $response
        ->assertOk()
        ->assertSee('day-planning assistant')
        ->assertSee('fetch my active initiatives');
});
