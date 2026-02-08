<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDependencyRequest;
use App\Models\Initiative;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class DependencyController extends Controller
{
    public function store(StoreDependencyRequest $request, Initiative $initiative): RedirectResponse
    {
        $dependencyId = $request->validated('dependency_id');

        if ($dependencyId === $initiative->id) {
            throw ValidationException::withMessages([
                'dependency_id' => 'An initiative cannot depend on itself.',
            ]);
        }

        if ($initiative->dependencies()->where('dependency_id', $dependencyId)->exists()) {
            throw ValidationException::withMessages([
                'dependency_id' => 'This dependency already exists.',
            ]);
        }

        if ($this->wouldCreateCycle($initiative->id, $dependencyId)) {
            throw ValidationException::withMessages([
                'dependency_id' => 'Adding this dependency would create a circular dependency.',
            ]);
        }

        $dependency = Initiative::findOrFail($dependencyId);

        $initiative->dependencies()->attach($dependencyId);

        $initiative->logs()->create([
            'body' => sprintf('Dependency added: %s', $dependency->title),
            'type' => 'system',
        ]);

        return back();
    }

    public function destroy(Initiative $initiative, Initiative $dependency): RedirectResponse
    {
        $initiative->dependencies()->detach($dependency->id);

        $initiative->logs()->create([
            'body' => sprintf('Dependency removed: %s', $dependency->title),
            'type' => 'system',
        ]);

        return back();
    }

    private function wouldCreateCycle(string $initiativeId, string $dependencyId): bool
    {
        $visited = [];
        $queue = [$initiativeId];

        while (! empty($queue)) {
            $currentId = array_shift($queue);

            if (isset($visited[$currentId])) {
                continue;
            }

            $visited[$currentId] = true;

            $dependentIds = Initiative::query()
                ->find($currentId)
                ?->dependents()
                ->pluck('initiatives.id')
                ->all() ?? [];

            foreach ($dependentIds as $depId) {
                if ($depId === $dependencyId) {
                    return true;
                }
                $queue[] = $depId;
            }
        }

        return false;
    }
}
