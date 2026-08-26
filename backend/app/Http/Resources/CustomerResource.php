<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Customer
 */
class CustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'alt_phone' => $this->alt_phone,
            'address' => $this->address,
            'country_code' => $this->country_code,
            'whatsapp_number' => $this->whatsapp_number,
            'notes' => $this->notes,
            'cars_count' => $this->whenCounted('cars'),
            'cars' => CarResource::collection($this->whenLoaded('cars')),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
