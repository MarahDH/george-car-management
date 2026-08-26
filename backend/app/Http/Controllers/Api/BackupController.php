<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function __construct(private BackupService $backup) {}

    public function index(): JsonResponse
    {
        $dir = storage_path('app/backups');
        $files = is_dir($dir) ? (glob($dir . DIRECTORY_SEPARATOR . 'warsha-*.sql') ?: []) : [];
        usort($files, fn ($a, $b) => filemtime($b) <=> filemtime($a));

        return response()->json([
            'data' => array_map(fn ($f) => [
                'name' => basename($f),
                'size' => filesize($f),
                'created_at' => date('Y-m-d H:i', filemtime($f)),
            ], $files),
        ]);
    }

    public function store(): JsonResponse
    {
        $file = $this->backup->create();

        return response()->json(['name' => $file], 201);
    }

    public function download(string $name): BinaryFileResponse
    {
        abort_unless(preg_match('/^warsha-\d{8}-\d{6}\.sql$/', $name) === 1, 404);

        $path = storage_path('app/backups/' . $name);
        abort_unless(is_file($path), 404);

        return response()->download($path);
    }
}
