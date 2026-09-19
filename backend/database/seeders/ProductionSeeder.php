<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Production seeder: creates ONLY the admin login, no demo data.
 *
 * Credentials come from environment variables so no weak password is baked
 * into the repo:
 *   ADMIN_EMAIL     (default: admin@george.local)
 *   ADMIN_PASSWORD  (default: ChangeMe123! — set a strong value on Railway)
 *   ADMIN_NAME      (default: مدير الورشة)
 *
 * Uses firstOrCreate, so it is safe to run on every deploy: the admin is
 * created once and an in-app password change is never overwritten.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@george.local')],
            [
                'name' => env('ADMIN_NAME', 'مدير الورشة'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'ChangeMe123!')),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ],
        );
    }
}
