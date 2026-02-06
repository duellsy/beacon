<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\DependencyController;
use App\Http\Controllers\InitiativeController;
use App\Http\Controllers\InitiativeLogController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('board', [BoardController::class, 'index'])->name('board');
    Route::get('board/export', [BoardController::class, 'export'])->name('board.export');
    Route::post('board/import', [BoardController::class, 'import'])->name('board.import');

    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::put('projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    Route::post('teams', [TeamController::class, 'store'])->name('teams.store');
    Route::put('teams/{team}', [TeamController::class, 'update'])->name('teams.update');
    Route::delete('teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');

    Route::post('initiatives', [InitiativeController::class, 'store'])->name('initiatives.store');
    Route::put('initiatives/{initiative}', [InitiativeController::class, 'update'])->name('initiatives.update');
    Route::patch('initiatives/{initiative}/move', [InitiativeController::class, 'move'])->name('initiatives.move');
    Route::delete('initiatives/{initiative}', [InitiativeController::class, 'destroy'])->name('initiatives.destroy');

    Route::post('initiatives/{initiative}/dependencies', [DependencyController::class, 'store'])->name('dependencies.store');
    Route::delete('initiatives/{initiative}/dependencies/{dependency}', [DependencyController::class, 'destroy'])->name('dependencies.destroy');

    Route::post('initiatives/{initiative}/logs', [InitiativeLogController::class, 'store'])->name('initiative-logs.store');
    Route::put('initiatives/{initiative}/logs/{log}', [InitiativeLogController::class, 'update'])->name('initiative-logs.update');
    Route::delete('initiatives/{initiative}/logs/{log}', [InitiativeLogController::class, 'destroy'])->name('initiative-logs.destroy');
});

require __DIR__.'/settings.php';
