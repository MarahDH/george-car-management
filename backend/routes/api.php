<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DailyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\SupplierDebtController;
use App\Http\Controllers\Api\SupplierPaymentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PdfController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\WorkerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Warsha (car service center)
|--------------------------------------------------------------------------
| Consumed by the decoupled React SPA. Auth is Sanctum bearer tokens.
*/

Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'warsha']));

// Rate-limited to blunt brute-force attempts (per IP + email).
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    // Dashboard — one call returns all landing-page data (KPIs + work boards)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Customers + cars (Phase 1)
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
    Route::post('/customers/{customer}/archive', [CustomerController::class, 'archive']);
    Route::post('/customers/{customer}/unarchive', [CustomerController::class, 'unarchive']);
    Route::post('/customers/{customer}/cars', [CarController::class, 'store']);
    Route::put('/cars/{car}', [CarController::class, 'update']);
    Route::delete('/cars/{car}', [CarController::class, 'destroy']);

    // Daily movement (الحركة اليومية)
    Route::get('/daily', [DailyController::class, 'index']);

    // Workers (العمّال) — managed list of technicians
    Route::get('/workers', [WorkerController::class, 'index']);
    Route::post('/workers', [WorkerController::class, 'store']);
    Route::put('/workers/{worker}', [WorkerController::class, 'update']);
    Route::delete('/workers/{worker}', [WorkerController::class, 'destroy']);

    // Supplier debts (الديون لكل تجار السوق) + payments to suppliers
    Route::get('/supplier-debts', [SupplierDebtController::class, 'index']);
    Route::post('/supplier-payments', [SupplierPaymentController::class, 'store']);

    // Suppliers (Phase 4)
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

    // Invoices / work orders (Phase 2)
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
    Route::patch('/invoices/{invoice}/status', [InvoiceController::class, 'updateStatus']);
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);
    Route::get('/invoices/{invoice}/pdf', [PdfController::class, 'invoice']);

    // Debts + payments/receipts (Phase 3)
    Route::get('/debts', [DebtController::class, 'index']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{payment}/pdf', [PdfController::class, 'receipt']);

    // Reports (Phase 5)
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/export', [ReportController::class, 'export']);

    // Backups (Phase 7)
    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups', [BackupController::class, 'store']);
    Route::get('/backups/{name}/download', [BackupController::class, 'download']);
});
