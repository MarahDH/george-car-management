<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = ['name', 'phone', 'notes'];

    /**
     * @return HasMany<PartItem, $this>
     */
    public function partItems(): HasMany
    {
        return $this->hasMany(PartItem::class);
    }
}
