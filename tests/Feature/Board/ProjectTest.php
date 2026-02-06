<?php

use App\Models\Initiative;
use App\Models\Project;
use App\Models\User;

test('a project can be created', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), [
            'name' => 'Q2 Roadmap',
        ])
        ->assertRedirect(route('board'));

    expect(Project::count())->toBe(1);
    expect(Project::first()->name)->toBe('Q2 Roadmap');
});

test('project creation requires a name', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), [])
        ->assertSessionHasErrors(['name']);
});

test('a project can be updated', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['name' => 'Old Name']);

    $this->actingAs($user)
        ->put(route('projects.update', $project), [
            'name' => 'New Name',
        ])
        ->assertRedirect(route('board'));

    expect($project->refresh()->name)->toBe('New Name');
});

test('deleting a project nullifies initiative project_id', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $initiative = Initiative::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->delete(route('projects.destroy', $project))
        ->assertRedirect(route('board'));

    expect(Project::count())->toBe(0);
    expect($initiative->refresh()->project_id)->toBeNull();
});

test('guests cannot create projects', function () {
    $this->post(route('projects.store'), [
        'name' => 'Test',
    ])->assertRedirect(route('login'));
});

test('board filters initiatives by project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    Initiative::factory()->create(['title' => 'In Project', 'project_id' => $project->id]);
    Initiative::factory()->create(['title' => 'No Project', 'project_id' => null]);

    $response = $this->actingAs($user)
        ->get(route('board', ['project' => $project->id]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('board')
        ->has('initiatives', 1)
        ->where('initiatives.0.title', 'In Project')
        ->has('projects')
        ->where('currentProjectId', $project->id)
    );
});

test('board returns all initiatives without project filter', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    Initiative::factory()->create(['project_id' => $project->id]);
    Initiative::factory()->create(['project_id' => null]);

    $response = $this->actingAs($user)->get(route('board'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('board')
        ->has('initiatives', 2)
        ->has('projects', 1)
    );
});

test('board export includes projects and project_id on initiatives', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    Initiative::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)->get(route('board.export'));

    $response->assertOk();
    $response->assertJsonStructure([
        'teams',
        'projects' => [['id', 'name']],
        'initiatives' => [['id', 'title', 'project_id']],
    ]);
    $response->assertJsonPath('initiatives.0.project_id', $project->id);
});

test('board import handles projects', function () {
    $user = User::factory()->create();

    $importData = [
        'teams' => [],
        'projects' => [
            [
                'id' => 'proj-1',
                'name' => 'Imported Project',
            ],
        ],
        'initiatives' => [
            [
                'id' => 'init-1',
                'title' => 'Initiative A',
                'description' => null,
                'jira_url' => null,
                'team_id' => null,
                'project_id' => 'proj-1',
                'status' => 'upcoming',
                'engineer_owner' => null,
                'dependencies' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    expect(Project::count())->toBe(1);
    expect(Project::first()->name)->toBe('Imported Project');
    expect(Initiative::first()->project_id)->toBe('proj-1');
});

test('board import handles invalid project references gracefully', function () {
    $user = User::factory()->create();

    $importData = [
        'teams' => [],
        'projects' => [],
        'initiatives' => [
            [
                'id' => 'init-1',
                'title' => 'Initiative A',
                'description' => null,
                'jira_url' => null,
                'team_id' => null,
                'project_id' => 'nonexistent-project',
                'status' => 'upcoming',
                'engineer_owner' => null,
                'dependencies' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('board.import'), $importData)
        ->assertRedirect(route('board'));

    expect(Initiative::first()->project_id)->toBeNull();
});
