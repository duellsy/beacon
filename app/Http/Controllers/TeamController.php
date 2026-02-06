<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Models\Initiative;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;

class TeamController extends Controller
{
    public function store(StoreTeamRequest $request): RedirectResponse
    {
        Team::query()->create($request->validated());

        return to_route('board');
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $team->update($request->validated());

        return to_route('board');
    }

    public function destroy(Team $team): RedirectResponse
    {
        Initiative::query()->where('team_id', $team->id)->update(['team_id' => null]);

        $team->delete();

        return to_route('board');
    }
}
