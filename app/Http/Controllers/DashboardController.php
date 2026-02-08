<?php

namespace App\Http\Controllers;

use App\Models\Initiative;
use App\Models\InitiativeLog;
use App\Models\Team;
use App\Models\Todo;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * @param  \Illuminate\Support\Collection<int, Initiative>  $initiatives
     * @return list<array{initiative_id: string, initiative_title: string, body: string, source: string, deadline: string}>
     */
    private function computeSuggestions($initiatives): array
    {
        $userId = auth()->id();
        $existingTodoSources = Todo::query()
            ->where('user_id', $userId)
            ->where('is_complete', false)
            ->get(['initiative_id', 'source'])
            ->groupBy('initiative_id')
            ->map(fn ($todos) => $todos->pluck('source')->unique()->values());

        $suggestions = [];
        $today = Carbon::today();

        foreach ($initiatives->where('status', 'in_progress') as $initiative) {
            $sources = $existingTodoSources->get($initiative->id, collect());

            if (in_array($initiative->rag_status, ['red', 'amber']) && ! $sources->contains('rag_status')) {
                $suggestions[] = [
                    'initiative_id' => $initiative->id,
                    'initiative_title' => $initiative->title,
                    'body' => "Address {$initiative->rag_status} RAG status on \"{$initiative->title}\"",
                    'source' => 'rag_status',
                    'deadline' => $today->copy()->addDays(3)->toDateString(),
                ];
            }

            if ($initiative->expected_date && $initiative->expected_date->diffInDays($today, false) >= -7 && $initiative->expected_date->gte($today) && ! $sources->contains('deadline_approaching')) {
                $suggestions[] = [
                    'initiative_id' => $initiative->id,
                    'initiative_title' => $initiative->title,
                    'body' => "Deadline approaching for \"{$initiative->title}\" ({$initiative->expected_date->toDateString()})",
                    'source' => 'deadline_approaching',
                    'deadline' => $initiative->expected_date->toDateString(),
                ];
            }
        }

        // Check for blocking other teams
        $initiativesWithDependents = Initiative::query()
            ->whereIn('id', $initiatives->where('status', '!=', 'done')->pluck('id'))
            ->whereHas('dependents', fn ($q) => $q->where('status', '!=', 'done'))
            ->with('dependents:id,title,team_id')
            ->get();

        foreach ($initiativesWithDependents as $initiative) {
            $sources = $existingTodoSources->get($initiative->id, collect());
            if (! $sources->contains('blocking')) {
                $blockedTitles = $initiative->dependents->pluck('title')->take(2)->join(', ');
                $suggestions[] = [
                    'initiative_id' => $initiative->id,
                    'initiative_title' => $initiative->title,
                    'body' => "\"{$initiative->title}\" is blocking: {$blockedTitles}",
                    'source' => 'blocking',
                    'deadline' => $today->copy()->addDays(3)->toDateString(),
                ];
            }
        }

        return $suggestions;
    }

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

        $suggestions = $this->computeSuggestions($initiatives);

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
            'suggestions' => $suggestions,
        ]);
    }
}
