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
 * The admin is created once. It is NEVER silently overwritten on later deploys,
 * so an in-app password change is preserved. To force the password back to
 * ADMIN_PASSWORD (e.g. you lost it), set ADMIN_RESET_PASSWORD=true on Railway,
 * redeploy, log in, then remove that variable.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@george.local');
        $password = env('ADMIN_PASSWORD', 'ChangeMe123!');
        $reset = filter_var(env('ADMIN_RESET_PASSWORD', false), FILTER_VALIDATE_BOOL);

        $user = User::where('email', $email)->first();

        if (! $user) {
            User::create([
                'name' => env('ADMIN_NAME', 'مدير الورشة'),
                'email' => $email,
                'password' => Hash::make($password),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ]);

            return;
        }

        if ($reset) {
            $user->update([
                'password' => Hash::make($password),
                'is_active' => true,
            ]);
        }
    }
}
