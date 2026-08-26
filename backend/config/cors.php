<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | The decoupled React SPA calls this API from a different origin during
    | development (Vite on :5173) and in production (its own host). Auth uses
    | Sanctum bearer tokens, so credentialed cookies are not required.
    */

    'paths' => ['api/*', 'health', 'login', 'logout', 'me', 'settings'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [
        '#^http://localhost:\d+$#',
        '#^http://127\.0\.0\.1:\d+$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
