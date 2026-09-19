<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Everything the SPA dashboard needs in a single request:
     * today's takings, the open-work count, total outstanding debt, and the
     * "in progress" + "ready for pickup" work boards. Consolidating these into
     * one endpoint avoids the staggered, one-by-one loading of five parallel calls.
     */
    public function index(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        // Today's collected = invoice down-payments dated today + standalone receipts today.
        $collected = round(
            (float) Invoice::whereDate('date', $today)->sum('paid_amount')
            + (float) Payment::whereDate('date', $today)->sum('amount'),
            2,
        );

        // Outstanding debt across the whole ledger (invoice remainders − running credits).
        $totalDebt = round((float) Invoice::sum('remaining') - (float) Payment::sum('amount'), 2);

        $openCount = Invoice::whereIn('status', ['inspecting', 'repairing'])->count();

        // Oldest first so cars that have been sitting in the workshop longest rise to the
        // top of the board. Labor items are loaded so the board can show the departments.
        $inProgress = Invoice::query()
            ->with(['customer', 'car', 'laborItems.worker'])
            ->whereIn('status', ['inspecting', 'repairing'])
            ->orderBy('date')
            ->orderBy('id')
            ->limit(100)
            ->get();

        $ready = Invoice::query()
            ->with(['customer', 'car', 'laborItems.worker'])
            ->where('status', 'ready')
            ->orderBy('date')
            ->orderBy('id')
            ->limit(100)
            ->get();

        return response()->json([
            'summary' => [
                'collected' => $collected,
                'open_count' => $openCount,
                'total_debt' => $totalDebt,
            ],
            'in_progress' => InvoiceResource::collection($inProgress)->resolve($request),
            'ready' => InvoiceResource::collection($ready)->resolve($request),
        ]);
    }
}
