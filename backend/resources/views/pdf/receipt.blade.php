@php
    $methodLabel = ['cash' => 'نقداً', 'network' => 'شبكة'];
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
    .box { border: 1px solid #e1e5ea; border-radius: 6px; padding: 14px; margin-top: 16px; }
    .row { padding: 6px 0; border-bottom: 1px solid #f1f3f5; }
    .label { color: #5a636d; }
    .amount { font-size: 22px; font-weight: bold; color: #223641; }
</style>
</head>
<body>
    <table class="head"><tr>
        <td><div class="biz">{{ $settings['business_name'] ?? 'مركز صيانة السيارات' }}</div><div class="muted">سند قبض</div></td>
        <td style="text-align: left;">
            <div style="font-weight: bold;">سند رقم: {{ $payment->receipt_number }}</div>
            <div class="muted">التاريخ: {{ $payment->date?->format('Y-m-d') }}</div>
        </td>
    </tr></table>

    <div class="box">
        <div class="row"><span class="label">استلمنا من السيد/ة: </span><b>{{ $payment->customer->name }}</b></div>
        <div class="row"><span class="label">طريقة الدفع: </span>{{ $methodLabel[$payment->method] ?? $payment->method }}</div>
        @if($payment->note)<div class="row"><span class="label">ملاحظة: </span>{{ $payment->note }}</div>@endif
        <div style="padding-top: 14px;"><span class="label">المبلغ: </span><span class="amount">{{ $money($payment->amount) }}</span></div>
    </div>

    <div style="margin-top: 40px;">
        <table style="width: 100%;"><tr>
            <td class="muted">توقيع المستلم</td>
            <td style="text-align: left;" class="muted">ختم المركز</td>
        </tr></table>
    </div>
</body>
</html>
