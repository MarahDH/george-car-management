<?php

use Illuminate\Support\Facades\Route;

/*
| Serve the built React SPA for every non-API route so client-side routing and
| deep links work. Static asset files (JS/CSS/images) are served by the web
| server before a request ever reaches Laravel.
*/
Route::fallback(function () {
    if (request()->is('api/*')) {
        abort(404);
    }

    $index = public_path('index.html');
    abort_unless(is_file($index), 404, 'الواجهة غير مبنية بعد. شغّل بناء الواجهة أولاً.');

    return response()->file($index);
});
