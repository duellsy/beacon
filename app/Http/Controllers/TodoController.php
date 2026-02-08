<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTodoRequest;
use App\Http\Requests\UpdateTodoRequest;
use App\Models\Initiative;
use App\Models\Todo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;

class TodoController extends Controller
{
    public function store(StoreTodoRequest $request, Initiative $initiative): RedirectResponse
    {
        $initiative->todos()->create([
            ...$request->validated(),
            'user_id' => auth()->id(),
        ]);

        return back();
    }

    public function update(UpdateTodoRequest $request, Initiative $initiative, Todo $todo): RedirectResponse|Response
    {
        if ($todo->user_id !== auth()->id()) {
            abort(403);
        }

        $todo->update($request->validated());

        return back();
    }

    public function toggle(Initiative $initiative, Todo $todo): RedirectResponse|Response
    {
        if ($todo->user_id !== auth()->id()) {
            abort(403);
        }

        $todo->update(['is_complete' => ! $todo->is_complete]);

        return back();
    }

    public function destroy(Initiative $initiative, Todo $todo): RedirectResponse|Response
    {
        if ($todo->user_id !== auth()->id()) {
            abort(403);
        }

        $todo->delete();

        return back();
    }
}
