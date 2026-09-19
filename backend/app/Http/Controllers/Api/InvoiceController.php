<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Http\Requests\UpdateInvoiceStatusRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Setting;
use App\Services\DocumentNumber;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');

        $invoices = Invoice::query()
            ->with(['customer', 'car'])
            ->when(in_array($status, Invoice::STATUSES, true), fn ($query) => $query->where('status', $status))
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('invoice_number', 'like', "%{$q}%")
                        ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$q}%"))
                        ->orWhereHas('car', fn ($c) => $c->where('plate_number', 'like', "%{$q}%"));
                });
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return InvoiceResource::collection($invoices);
    }

    public function store(StoreInvoiceRequest $request): InvoiceResource
    {
        $data = $request->validated();

        $invoice = DB::transaction(function () use ($data) {
            $date = Carbon::parse($data['date']);
            $padding = (int) Setting::get('invoice_seq_padding', 4);

            $invoice = Invoice::create([
                'invoice_number' => DocumentNumber::next(
                    Invoice::class,
                    'invoice_number',
                    $date->format('Y-m') . '-',
                    $padding,
                ),
                'customer_id' => $data['customer_id'],
                'car_id' => $data['car_id'],
                'date' => $data['date'],
                'odometer' => $data['odometer'] ?? null,
                'status' => $data['status'],
                'paid_amount' => $data['paid_amount'] ?? 0,
                'payment_method' => $data['payment_method'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncItems($invoice, $data);

            // A new visit means the customer is back — take them out of the archive.
            Customer::whereKey($data['customer_id'])->archived()->update(['archived_at' => null]);

            return $invoice;
        });

        return new InvoiceResource(
            $invoice->load(['customer', 'car', 'laborItems.worker', 'partItems.supplier', 'partItems.worker'])
        );
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource(
            $invoice->load(['customer', 'car', 'laborItems.worker', 'partItems.supplier', 'partItems.worker'])
        );
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): InvoiceResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($invoice, $data) {
            $invoice->update([
                'customer_id' => $data['customer_id'],
                'car_id' => $data['car_id'],
                'date' => $data['date'],
                'odometer' => $data['odometer'] ?? null,
                'status' => $data['status'],
                'paid_amount' => $data['paid_amount'] ?? 0,
                'payment_method' => $data['payment_method'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $invoice->laborItems()->delete();
            $invoice->partItems()->delete();

            $this->syncItems($invoice, $data);
        });

        return new InvoiceResource(
            $invoice->load(['customer', 'car', 'laborItems.worker', 'partItems.supplier', 'partItems.worker'])
        );
    }

    public function updateStatus(UpdateInvoiceStatusRequest $request, Invoice $invoice): InvoiceResource
    {
        $invoice->update(['status' => $request->validated()['status']]);

        return new InvoiceResource($invoice->load(['customer', 'car']));
    }

    public function destroy(Invoice $invoice): Response
    {
        $invoice->delete();

        return response()->noContent();
    }

    /**
     * Create line items from the payload, then recompute + persist the invoice totals.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncItems(Invoice $invoice, array $data): void
    {
        foreach ($data['labor_items'] ?? [] as $item) {
            $invoice->laborItems()->create([
                'worker_id' => $item['worker_id'] ?? null,
                'department' => $item['department'],
                'description' => $item['description'] ?? null,
                'amount' => $item['amount'],
            ]);
        }

        foreach ($data['part_items'] ?? [] as $item) {
            $invoice->partItems()->create([
                'supplier_id' => $item['supplier_id'] ?? null,
                'worker_id' => $item['worker_id'] ?? null,
                'name' => $item['name'],
                'buy_price' => $item['buy_price'],
                'sell_price' => $item['sell_price'],
                'price_usd' => $item['price_usd'] ?? null,
                'quantity' => $item['quantity'],
            ]);
        }

        $invoice->load(['laborItems', 'partItems']);
        $invoice->recalculateTotals();
        $invoice->save();
    }
}
