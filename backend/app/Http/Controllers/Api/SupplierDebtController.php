<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartItem;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierDebtController extends Controller
{
    /**
     * Suppliers the shop owes money to (parts bought minus paid), highest first.
     */
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        $purchases = '(SELECT COALESCE(SUM(buy_price * quantity), 0) FROM part_items WHERE part_items.supplier_id = suppliers.id)';
        $paid = '(SELECT COALESCE(SUM(amount), 0) FROM supplier_payments WHERE supplier_payments.supplier_id = suppliers.id)';
        $debtExpr = "({$purchases} - {$paid})";

        $suppliers = Supplier::query()
            ->select('suppliers.*')
            ->selectRaw("{$purchases} as purchases")
            ->selectRaw("{$paid} as paid")
            ->selectRaw("{$debtExpr} as debt")
            ->when($q !== '', fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%");
            }))
            ->havingRaw("{$debtExpr} > 0.001")
            ->orderByDesc('debt')
            ->paginate(30)
            ->withQueryString();

        $totalPurchases = (float) PartItem::query()->selectRaw('COALESCE(SUM(buy_price * quantity), 0) as t')->value('t');
        $totalPaid = (float) SupplierPayment::sum('amount');

        return response()->json([
            'data' => $suppliers->getCollection()->map(fn (Supplier $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'phone' => $s->phone,
                'purchases' => round((float) $s->getAttribute('purchases'), 2),
                'paid' => round((float) $s->getAttribute('paid'), 2),
                'debt' => round((float) $s->getAttribute('debt'), 2),
            ])->values(),
            'meta' => [
                'total' => $suppliers->total(),
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
                'per_page' => $suppliers->perPage(),
            ],
            'summary' => [
                'total_debt' => round($totalPurchases - $totalPaid, 2),
                'total_purchases' => round($totalPurchases, 2),
                'total_paid' => round($totalPaid, 2),
                'suppliers_count' => $suppliers->total(),
            ],
        ]);
    }
}
