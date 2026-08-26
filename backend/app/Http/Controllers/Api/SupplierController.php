<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SupplierController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $suppliers = Supplier::query()
            ->withCount('partItems')
            ->when($q !== '', fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%");
            }))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return SupplierResource::collection($suppliers);
    }

    public function store(StoreSupplierRequest $request): SupplierResource
    {
        return new SupplierResource(Supplier::create($request->validated()));
    }

    /**
     * Supplier profile + statement of parts bought from them (for warranty / returns).
     */
    public function show(Supplier $supplier): JsonResponse
    {
        $lines = $supplier->partItems()
            ->with('invoice.customer')
            ->latest()
            ->get()
            ->map(fn ($part) => [
                'id' => $part->id,
                'name' => $part->name,
                'buy_price' => (float) $part->buy_price,
                'quantity' => $part->quantity,
                'line_cost' => round((float) $part->buy_price * $part->quantity, 2),
                'date' => $part->invoice?->date?->toDateString(),
                'invoice_id' => $part->invoice_id,
                'invoice_number' => $part->invoice?->invoice_number,
                'customer_name' => $part->invoice?->customer?->name,
            ]);

        return response()->json([
            'data' => (new SupplierResource($supplier))->resolve(),
            'statement' => $lines,
            'total_bought' => round((float) $lines->sum('line_cost'), 2),
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): SupplierResource
    {
        $supplier->update($request->validated());

        return new SupplierResource($supplier);
    }

    public function destroy(Supplier $supplier): Response
    {
        $supplier->delete();

        return response()->noContent();
    }
}
