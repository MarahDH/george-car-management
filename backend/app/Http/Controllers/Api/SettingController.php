<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Return the application settings the SPA needs (currency, business name, etc.).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'settings' => Setting::map(),
        ]);
    }

    /**
     * Update the editable settings.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'business_name' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:16'],
            'currency_symbol' => ['nullable', 'string', 'max:16'],
            'invoice_number_format' => ['nullable', 'string', 'max:64'],
        ]);

        foreach ($data as $key => $value) {
            if ($value !== null) {
                Setting::put($key, $value);
            }
        }

        return response()->json(['settings' => Setting::map()]);
    }
}
