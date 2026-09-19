<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierPaymentRequest;
use App\Models\SupplierPayment;
use App\Services\DocumentNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class SupplierPaymentController extends Controller
{
    public function store(StoreSupplierPaymentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $date = Carbon::parse($data['date']);

        $payment = SupplierPayment::create([
            'receipt_number' => DocumentNumber::next(
                SupplierPayment::class,
                'receipt_number',
                'SP-' . $date->format('Y-m') . '-',
                4,
            ),
            'supplier_id' => $data['supplier_id'],
            'amount' => $data['amount'],
            'method' => $data['method'],
            'date' => $data['date'],
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['data' => [
            'id' => $payment->id,
            'receipt_number' => $payment->receipt_number,
            'amount' => (float) $payment->amount,
        ]], 201);
    }
}
