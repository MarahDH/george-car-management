<?php

namespace App\Http\Requests;

use App\Models\SupplierPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierPaymentRequest extends FormRequest
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
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::in(SupplierPayment::METHODS)],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
