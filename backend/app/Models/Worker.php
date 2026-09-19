<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Worker extends Model
{
    protected $fillable = ['name', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    /**
     * @return HasMany<LaborItem, $this>
     */
    public function laborItems(): HasMany
    {
        return $this->hasMany(LaborItem::class);
    }

    /**
     * @return HasMany<PartItem, $this>
     */
    public function partItems(): HasMany
    {
        return $this->hasMany(PartItem::class);
    }
}
