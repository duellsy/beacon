<?php

namespace App\Http\Controllers;

use App\Models\Initiative;
use App\Models\Todo;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $inProgressInitiatives = Initiative::query()
            ->where('status', 'in_progress')
            ->with(['team:id,name,color,board_id', 'team.board:id,name', 'todos'])
            ->get()
            ->sortBy([
                fn (Initiative $a, Initiative $b) => $b->expected_date <=> $a->expected_date,
                fn (Initiative $a, Initiative $b) => ($a->team?->name ?? '') <=> ($b->team?->name ?? ''),
            ])
            ->values()
            ->map(fn (Initiative $i) => [
                'id' => $i->id,
                'title' => $i->title,
                'team_name' => $i->team?->name,
                'team_color' => $i->team?->color,
                'board_id' => $i->team?->board_id,
                'board_name' => $i->team?->board?->name,
                'todo_count' => $i->todos->count(),
                'incomplete_todo_count' => $i->todos->where('is_complete', false)->count(),
                'rag_status' => $i->rag_status,
                'expected_date' => $i->expected_date?->toDateString(),
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
            'inProgressInitiatives' => $inProgressInitiatives,
            'todos' => $todos,
        ]);
    }
}
