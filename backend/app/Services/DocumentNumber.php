<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;

class DocumentNumber
{
    /**
     * Generate the next sequential document number for a given prefix,
     * e.g. invoices "2026-08-0001", receipts "RC-2026-08-0001". The trailing
     * numeric segment resets whenever the prefix changes (per month).
     *
     * @param  class-string<Model>  $model
     */
    public static function next(string $model, string $column, string $prefix, int $padding = 4): string
    {
        /** @var string|null $last */
        $last = $model::query()
            ->where($column, 'like', $prefix . '%')
            ->orderByDesc($column)
            ->value($column);

        $seq = 1;
        if ($last) {
            $parts = explode('-', $last);
            $seq = ((int) end($parts)) + 1;
        }

        return $prefix . str_pad((string) $seq, $padding, '0', STR_PAD_LEFT);
    }
}
