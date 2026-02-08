<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveInitiativeRequest;
use App\Http\Requests\StoreInitiativeRequest;
use App\Http\Requests\UpdateInitiativeRequest;
use App\Models\Initiative;
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
        $newRagStatus = $request->validated('rag_status');

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

        return back();
    }

    public function move(MoveInitiativeRequest $request, Initiative $initiative): RedirectResponse
    {
        $data = array_filter($request->validated(), fn ($value) => $value !== null);

        if (array_key_exists('team_id', $request->validated())) {
            $data['team_id'] = $request->validated('team_id');

            // Clear assignee when moving to a different team
            if ($request->validated('team_id') !== $initiative->team_id) {
                $data['team_member_id'] = null;
            }
        }

        $initiative->update($data);

        return back();
    }

    public function destroy(Initiative $initiative): RedirectResponse
    {
        $initiative->dependencies()->detach();
        $initiative->dependents()->detach();
        $initiative->delete();

        return back();
    }
}
