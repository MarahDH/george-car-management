<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\LaborItem
 */
class LaborItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'department' => $this->department,
            'worker_id' => $this->worker_id,
            'worker_name' => $this->whenLoaded('worker', fn () => $this->worker?->name),
            'description' => $this->description,
            'amount' => (float) $this->amount,
        ];
    }
}
