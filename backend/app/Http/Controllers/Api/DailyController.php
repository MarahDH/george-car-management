<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DailyController extends Controller
{
    /**
     * The movement for a day — or a date range — with every work order (invoice)
     * dated within it, plus its car, customer, parts (+ source), and labor.
     * Powers "الحركة اليومية".
     *
     * Accepts either a single `date`, or a `from`/`to` range (inclusive). When
     * only one side of the range is given the other mirrors it; out-of-order
     * bounds are swapped so the range is always valid.
     */
    public function index(Request $request): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        if ($from || $to) {
            $start = Carbon::parse($from ?: $to)->toDateString();
            $end = Carbon::parse($to ?: $from)->toDateString();
            if ($start > $end) {
                [$start, $end] = [$end, $start];
            }
        } else {
            $start = $end = $request->query('date')
                ? Carbon::parse($request->query('date'))->toDateString()
                : now()->toDateString();
        }

        $invoices = Invoice::query()
            ->whereBetween('date', [$start, $end])
            ->with(['customer', 'car', 'laborItems.worker', 'partItems.supplier', 'partItems.worker'])
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        return response()->json([
            'date' => $start,
            'from' => $start,
            'to' => $end,
            'invoices' => InvoiceResource::collection($invoices)->resolve(),
            'summary' => [
                'count' => $invoices->count(),
                'total' => round((float) $invoices->sum('total'), 2),
                'collected' => round((float) $invoices->sum('paid_amount'), 2),
                'remaining' => round((float) $invoices->sum('remaining'), 2),
                'parts_cost' => round((float) $invoices->sum('cost_total'), 2),
            ],
        ]);
    }
}
