<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Worker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WorkerController extends Controller
{
    /** The managed list of workers (technicians). Active-only by default. */
    public function index(Request $request): JsonResponse
    {
        $workers = Worker::query()
            ->when($request->boolean('active_only', true), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get(['id', 'name', 'is_active']);

        return response()->json(['data' => $workers]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $worker = Worker::create($data)->refresh();

        return response()->json(['data' => $worker->only('id', 'name', 'is_active')], 201);
    }

    public function update(Request $request, Worker $worker): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $worker->update($data);

        return response()->json(['data' => $worker->only('id', 'name', 'is_active')]);
    }

    public function destroy(Worker $worker): Response
    {
        $worker->delete();

        return response()->noContent();
    }
}
