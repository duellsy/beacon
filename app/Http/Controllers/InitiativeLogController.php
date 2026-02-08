<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInitiativeLogRequest;
use App\Http\Requests\UpdateInitiativeLogRequest;
use App\Models\Initiative;
use App\Models\InitiativeLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;

class InitiativeLogController extends Controller
{
    public function store(StoreInitiativeLogRequest $request, Initiative $initiative): RedirectResponse
    {
        $initiative->logs()->create([
            ...$request->validated(),
            'user_id' => auth()->id(),
        ]);

        return back();
    }

    public function update(UpdateInitiativeLogRequest $request, Initiative $initiative, InitiativeLog $log): RedirectResponse|Response
    {
        if ($log->user_id !== auth()->id()) {
            abort(403);
        }

        $log->update($request->validated());

        return back();
    }

    public function destroy(Initiative $initiative, InitiativeLog $log): RedirectResponse|Response
    {
        if ($log->user_id !== auth()->id()) {
            abort(403);
        }

        $log->delete();

        return back();
    }
}
