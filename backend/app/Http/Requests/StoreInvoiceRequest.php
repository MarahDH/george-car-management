<?php

namespace App\Http\Requests;

use App\Models\Car;
use App\Models\Invoice;
use App\Models\LaborItem;
use App\Models\Payment;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
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
            'customer_id' => ['required', 'exists:customers,id'],
            'car_id' => ['required', 'exists:cars,id'],
            'date' => ['required', 'date'],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::in(Invoice::STATUSES)],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', Rule::in(Payment::METHODS)],
            'notes' => ['nullable', 'string', 'max:2000'],

            'labor_items' => ['array'],
            'labor_items.*.department' => ['required', Rule::in(LaborItem::DEPARTMENTS)],
            'labor_items.*.description' => ['nullable', 'string', 'max:255'],
            'labor_items.*.amount' => ['required', 'numeric', 'min:0'],

            'part_items' => ['array'],
            'part_items.*.supplier_id' => ['nullable', 'exists:suppliers,id'],
            'part_items.*.name' => ['required', 'string', 'max:255'],
            'part_items.*.buy_price' => ['required', 'numeric', 'min:0'],
            'part_items.*.sell_price' => ['required', 'numeric', 'min:0'],
            'part_items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $carId = $this->input('car_id');
            $customerId = $this->input('customer_id');
            if ($carId && $customerId) {
                $belongs = Car::where('id', $carId)->where('customer_id', $customerId)->exists();
                if (! $belongs) {
                    $v->errors()->add('car_id', 'السيارة المختارة لا تخص هذا العميل.');
                }
            }
        });
    }
}
