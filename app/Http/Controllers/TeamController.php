<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderTeamsRequest;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Models\Initiative;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;

class TeamController extends Controller
{
    public function reorder(ReorderTeamsRequest $request): RedirectResponse
    {
        /** @var string[] $ids */
        $ids = $request->validated('ids');

        foreach ($ids as $index => $id) {
            Team::query()->where('id', $id)->update(['sort_order' => $index]);
        }

        return back();
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $maxSortOrder = Team::query()->max('sort_order') ?? -1;

        Team::query()->create([
            ...$request->validated(),
            'sort_order' => $maxSortOrder + 1,
        ]);

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
