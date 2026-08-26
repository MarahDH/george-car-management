<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'customer_id' => $this->customer_id,
            'amount' => (float) $this->amount,
            'method' => $this->method,
            'date' => $this->date?->toDateString(),
            'note' => $this->note,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'whatsapp_number' => $this->customer->whatsapp_number,
            ]),
        ];
    }
}
