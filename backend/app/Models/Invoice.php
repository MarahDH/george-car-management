<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    public const STATUSES = ['inspecting', 'repairing', 'ready'];

    protected $fillable = [
        'invoice_number', 'customer_id', 'car_id', 'date', 'odometer', 'status',
        'labor_total', 'parts_total', 'cost_total', 'total',
        'paid_amount', 'payment_method', 'remaining', 'profit', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'labor_total' => 'decimal:2',
            'parts_total' => 'decimal:2',
            'cost_total' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'remaining' => 'decimal:2',
            'profit' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /** @return HasMany<LaborItem, $this> */
    public function laborItems(): HasMany
    {
        return $this->hasMany(LaborItem::class);
    }

    /** @return HasMany<PartItem, $this> */
    public function partItems(): HasMany
    {
        return $this->hasMany(PartItem::class);
    }

    /**
     * Recalculate money totals from the line items and the paid amount.
     */
    public function recalculateTotals(): void
    {
        $laborTotal = (float) $this->laborItems->sum('amount');
        $partsTotal = (float) $this->partItems->sum(fn (PartItem $p) => (float) $p->sell_price * $p->quantity);
        $costTotal = (float) $this->partItems->sum(fn (PartItem $p) => (float) $p->buy_price * $p->quantity);

        $this->labor_total = round($laborTotal, 2);
        $this->parts_total = round($partsTotal, 2);
        $this->cost_total = round($costTotal, 2);
        $this->total = round($laborTotal + $partsTotal, 2);
        $this->remaining = round($this->total - (float) $this->paid_amount, 2);
        // Net profit = everything charged minus what the parts cost us.
        $this->profit = round($this->total - $costTotal, 2);
    }
}
