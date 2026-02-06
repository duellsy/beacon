<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportBoardRequest;
use App\Models\Initiative;
use App\Models\Project;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BoardController extends Controller
{
    public function index(Request $request): Response
    {
        $teams = Team::query()->orderBy('name')->get();
        $projects = Project::query()->orderBy('name')->get();

        $projectFilter = $request->query('project');

        $initiativesQuery = Initiative::query()
            ->with(['dependencies:id,title,team_id,status', 'team:id,name', 'project:id,name', 'logs' => fn ($q) => $q->orderByDesc('created_at')]);

        if ($projectFilter) {
            $initiativesQuery->where('project_id', $projectFilter);
        }

        $initiatives = $initiativesQuery
            ->get()
            ->map(fn (Initiative $initiative) => [
                ...$initiative->toArray(),
                'is_blocked' => $initiative->isBlocked(),
            ]);

        return Inertia::render('board', [
            'teams' => $teams,
            'initiatives' => $initiatives,
            'projects' => $projects,
            'currentProjectId' => $projectFilter,
        ]);
    }

    public function export(): JsonResponse
    {
        $teams = Team::query()->orderBy('name')->get();
        $projects = Project::query()->orderBy('name')->get();

        $initiatives = Initiative::query()
            ->with('dependencies:id')
            ->get()
            ->map(fn (Initiative $initiative) => [
                'id' => $initiative->id,
                'title' => $initiative->title,
                'description' => $initiative->description,
                'jira_url' => $initiative->jira_url,
                'team_id' => $initiative->team_id,
                'project_id' => $initiative->project_id,
                'status' => $initiative->status,
                'engineer_owner' => $initiative->engineer_owner,
                'expected_date' => $initiative->expected_date?->toDateString(),
                'dependencies' => $initiative->dependencies->pluck('id')->values(),
                'created_at' => $initiative->created_at,
                'updated_at' => $initiative->updated_at,
            ]);

        return response()->json([
            'teams' => $teams,
            'projects' => $projects,
            'initiatives' => $initiatives,
        ]);
    }

    public function import(ImportBoardRequest $request): RedirectResponse
    {
        /** @var array{teams: array<int, array<string, mixed>>, projects: array<int, array<string, mixed>>, initiatives: array<int, array<string, mixed>>} $validated */
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            DB::table('initiative_dependencies')->delete();
            Initiative::query()->delete();
            Team::query()->delete();
            Project::query()->delete();

            $teamIds = collect($validated['teams'])->pluck('id')->all();

            foreach ($validated['teams'] as $teamData) {
                $team = new Team;
                $team->id = $teamData['id'];
                $team->name = $teamData['name'];
                $team->delivery_lead = $teamData['delivery_lead'];
                $team->product_owner = $teamData['product_owner'];
                $team->color = $teamData['color'] ?? 'blue';
                $team->save();
            }

            $projectIds = collect($validated['projects'] ?? [])->pluck('id')->all();

            foreach ($validated['projects'] ?? [] as $projectData) {
                $project = new Project;
                $project->id = $projectData['id'];
                $project->name = $projectData['name'];
                $project->save();
            }

            $initiativeIds = collect($validated['initiatives'])->pluck('id')->all();

            foreach ($validated['initiatives'] as $initiativeData) {
                $teamId = $initiativeData['team_id'] ?? null;
                if ($teamId !== null && ! in_array($teamId, $teamIds)) {
                    $teamId = null;
                }

                $projectId = $initiativeData['project_id'] ?? null;
                if ($projectId !== null && ! in_array($projectId, $projectIds)) {
                    $projectId = null;
                }

                $initiative = new Initiative;
                $initiative->id = $initiativeData['id'];
                $initiative->title = $initiativeData['title'];
                $initiative->description = $initiativeData['description'] ?? null;
                $initiative->jira_url = $initiativeData['jira_url'] ?? null;
                $initiative->team_id = $teamId;
                $initiative->project_id = $projectId;
                $initiative->status = $initiativeData['status'];
                $initiative->engineer_owner = $initiativeData['engineer_owner'] ?? null;
                $initiative->expected_date = $initiativeData['expected_date'] ?? null;
                $initiative->save();
            }

            foreach ($validated['initiatives'] as $initiativeData) {
                $deps = $initiativeData['dependencies'] ?? [];
                $validDeps = array_filter($deps, fn ($depId) => in_array($depId, $initiativeIds) && $depId !== $initiativeData['id']);

                if (! empty($validDeps)) {
                    $initiative = Initiative::query()->find($initiativeData['id']);
                    $initiative?->dependencies()->sync($validDeps);
                }
            }
        });

        return to_route('board');
    }
}
