<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveInitiativeRequest;
use App\Http\Requests\StoreInitiativeRequest;
use App\Http\Requests\UpdateInitiativeRequest;
use App\Models\Initiative;
use App\Models\TodoRule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;

class InitiativeController extends Controller
{
    public function store(StoreInitiativeRequest $request): RedirectResponse
    {
        Initiative::query()->create($request->validated());

        return back();
    }

    public function update(UpdateInitiativeRequest $request, Initiative $initiative): RedirectResponse
    {
        $oldRagStatus = $initiative->rag_status;
        $oldStatus = $initiative->status;
        $newRagStatus = $request->validated('rag_status');
        $newStatus = $request->validated('status') ?? $initiative->status;

        // Clear assignee if team changed
        $newTeamId = $request->validated('team_id');
        $data = $request->validated();
        if ($newTeamId !== $initiative->team_id) {
            $data['team_member_id'] = null;
        }

        $initiative->update($data);

        // Log RAG status change
        if ($oldRagStatus !== $newRagStatus) {
            $oldLabel = $oldRagStatus ? ucfirst($oldRagStatus) : 'None';
            $newLabel = $newRagStatus ? ucfirst($newRagStatus) : 'None';
            $initiative->logs()->create([
                'body' => "RAG status changed from {$oldLabel} to {$newLabel}",
                'type' => 'system',
            ]);
        }

        $suggestions = $this->matchRules($initiative, $oldRagStatus, $newRagStatus, $oldStatus, $newStatus);

        if (! empty($suggestions)) {
            return back()->with('todo_suggestions', $suggestions);
        }

        return back();
    }

    public function move(MoveInitiativeRequest $request, Initiative $initiative): RedirectResponse
    {
        $oldStatus = $initiative->status;
        $data = array_filter($request->validated(), fn ($value) => $value !== null);

        if (array_key_exists('team_id', $request->validated())) {
            $data['team_id'] = $request->validated('team_id');

            // Clear assignee when moving to a different team
            if ($request->validated('team_id') !== $initiative->team_id) {
                $data['team_member_id'] = null;
            }
        }

        $initiative->update($data);

        $newStatus = $initiative->status;
        $suggestions = $this->matchRules($initiative, null, null, $oldStatus, $newStatus);

        if (! empty($suggestions)) {
            return back()->with('todo_suggestions', $suggestions);
        }

        return back();
    }

    public function destroy(Initiative $initiative): RedirectResponse
    {
        $initiative->dependencies()->detach();
        $initiative->dependents()->detach();
        $initiative->delete();

        return back();
    }

    /**
     * @return list<array{rule_id: string, initiative_id: string, initiative_title: string, body: string, deadline: string, source: string}>
     */
    private function matchRules(Initiative $initiative, ?string $oldRag, ?string $newRag, ?string $oldStatus, ?string $newStatus): array
    {
        $rules = TodoRule::query()
            ->where('user_id', auth()->id())
            ->where('is_active', true)
            ->get();

        $suggestions = [];
        $today = Carbon::today('Australia/Melbourne');

        foreach ($rules as $rule) {
            $matched = false;

            if ($rule->trigger_type === 'rag_status_changed' && $oldRag !== $newRag) {
                $fromMatch = $rule->trigger_from === null || $rule->trigger_from === $oldRag;
                $toMatch = $rule->trigger_to === $newRag;
                $matched = $fromMatch && $toMatch;
            }

            if ($rule->trigger_type === 'status_changed' && $oldStatus !== $newStatus) {
                $fromMatch = $rule->trigger_from === null || $rule->trigger_from === $oldStatus;
                $toMatch = $rule->trigger_to === $newStatus;
                $matched = $fromMatch && $toMatch;
            }

            if ($matched) {
                $body = str_replace('{title}', $initiative->title, $rule->suggested_body);
                $suggestions[] = [
                    'rule_id' => $rule->id,
                    'initiative_id' => $initiative->id,
                    'initiative_title' => $initiative->title,
                    'body' => $body,
                    'deadline' => $today->copy()->addDays($rule->suggested_deadline_days)->toDateString(),
                    'source' => $rule->trigger_type,
                ];
            }
        }

        return $suggestions;
    }
}
