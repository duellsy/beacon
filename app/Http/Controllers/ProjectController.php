<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Initiative;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;

class ProjectController extends Controller
{
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Project::query()->create($request->validated());

        return to_route('board');
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $project->update($request->validated());

        return to_route('board');
    }

    public function destroy(Project $project): RedirectResponse
    {
        Initiative::query()->where('project_id', $project->id)->update(['project_id' => null]);

        $project->delete();

        return to_route('board');
    }
}
