<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Invoice
 */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'customer_id' => $this->customer_id,
            'car_id' => $this->car_id,
            'date' => $this->date?->toDateString(),
            'odometer' => $this->odometer,
            'status' => $this->status,
            'labor_total' => (float) $this->labor_total,
            'parts_total' => (float) $this->parts_total,
            'cost_total' => (float) $this->cost_total,
            'total' => (float) $this->total,
            'paid_amount' => (float) $this->paid_amount,
            'payment_method' => $this->payment_method,
            'remaining' => (float) $this->remaining,
            'profit' => (float) $this->profit,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toDateTimeString(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
                'whatsapp_number' => $this->customer->whatsapp_number,
            ]),
            'car' => $this->whenLoaded('car', fn () => [
                'id' => $this->car->id,
                'plate_number' => $this->car->plate_number,
                'type' => $this->car->type,
                'model' => $this->car->model,
                'year' => $this->car->year,
            ]),
            'labor_items' => LaborItemResource::collection($this->whenLoaded('laborItems')),
            'part_items' => PartItemResource::collection($this->whenLoaded('partItems')),
        ];
    }
}
