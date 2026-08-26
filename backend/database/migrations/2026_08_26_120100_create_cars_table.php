<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('plate_number')->index();      // رقم اللوحة
            $table->string('type')->nullable();            // النوع / الصانع
            $table->string('model')->nullable();           // الموديل
            $table->string('chassis_number')->nullable();  // رقم الشاصي (VIN)
            $table->unsignedSmallInteger('year')->nullable(); // سنة الصنع
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
