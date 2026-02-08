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
        $oldExpectedDate = $initiative->expected_date?->toDateString();
        $newRagStatus = $request->validated('rag_status');
        $newStatus = $request->validated('status') ?? $initiative->status;
        $newExpectedDate = $request->validated('expected_date');

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

        $suggestions = $this->matchRules($initiative, [
            'old_rag' => $oldRagStatus,
            'new_rag' => $newRagStatus,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'old_expected_date' => $oldExpectedDate,
            'new_expected_date' => $newExpectedDate,
        ]);

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
        $suggestions = $this->matchRules($initiative, [
            'old_rag' => null,
            'new_rag' => null,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'old_expected_date' => null,
            'new_expected_date' => null,
        ]);

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
     * @param  array{old_rag: ?string, new_rag: ?string, old_status: ?string, new_status: ?string, old_expected_date: ?string, new_expected_date: ?string}  $context
     * @return list<array{rule_id: string, initiative_id: string, initiative_title: string, body: string, deadline: string, source: string}>
     */
    private function matchRules(Initiative $initiative, array $context): array
    {
        $rules = TodoRule::query()
            ->where('user_id', auth()->id())
            ->where('is_active', true)
            ->get();

        $suggestions = [];
        $today = Carbon::today('Australia/Melbourne');

        foreach ($rules as $rule) {
            $matched = match ($rule->trigger_type) {
                'rag_status_changed' => $this->matchRagStatusChanged($rule, $context),
                'status_changed' => $this->matchStatusChanged($rule, $context),
                'deadline_changed' => $this->matchDeadlineChanged($context),
                'deadline_overdue' => $this->matchDeadlineOverdue($initiative),
                'deadline_missing' => $this->matchDeadlineMissing($initiative, $context),
                'no_rag_set' => $this->matchNoRagSet($initiative, $context),
                'status_changed_notify_dependents' => $this->matchStatusChangedNotifyDependents($initiative, $context),
                'moved_to_done' => $this->matchMovedToDone($context),
                default => false,
            };

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

    /**
     * @param  array{old_rag: ?string, new_rag: ?string}  $context
     */
    private function matchRagStatusChanged(TodoRule $rule, array $context): bool
    {
        if ($context['old_rag'] === $context['new_rag']) {
            return false;
        }

        $fromMatch = $rule->trigger_from === null || $rule->trigger_from === $context['old_rag'];
        $toMatch = $rule->trigger_to === $context['new_rag'];

        return $fromMatch && $toMatch;
    }

    /**
     * @param  array{old_status: ?string, new_status: ?string}  $context
     */
    private function matchStatusChanged(TodoRule $rule, array $context): bool
    {
        if ($context['old_status'] === $context['new_status']) {
            return false;
        }

        $fromMatch = $rule->trigger_from === null || $rule->trigger_from === $context['old_status'];
        $toMatch = $rule->trigger_to === $context['new_status'];

        return $fromMatch && $toMatch;
    }

    /**
     * @param  array{old_expected_date: ?string, new_expected_date: ?string}  $context
     */
    private function matchDeadlineChanged(array $context): bool
    {
        return $context['old_expected_date'] !== null
            && $context['new_expected_date'] !== null
            && $context['old_expected_date'] !== $context['new_expected_date'];
    }

    private function matchDeadlineOverdue(Initiative $initiative): bool
    {
        return $initiative->status !== 'done'
            && $initiative->expected_date !== null
            && $initiative->expected_date->isPast();
    }

    /**
     * @param  array{old_status: ?string, new_status: ?string}  $context
     */
    private function matchDeadlineMissing(Initiative $initiative, array $context): bool
    {
        return $context['old_status'] !== $context['new_status']
            && $context['new_status'] === 'in_progress'
            && $initiative->expected_date === null;
    }

    /**
     * @param  array{old_status: ?string, new_status: ?string}  $context
     */
    private function matchNoRagSet(Initiative $initiative, array $context): bool
    {
        return $context['old_status'] !== $context['new_status']
            && $context['new_status'] === 'in_progress'
            && $initiative->rag_status === null;
    }

    /**
     * @param  array{old_status: ?string, new_status: ?string}  $context
     */
    private function matchStatusChangedNotifyDependents(Initiative $initiative, array $context): bool
    {
        if ($context['old_status'] === $context['new_status']) {
            return false;
        }

        return $initiative->dependents()->exists();
    }

    /**
     * @param  array{old_status: ?string, new_status: ?string}  $context
     */
    private function matchMovedToDone(array $context): bool
    {
        return $context['old_status'] !== 'done'
            && $context['new_status'] === 'done';
    }
}
