<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaborItem extends Model
{
    public const DEPARTMENTS = ['mechanic', 'electrical', 'dozan'];

    protected $fillable = ['invoice_id', 'worker_id', 'department', 'description', 'amount'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return BelongsTo<Worker, $this> */
    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }
}
