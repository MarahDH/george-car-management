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

    /**
     * @return HasMany<SupplierPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    /** Total the shop bought from this supplier (parts buy cost). */
    public function totalPurchases(): float
    {
        return round((float) $this->partItems()->selectRaw('COALESCE(SUM(buy_price * quantity), 0) as t')->value('t'), 2);
    }

    /** Total the shop paid this supplier. */
    public function totalPaid(): float
    {
        return round((float) $this->payments()->sum('amount'), 2);
    }

    /** What the shop still owes this supplier. */
    public function debt(): float
    {
        return round($this->totalPurchases() - $this->totalPaid(), 2);
    }
}
