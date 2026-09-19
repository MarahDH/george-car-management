<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->nullable();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('method')->default('cash'); // cash | network
            $table->date('date');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
    }
};
