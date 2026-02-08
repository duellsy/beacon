<?php

namespace App\Mcp\Tools;

use App\Models\Initiative;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[IsReadOnly]
#[IsIdempotent]
class GetActiveInitiativesTool extends Tool
{
    /**
     * The tool's description.
     */
    protected string $description = 'Fetches all initiatives with status "in_progress" or "upcoming", including team, project, and dependency information.';

    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response|ResponseFactory
    {
        $initiatives = Initiative::query()
            ->whereIn('status', ['in_progress', 'upcoming'])
            ->with(['team', 'project', 'dependencies', 'assignee'])
            ->get()
            ->map(function (Initiative $initiative) {
                $blockers = $initiative->dependencies
                    ->filter(fn (Initiative $dep) => $dep->status !== 'done');

                return [
                    'title' => $initiative->title,
                    'status' => $initiative->status,
                    'assignee' => $initiative->assignee?->name,
                    'rag_status' => $initiative->rag_status,
                    'jira_url' => $initiative->jira_url,
                    'description' => $initiative->description,
                    'team' => $initiative->team?->name,
                    'project' => $initiative->project?->name,
                    'is_blocked' => $blockers->isNotEmpty(),
                    'blocked_by' => $blockers->pluck('title')->values()->all(),
                    'dependencies' => $initiative->dependencies->pluck('title')->values()->all(),
                ];
            });

        $data = $initiatives->values()->all();

        if (empty($data)) {
            return Response::text('No active initiatives found.');
        }

        return Response::structured(['initiatives' => $data]);
    }
}
