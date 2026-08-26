<?php

namespace App\Services;

use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

class PdfService
{
    /**
     * Render an HTML string to a UTF-8, RTL, A4 PDF and return the raw bytes.
     */
    public function render(string $html): string
    {
        $tempDir = storage_path('app/mpdf');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'directionality' => 'rtl',
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'default_font_size' => 10,
            'margin_top' => 12,
            'margin_bottom' => 12,
            'margin_left' => 12,
            'margin_right' => 12,
            'tempDir' => $tempDir,
        ]);

        $mpdf->WriteHTML($html, HTMLParserMode::DEFAULT_MODE);

        return $mpdf->Output('', Destination::STRING_RETURN);
    }
}
