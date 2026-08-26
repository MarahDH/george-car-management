<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CustomerController extends Controller
{
    /**
     * List customers, with an optional unified search by name, phone, or car plate number.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $customers = Customer::query()
            ->withCount('cars')
            ->with('cars')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhereHas('cars', fn ($c) => $c->where('plate_number', 'like', "%{$q}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return CustomerResource::collection($customers);
    }

    public function store(StoreCustomerRequest $request): CustomerResource
    {
        $customer = Customer::create($request->validated());

        return new CustomerResource($customer->loadCount('cars')->load('cars'));
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->loadCount('cars')->load('cars');

        $invoices = $customer->invoices()
            ->with(['car', 'laborItems'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => (new CustomerResource($customer))->resolve(),
            'financials' => [
                'total_paid' => $customer->totalPaid(),
                'debt' => $customer->debt(),
            ],
            'invoices' => InvoiceResource::collection($invoices)->resolve(),
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer->update($request->validated());

        return new CustomerResource($customer->loadCount('cars')->load('cars'));
    }

    public function destroy(Customer $customer): Response
    {
        $customer->delete();

        return response()->noContent();
    }
}
