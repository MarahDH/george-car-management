<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('labor_items', function (Blueprint $table) {
            $table->foreignId('worker_id')->nullable()->after('invoice_id')->constrained()->nullOnDelete();
        });

        Schema::table('part_items', function (Blueprint $table) {
            $table->foreignId('worker_id')->nullable()->after('supplier_id')->constrained()->nullOnDelete();
            // USD equivalent of the SYP price, recorded for reference (money math stays in SYP).
            $table->decimal('price_usd', 15, 2)->nullable()->after('sell_price');
        });
    }

    public function down(): void
    {
        Schema::table('labor_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('worker_id');
        });
        Schema::table('part_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('worker_id');
            $table->dropColumn('price_usd');
        });
    }
};
