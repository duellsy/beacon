<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InitiativeLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'initiative_id',
        'body',
        'type',
    ];

    /**
     * @return BelongsTo<Initiative, $this>
     */
    public function initiative(): BelongsTo
    {
        return $this->belongsTo(Initiative::class);
    }
}
