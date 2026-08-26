@php
    $dept = ['mechanic' => 'ميكانيك', 'electrical' => 'كهرباء', 'dozan' => 'دوزان'];
    $statusLabel = ['inspecting' => 'قيد الفحص', 'repairing' => 'قيد الإصلاح', 'ready' => 'جاهزة للتسليم'];
    $methodLabel = ['cash' => 'نقداً', 'network' => 'شبكة'];
    $cur = $settings['currency_symbol'] ?? 'ل.س';
    $money = fn ($v) => number_format((float) $v, 0) . ' ' . $cur;
@endphp
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
    body { font-family: sans-serif; color: #191d21; font-size: 11px; }
    .head { width: 100%; border-bottom: 2px solid #e07b00; padding-bottom: 8px; }
    .biz { font-size: 20px; font-weight: bold; color: #223641; }
    .doc { font-size: 15px; font-weight: bold; }
    .muted { color: #5a636d; }
    table { width: 100%; border-collapse: collapse; }
    .meta td { padding: 3px 0; }
    .items th { background: #f1f3f5; text-align: right; padding: 6px; border-bottom: 1px solid #cfd5db; font-size: 10px; }
    .items td { padding: 6px; border-bottom: 1px solid #e1e5ea; }
    .items .num { text-align: left; }
    .totals { width: 45%; margin-right: 55%; }
    .totals td { padding: 4px 6px; }
    .totals .label { color: #5a636d; }
    .totals .val { text-align: left; font-weight: bold; }
    .grand { background: #223641; color: #fff; }
    .remain { color: #b4382e; font-weight: bold; }
    .sec { font-weight: bold; margin: 12px 0 4px; color: #223641; }
    .badge { border: 1px solid #cfd5db; border-radius: 4px; padding: 2px 6px; font-size: 10px; }
</style>
</head>
<body>
    <table class="head"><tr>
        <td>
            <div class="biz">{{ $settings['business_name'] ?? 'مركز صيانة السيارات' }}</div>
            <div class="muted">فاتورة صيانة</div>
        </td>
        <td style="text-align: left;">
            <div class="doc">فاتورة رقم: {{ $invoice->invoice_number }}</div>
            <div class="muted">التاريخ: {{ $invoice->date?->format('Y-m-d') }}</div>
            <div><span class="badge">{{ $statusLabel[$invoice->status] ?? $invoice->status }}</span></div>
        </td>
    </tr></table>

    <table class="meta" style="margin-top: 10px;"><tr>
        <td style="width: 50%; vertical-align: top;">
            <div class="sec">العميل</div>
            <div>{{ $invoice->customer->name }}</div>
            <div class="muted" dir="ltr" style="text-align: right;">{{ $invoice->customer->phone }}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
            <div class="sec">السيارة</div>
            <div>{{ $invoice->car->plate_number }} — {{ trim(($invoice->car->type ?? '') . ' ' . ($invoice->car->model ?? '')) }}</div>
            <div class="muted">
                @if($invoice->car->year) موديل {{ $invoice->car->year }} @endif
                @if($invoice->odometer) · العداد {{ number_format($invoice->odometer) }} كم @endif
            </div>
        </td>
    </tr></table>

    @if($invoice->laborItems->count())
        <div class="sec">أجور اليد</div>
        <table class="items">
            <thead><tr><th>القسم</th><th>الوصف</th><th class="num">المبلغ</th></tr></thead>
            <tbody>
            @foreach($invoice->laborItems as $li)
                <tr>
                    <td>{{ $dept[$li->department] ?? $li->department }}</td>
                    <td>{{ $li->description }}</td>
                    <td class="num">{{ $money($li->amount) }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    @endif

    @if($invoice->partItems->count())
        <div class="sec">قطع الغيار</div>
        <table class="items">
            <thead><tr><th>القطعة</th><th class="num">الكمية</th><th class="num">سعر البيع</th><th class="num">الإجمالي</th></tr></thead>
            <tbody>
            @foreach($invoice->partItems as $pi)
                <tr>
                    <td>{{ $pi->name }}</td>
                    <td class="num">{{ $pi->quantity }}</td>
                    <td class="num">{{ $money($pi->sell_price) }}</td>
                    <td class="num">{{ $money($pi->sell_price * $pi->quantity) }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    @endif

    <table class="totals" style="margin-top: 14px;">
        <tr><td class="label">إجمالي الأجور</td><td class="val">{{ $money($invoice->labor_total) }}</td></tr>
        <tr><td class="label">إجمالي القطع</td><td class="val">{{ $money($invoice->parts_total) }}</td></tr>
        <tr class="grand"><td>الإجمالي</td><td class="val">{{ $money($invoice->total) }}</td></tr>
        <tr><td class="label">المدفوع @if($invoice->payment_method) ({{ $methodLabel[$invoice->payment_method] ?? '' }}) @endif</td><td class="val">{{ $money($invoice->paid_amount) }}</td></tr>
        <tr><td class="label">المتبقي</td><td class="val remain">{{ $money($invoice->remaining) }}</td></tr>
    </table>

    @if($invoice->notes)
        <div class="sec">ملاحظات</div>
        <div class="muted">{{ $invoice->notes }}</div>
    @endif

    <div style="margin-top: 24px; text-align: center; color: #8a929b; font-size: 10px;">
        شكراً لتعاملكم معنا · {{ $settings['business_name'] ?? '' }}
    </div>
</body>
</html>
