<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\DocumentNumber;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $customerId = $request->query('customer_id');

        $payments = Payment::query()
            ->with('customer')
            ->when($customerId, fn ($query) => $query->where('customer_id', $customerId))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(30)
            ->withQueryString();

        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request): PaymentResource
    {
        $data = $request->validated();
        $date = Carbon::parse($data['date']);

        $payment = Payment::create([
            'receipt_number' => DocumentNumber::next(
                Payment::class,
                'receipt_number',
                'RC-' . $date->format('Y-m') . '-',
                4,
            ),
            'customer_id' => $data['customer_id'],
            'amount' => $data['amount'],
            'method' => $data['method'],
            'date' => $data['date'],
            'note' => $data['note'] ?? null,
        ]);

        return new PaymentResource($payment->load('customer'));
    }
}
