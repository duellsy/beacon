<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoardRequest;
use App\Http\Requests\UpdateBoardRequest;
use App\Models\Board;
use Illuminate\Http\RedirectResponse;

class BoardCrudController extends Controller
{
    public function store(StoreBoardRequest $request): RedirectResponse
    {
        $maxSortOrder = Board::query()->max('sort_order') ?? -1;

        $board = Board::query()->create([
            ...$request->validated(),
            'sort_order' => $maxSortOrder + 1,
        ]);

        return to_route('board.show', $board);
    }

    public function update(UpdateBoardRequest $request, Board $board): RedirectResponse
    {
        $board->update($request->validated());

        return to_route('board.show', $board);
    }

    public function destroy(Board $board): RedirectResponse
    {
        $board->delete();

        $nextBoard = Board::query()->orderBy('sort_order')->first();

        if ($nextBoard) {
            return to_route('board.show', $nextBoard);
        }

        return to_route('dashboard');
    }
}
