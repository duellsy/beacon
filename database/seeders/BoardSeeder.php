<?php

namespace Database\Seeders;

use App\Models\Board;
use Illuminate\Database\Seeder;

class BoardSeeder extends Seeder
{
    public function run(): void
    {
        Board::factory()->create([
            'name' => 'Default Board',
            'sort_order' => 0,
        ]);
    }
}
