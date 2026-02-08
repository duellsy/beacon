<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderTeamsRequest;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Models\Initiative;
use App\Models\Team;
use App\Models\TeamMember;
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
        $boardId = $request->validated('board_id');

        $maxSortOrder = Team::query()->where('board_id', $boardId)->max('sort_order') ?? -1;

        $team = Team::query()->create([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'color' => $request->validated('color'),
            'board_id' => $boardId,
            'sort_order' => $maxSortOrder + 1,
        ]);

        $this->syncMembers($team, $request->validated('members', []));

        return back();
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $team->update([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'color' => $request->validated('color'),
        ]);

        $this->syncMembers($team, $request->validated('members', []));

        return back();
    }

    public function destroy(Team $team): RedirectResponse
    {
        Initiative::query()->where('team_id', $team->id)->update(['team_id' => null, 'team_member_id' => null]);

        $team->delete();

        return back();
    }

    /**
     * @param  array<int, array{id?: string|null, name: string, role?: string|null}>  $members
     */
    private function syncMembers(Team $team, array $members): void
    {
        $existingIds = $team->members()->pluck('id')->all();
        $incomingIds = [];

        foreach ($members as $index => $memberData) {
            if (! empty($memberData['id'])) {
                $member = TeamMember::query()->find($memberData['id']);
                if ($member && $member->team_id === $team->id) {
                    $member->update([
                        'name' => $memberData['name'],
                        'role' => $memberData['role'] ?? null,
                        'sort_order' => $index,
                    ]);
                    $incomingIds[] = $member->id;

                    continue;
                }
            }

            $newMember = $team->members()->create([
                'name' => $memberData['name'],
                'role' => $memberData['role'] ?? null,
                'sort_order' => $index,
            ]);
            $incomingIds[] = $newMember->id;
        }

        // Delete members that were removed
        $toDelete = array_diff($existingIds, $incomingIds);
        if (! empty($toDelete)) {
            // Nullify assignee references before deleting
            Initiative::query()->whereIn('team_member_id', $toDelete)->update(['team_member_id' => null]);
            TeamMember::query()->whereIn('id', $toDelete)->delete();
        }
    }
}
