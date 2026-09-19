<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PartItem
 */
class PartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->whenLoaded('supplier', fn () => $this->supplier?->name),
            'worker_id' => $this->worker_id,
            'worker_name' => $this->whenLoaded('worker', fn () => $this->worker?->name),
            'name' => $this->name,
            'buy_price' => (float) $this->buy_price,
            'sell_price' => (float) $this->sell_price,
            'price_usd' => $this->price_usd !== null ? (float) $this->price_usd : null,
            'quantity' => $this->quantity,
            'line_total' => round((float) $this->sell_price * $this->quantity, 2),
        ];
    }
}
