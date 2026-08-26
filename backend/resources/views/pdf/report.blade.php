@php
    $dept = ['mechanic' => 'ميكانيك', 'electrical' => 'كهرباء', 'dozan' => 'دوزان'];
    $cur = $settings['currency_symbol'] ?? 'ل.س';
    $money = fn ($v) => number_format((float) $v, 0) . ' ' . $cur;
@endphp
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
    body { font-family: sans-serif; color: #191d21; font-size: 12px; }
    .head { width: 100%; border-bottom: 2px solid #e07b00; padding-bottom: 8px; }
    .biz { font-size: 20px; font-weight: bold; color: #223641; }
    .muted { color: #5a636d; }
    table { width: 100%; border-collapse: collapse; }
    .cards td { padding: 10px; border: 1px solid #e1e5ea; }
    .cards .k { color: #5a636d; font-size: 11px; }
    .cards .v { font-size: 16px; font-weight: bold; color: #223641; }
    .dept th { background: #f1f3f5; text-align: right; padding: 6px; border-bottom: 1px solid #cfd5db; }
    .dept td { padding: 6px; border-bottom: 1px solid #e1e5ea; }
    .num { text-align: left; }
</style>
</head>
<body>
    <table class="head"><tr>
        <td><div class="biz">{{ $settings['business_name'] ?? 'مركز صيانة السيارات' }}</div><div class="muted">تقرير مالي</div></td>
        <td style="text-align: left;"><div class="muted">من {{ $from }} إلى {{ $to }}</div></td>
    </tr></table>

    <table class="cards" style="margin-top: 14px;">
        <tr>
            <td style="width: 33%;"><div class="k">إجمالي المقبوضات</div><div class="v">{{ $money($summary['collected']) }}</div></td>
            <td style="width: 33%;"><div class="k">مصاريف شراء القطع</div><div class="v">{{ $money($summary['parts_spend']) }}</div></td>
            <td style="width: 34%;"><div class="k">صافي الربح</div><div class="v">{{ $money($summary['net_profit']) }}</div></td>
        </tr>
        <tr>
            <td><div class="k">الديون المعلّقة (حالياً)</div><div class="v">{{ $money($summary['total_debt']) }}</div></td>
            <td><div class="k">عدد الفواتير</div><div class="v">{{ $summary['invoices_count'] }}</div></td>
            <td><div class="k">القسم الأكثر دخلاً</div><div class="v">{{ $dept[$summary['top_department']] ?? '—' }}</div></td>
        </tr>
    </table>

    <h3 style="color: #223641; margin-top: 18px;">الدخل حسب القسم (أجور اليد)</h3>
    <table class="dept">
        <thead><tr><th>القسم</th><th class="num">الإجمالي</th></tr></thead>
        <tbody>
        @foreach($departments as $key => $value)
            <tr><td>{{ $dept[$key] ?? $key }}</td><td class="num">{{ $money($value) }}</td></tr>
        @endforeach
        </tbody>
    </table>

    <div style="margin-top: 24px; text-align: center; color: #8a929b; font-size: 10px;">
        تم إنشاء التقرير في {{ now()->format('Y-m-d H:i') }}
    </div>
</body>
</html>
