<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTodoRuleRequest;
use App\Http\Requests\UpdateTodoRuleRequest;
use App\Models\TodoRule;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TodoRuleController extends Controller
{
    public function index(): Response
    {
        $rules = TodoRule::query()
            ->where('user_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('todo-rules', [
            'rules' => $rules,
        ]);
    }

    public function store(StoreTodoRuleRequest $request): RedirectResponse
    {
        TodoRule::query()->create([
            ...$request->validated(),
            'user_id' => auth()->id(),
        ]);

        return back();
    }

    public function update(UpdateTodoRuleRequest $request, TodoRule $todoRule): RedirectResponse
    {
        if ($todoRule->user_id !== auth()->id()) {
            abort(403);
        }

        $todoRule->update($request->validated());

        return back();
    }

    public function destroy(TodoRule $todoRule): RedirectResponse
    {
        if ($todoRule->user_id !== auth()->id()) {
            abort(403);
        }

        $todoRule->delete();

        return back();
    }
}
