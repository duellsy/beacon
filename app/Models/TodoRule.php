<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TodoRule extends Model
{
    /** @use HasFactory<\Database\Factories\TodoRuleFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'trigger_type',
        'trigger_from',
        'trigger_to',
        'suggested_body',
        'suggested_deadline_days',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'suggested_deadline_days' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
