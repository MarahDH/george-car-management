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
            'archived_at' => $this->archived_at?->toDateTimeString(),
            'is_archived' => $this->archived_at !== null,
            'cars_count' => $this->whenCounted('cars'),
            'cars' => CarResource::collection($this->whenLoaded('cars')),
            // Present only on the list endpoint (computed via selectRaw).
            'debt' => array_key_exists('debt', $this->getAttributes())
                ? round((float) $this->getAttributes()['debt'], 2)
                : null,
            'last_visit' => array_key_exists('last_visit', $this->getAttributes()) && $this->getAttributes()['last_visit']
                ? \Illuminate\Support\Carbon::parse($this->getAttributes()['last_visit'])->toDateString()
                : null,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
