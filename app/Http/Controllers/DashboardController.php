<?php

namespace App\Http\Controllers;

use App\Models\Initiative;
use App\Models\InitiativeLog;
use App\Models\Team;
use App\Models\Todo;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $initiatives = Initiative::query()->get();

        $total = $initiatives->count();
        $inProgress = $initiatives->where('status', 'in_progress')->count();
        $upcoming = $initiatives->where('status', 'upcoming')->count();
        $done = $initiatives->where('status', 'done')->count();

        $teams = Team::query()
            ->withCount([
                'initiatives as in_progress_count' => fn ($q) => $q->where('status', 'in_progress'),
                'initiatives as upcoming_count' => fn ($q) => $q->where('status', 'upcoming'),
                'initiatives as done_count' => fn ($q) => $q->where('status', 'done'),
                'initiatives as rag_red_count' => fn ($q) => $q->where('rag_status', 'red'),
                'initiatives as rag_amber_count' => fn ($q) => $q->where('rag_status', 'amber'),
                'initiatives as rag_green_count' => fn ($q) => $q->where('rag_status', 'green'),
            ])
            ->with(['initiatives' => fn ($q) => $q->where('status', 'in_progress')->select('id', 'title', 'team_id', 'rag_status')->limit(5)])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Team $team) => [
                'id' => $team->id,
                'name' => $team->name,
                'color' => $team->color,
                'counts' => [
                    'in_progress' => $team->in_progress_count,
                    'upcoming' => $team->upcoming_count,
                    'done' => $team->done_count,
                ],
                'rag' => [
                    'red' => $team->rag_red_count,
                    'amber' => $team->rag_amber_count,
                    'green' => $team->rag_green_count,
                ],
                'inProgressInitiatives' => $team->initiatives->map(fn (Initiative $i) => [
                    'id' => $i->id,
                    'title' => $i->title,
                    'rag_status' => $i->rag_status,
                ]),
            ]);

        $unassignedInitiatives = $initiatives->whereNull('team_id');
        $unassigned = [
            'counts' => [
                'in_progress' => $unassignedInitiatives->where('status', 'in_progress')->count(),
                'upcoming' => $unassignedInitiatives->where('status', 'upcoming')->count(),
                'done' => $unassignedInitiatives->where('status', 'done')->count(),
            ],
            'inProgressInitiatives' => $unassignedInitiatives
                ->where('status', 'in_progress')
                ->take(5)
                ->map(fn (Initiative $i) => [
                    'id' => $i->id,
                    'title' => $i->title,
                ])
                ->values(),
        ];

        $recentActivity = InitiativeLog::query()
            ->with('initiative:id,title')
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn (InitiativeLog $log) => [
                'id' => $log->id,
                'body' => $log->body,
                'type' => $log->type,
                'initiative_title' => $log->initiative?->title,
                'initiative_id' => $log->initiative_id,
                'created_at' => $log->created_at,
            ]);

        $todos = Todo::query()
            ->where('user_id', auth()->id())
            ->where('is_complete', false)
            ->with(['initiative:id,title,team_id', 'initiative.team:id,name,board_id'])
            ->orderBy('deadline')
            ->get()
            ->map(fn (Todo $todo) => [
                'id' => $todo->id,
                'initiative_id' => $todo->initiative_id,
                'body' => $todo->body,
                'deadline' => $todo->deadline->toDateString(),
                'is_complete' => $todo->is_complete,
                'source' => $todo->source,
                'initiative_title' => $todo->initiative?->title,
                'team_name' => $todo->initiative?->team?->name,
                'board_id' => $todo->initiative?->team?->board_id,
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'total' => $total,
                'inProgress' => $inProgress,
                'upcoming' => $upcoming,
                'done' => $done,
            ],
            'teams' => $teams,
            'unassigned' => $unassigned,
            'recentActivity' => $recentActivity,
            'todos' => $todos,
        ]);
    }
}
