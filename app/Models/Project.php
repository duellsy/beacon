<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
    ];

    /**
     * @return HasMany<Initiative, $this>
     */
    public function initiatives(): HasMany
    {
        return $this->hasMany(Initiative::class);
    }
}
