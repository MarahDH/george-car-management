<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('car_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('odometer')->nullable();
            $table->string('status')->default('inspecting'); // inspecting | repairing | ready
            $table->decimal('labor_total', 15, 2)->default(0);
            $table->decimal('parts_total', 15, 2)->default(0); // parts sell total
            $table->decimal('cost_total', 15, 2)->default(0);  // parts buy total (cost)
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->string('payment_method')->nullable();      // cash | network
            $table->decimal('remaining', 15, 2)->default(0);
            $table->decimal('profit', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
