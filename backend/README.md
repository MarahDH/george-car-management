# Warsha — API (backend)

Laravel 13 REST API for the Warsha car service center app. JSON only, Sanctum bearer-token auth,
MySQL. Consumed by the decoupled React SPA in `../frontend`.

See the root [`../README.md`](../README.md) for full setup, run commands, and endpoints.

## Quick run

```bash
composer install
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Default dev login: `admin@warsha.test` / `password`.
