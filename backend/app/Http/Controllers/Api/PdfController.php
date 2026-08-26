<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\PdfService;
use Symfony\Component\HttpFoundation\Response;

class PdfController extends Controller
{
    public function __construct(private PdfService $pdf) {}

    public function invoice(Invoice $invoice): Response
    {
        $invoice->load(['customer', 'car', 'laborItems', 'partItems']);

        $html = view('pdf.invoice', [
            'invoice' => $invoice,
            'settings' => Setting::map(),
        ])->render();

        return $this->stream($html, "invoice-{$invoice->invoice_number}.pdf");
    }

    public function receipt(Payment $payment): Response
    {
        $payment->load('customer');

        $html = view('pdf.receipt', [
            'payment' => $payment,
            'settings' => Setting::map(),
        ])->render();

        return $this->stream($html, "receipt-{$payment->receipt_number}.pdf");
    }

    private function stream(string $html, string $filename): Response
    {
        return response($this->pdf->render($html), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }
}
