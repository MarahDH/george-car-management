<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCarRequest;
use App\Http\Requests\UpdateCarRequest;
use App\Http\Resources\CarResource;
use App\Models\Car;
use App\Models\Customer;
use Illuminate\Http\Response;

class CarController extends Controller
{
    public function store(StoreCarRequest $request, Customer $customer): CarResource
    {
        $car = $customer->cars()->create($request->validated());

        return new CarResource($car);
    }

    public function update(UpdateCarRequest $request, Car $car): CarResource
    {
        $car->update($request->validated());

        return new CarResource($car);
    }

    public function destroy(Car $car): Response
    {
        $car->delete();

        return response()->noContent();
    }
}
