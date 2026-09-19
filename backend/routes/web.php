<?php

use Illuminate\Support\Facades\Route;

/*
| This is an API-only backend (all real routes live in routes/api.php). The
| React SPA is deployed as a separate service, so any non-API request just gets
| a small status response instead of an application shell.
*/
Route::fallback(function () {
    if (request()->is('api/*')) {
        abort(404);
    }

    return response()->json(['app' => 'George API', 'status' => 'ok']);
});
