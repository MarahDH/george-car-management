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
     * `status` = active (default) | archived | all.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', 'active');

        // Outstanding debt per customer (invoice remainders − running credits), and the
        // most recent invoice date — computed so the customers table can show them at a glance.
        $debtExpr = '(COALESCE((select sum(remaining) from invoices where invoices.customer_id = customers.id), 0) '
            . '- COALESCE((select sum(amount) from payments where payments.customer_id = customers.id), 0))';
        $lastVisitExpr = '(select max(date) from invoices where invoices.customer_id = customers.id)';

        $query = Customer::query()
            ->select('customers.*')
            ->selectRaw("{$debtExpr} as debt")
            ->selectRaw("{$lastVisitExpr} as last_visit")
            ->withCount('cars')
            ->with('cars')
            ->when($status === 'active', fn ($query) => $query->active())
            ->when($status === 'archived', fn ($query) => $query->archived())
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhereHas('cars', fn ($c) => $c->where('plate_number', 'like', "%{$q}%"));
                });
            });

        // Sortable columns for the data table (whitelisted).
        $sortMap = ['name' => 'name', 'phone' => 'phone', 'cars' => 'cars_count', 'debt' => 'debt', 'last_visit' => 'last_visit', 'archived_at' => 'archived_at'];
        $sort = $sortMap[(string) $request->query('sort')] ?? null;
        $dir = strtolower((string) $request->query('dir')) === 'asc' ? 'asc' : 'desc';
        if ($sort !== null) {
            $query->orderBy($sort, $dir);
            if ($sort !== 'name') {
                $query->orderBy('name', 'asc'); // stable tiebreak
            }
        } else {
            $query->orderByDesc('created_at');
        }

        $customers = $query->paginate(20)->withQueryString();

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

    /** Mark a customer as no longer coming to the center. */
    public function archive(Customer $customer): CustomerResource
    {
        if (! $customer->isArchived()) {
            $customer->update(['archived_at' => now()]);
        }

        return new CustomerResource($customer->loadCount('cars')->load('cars'));
    }

    /** Bring an archived customer back to the active list. */
    public function unarchive(Customer $customer): CustomerResource
    {
        $customer->update(['archived_at' => null]);

        return new CustomerResource($customer->loadCount('cars')->load('cars'));
    }

    public function destroy(Customer $customer): Response
    {
        $customer->delete();

        return response()->noContent();
    }
}
