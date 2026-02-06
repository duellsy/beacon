<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInitiativeLogRequest;
use App\Models\Initiative;
use Illuminate\Http\RedirectResponse;

class InitiativeLogController extends Controller
{
    public function store(StoreInitiativeLogRequest $request, Initiative $initiative): RedirectResponse
    {
        $initiative->logs()->create($request->validated());

        return to_route('board');
    }
}
