<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DebtController extends Controller
{
    /**
     * Customers who owe money, highest debt first.
     */
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        $debtExpr = '(COALESCE((select sum(remaining) from invoices where invoices.customer_id = customers.id), 0) '
            . '- COALESCE((select sum(amount) from payments where payments.customer_id = customers.id), 0))';

        $customers = Customer::query()
            ->select('customers.*')
            ->selectRaw("{$debtExpr} as debt")
            ->when($q !== '', fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%");
            }))
            ->havingRaw("{$debtExpr} > 0.001")
            ->orderByDesc('debt')
            ->paginate(30)
            ->withQueryString();

        $totalDebt = round((float) Invoice::sum('remaining') - (float) Payment::sum('amount'), 2);

        return response()->json([
            'data' => $customers->getCollection()->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'whatsapp_number' => $c->whatsapp_number,
                'debt' => round((float) $c->getAttribute('debt'), 2),
            ])->values(),
            'meta' => [
                'total' => $customers->total(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
            ],
            'summary' => [
                'total_debt' => $totalDebt,
                'debtors_count' => $customers->total(),
            ],
        ]);
    }
}
