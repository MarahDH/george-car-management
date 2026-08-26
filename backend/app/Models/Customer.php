<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'alt_phone',
        'address',
        'country_code',
        'notes',
    ];

    /**
     * @return HasMany<Car, $this>
     */
    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    /** @return HasMany<Invoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Outstanding debt = unpaid invoice remainders minus later receipt payments.
     */
    public function debt(): float
    {
        return round((float) $this->invoices()->sum('remaining') - (float) $this->payments()->sum('amount'), 2);
    }

    /**
     * Total money the customer has actually paid (invoice down-payments + receipts).
     */
    public function totalPaid(): float
    {
        return round((float) $this->invoices()->sum('paid_amount') + (float) $this->payments()->sum('amount'), 2);
    }

    /**
     * Full international phone (country code + number), digits only — for WhatsApp links later.
     */
    public function getWhatsappNumberAttribute(): ?string
    {
        if (! $this->phone) {
            return null;
        }

        $number = preg_replace('/\D+/', '', $this->phone);
        $number = ltrim((string) $number, '0');

        return $this->country_code . $number;
    }
}
