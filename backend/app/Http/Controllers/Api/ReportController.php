<?php

namespace App\Http\Controllers\Api;

use App\Exports\ReportExport;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\LaborItem;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\PdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $s = $this->build($from, $to);

        return response()->json([
            'range' => ['from' => $from, 'to' => $to],
            'summary' => [
                'collected' => $s['collected'],
                'parts_spend' => $s['parts_spend'],
                'total_debt' => $s['total_debt'],
                'net_profit' => $s['net_profit'],
                'invoices_count' => $s['invoices_count'],
                'top_department' => $s['top_department'],
            ],
            'departments' => $s['departments'],
        ]);
    }

    public function export(Request $request, PdfService $pdf): SymfonyResponse
    {
        [$from, $to] = $this->range($request);
        $format = (string) $request->query('format', 'pdf');
        $s = $this->build($from, $to);
        $settings = Setting::map();

        if ($format === 'xlsx') {
            $cur = $settings['currency_symbol'] ?? '';
            $rows = [
                ['الفترة', "{$from} → {$to}"],
                ['إجمالي المقبوضات', $s['collected']],
                ['مصاريف شراء القطع', $s['parts_spend']],
                ['صافي الربح', $s['net_profit']],
                ['الديون المعلّقة حالياً', $s['total_debt']],
                ['عدد الفواتير', $s['invoices_count']],
                ['—', '—'],
                ['ميكانيك', $s['departments']['mechanic']],
                ['كهرباء', $s['departments']['electrical']],
                ['دوزان', $s['departments']['dozan']],
            ];

            return Excel::download(
                new ReportExport($rows, ['البند', "القيمة ({$cur})"]),
                "warsha-report-{$from}-{$to}.xlsx",
            );
        }

        $html = view('pdf.report', [
            'from' => $from,
            'to' => $to,
            'summary' => [
                'collected' => $s['collected'],
                'parts_spend' => $s['parts_spend'],
                'total_debt' => $s['total_debt'],
                'net_profit' => $s['net_profit'],
                'invoices_count' => $s['invoices_count'],
                'top_department' => $s['top_department'],
            ],
            'departments' => $s['departments'],
            'settings' => $settings,
        ])->render();

        return response($pdf->render($html), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"warsha-report-{$from}-{$to}.pdf\"",
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function range(Request $request): array
    {
        $from = $request->query('from')
            ? Carbon::parse($request->query('from'))->toDateString()
            : now()->startOfMonth()->toDateString();
        $to = $request->query('to')
            ? Carbon::parse($request->query('to'))->toDateString()
            : now()->toDateString();

        return [$from, $to];
    }

    /**
     * @return array<string, mixed>
     */
    private function build(string $from, string $to): array
    {
        $collected = round(
            (float) Invoice::whereBetween('date', [$from, $to])->sum('paid_amount')
            + (float) Payment::whereBetween('date', [$from, $to])->sum('amount'),
            2,
        );
        $partsSpend = round((float) Invoice::whereBetween('date', [$from, $to])->sum('cost_total'), 2);
        $totalDebt = round((float) Invoice::sum('remaining') - (float) Payment::sum('amount'), 2);
        $netProfit = round($collected - $partsSpend, 2);
        $invoicesCount = Invoice::whereBetween('date', [$from, $to])->count();

        $departments = ['mechanic' => 0.0, 'electrical' => 0.0, 'dozan' => 0.0];
        $rows = LaborItem::query()
            ->whereHas('invoice', fn ($q) => $q->whereBetween('date', [$from, $to]))
            ->selectRaw('department, SUM(amount) as total')
            ->groupBy('department')
            ->pluck('total', 'department');
        foreach ($rows as $key => $value) {
            if (array_key_exists($key, $departments)) {
                $departments[$key] = round((float) $value, 2);
            }
        }

        $topDepartment = null;
        $max = -1.0;
        foreach ($departments as $key => $value) {
            if ($value > $max) {
                $max = $value;
                $topDepartment = $value > 0 ? $key : null;
            }
        }

        return [
            'collected' => $collected,
            'parts_spend' => $partsSpend,
            'total_debt' => $totalDebt,
            'net_profit' => $netProfit,
            'invoices_count' => $invoicesCount,
            'departments' => $departments,
            'top_department' => $topDepartment,
        ];
    }
}
