<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\BoardCrudController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DependencyController;
use App\Http\Controllers\InitiativeController;
use App\Http\Controllers\InitiativeLogController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\TodoRuleController;
use App\Models\Board;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    // Backwards compat redirect
    Route::get('board', function () {
        $board = Board::query()->orderBy('sort_order')->first();

        if ($board) {
            return to_route('board.show', $board);
        }

        return to_route('dashboard');
    })->name('board');

    Route::get('boards/{board}', [BoardController::class, 'index'])->name('board.show');
    Route::get('boards/{board}/export', [BoardController::class, 'export'])->name('board.export');
    Route::post('boards/{board}/import', [BoardController::class, 'import'])->name('board.import');

    Route::post('boards', [BoardCrudController::class, 'store'])->name('boards.store');
    Route::put('boards/{board}', [BoardCrudController::class, 'update'])->name('boards.update');
    Route::delete('boards/{board}', [BoardCrudController::class, 'destroy'])->name('boards.destroy');

    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::put('projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    Route::post('teams/reorder', [TeamController::class, 'reorder'])->name('teams.reorder');
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

    Route::post('initiatives/{initiative}/todos', [TodoController::class, 'store'])->name('todos.store');
    Route::put('initiatives/{initiative}/todos/{todo}', [TodoController::class, 'update'])->name('todos.update');
    Route::patch('initiatives/{initiative}/todos/{todo}/toggle', [TodoController::class, 'toggle'])->name('todos.toggle');
    Route::delete('initiatives/{initiative}/todos/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');

    Route::get('todo-rules', [TodoRuleController::class, 'index'])->name('todo-rules.index');
    Route::post('todo-rules', [TodoRuleController::class, 'store'])->name('todo-rules.store');
    Route::put('todo-rules/{todoRule}', [TodoRuleController::class, 'update'])->name('todo-rules.update');
    Route::delete('todo-rules/{todoRule}', [TodoRuleController::class, 'destroy'])->name('todo-rules.destroy');
});

require __DIR__.'/settings.php';
