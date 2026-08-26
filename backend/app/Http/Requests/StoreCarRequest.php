<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plate_number' => ['required', 'string', 'max:40'],
            'type' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'chassis_number' => ['nullable', 'string', 'max:120'],
            'year' => ['nullable', 'integer', 'min:1950', 'max:' . (date('Y') + 1)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
