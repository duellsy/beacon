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

        return to_route('board');
    }

    public function update(UpdateInitiativeRequest $request, Initiative $initiative): RedirectResponse
    {
        $initiative->update($request->validated());

        return to_route('board');
    }

    public function move(MoveInitiativeRequest $request, Initiative $initiative): RedirectResponse
    {
        $data = array_filter($request->validated(), fn ($value) => $value !== null);

        if (array_key_exists('team_id', $request->validated())) {
            $data['team_id'] = $request->validated('team_id');
        }

        $initiative->update($data);

        return to_route('board');
    }

    public function destroy(Initiative $initiative): RedirectResponse
    {
        $initiative->dependencies()->detach();
        $initiative->dependents()->detach();
        $initiative->delete();

        return to_route('board');
    }
}
