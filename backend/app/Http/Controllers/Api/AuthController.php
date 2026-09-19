<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Token lifetime, in hours, for an ordinary session (browser/shift). */
    private const SESSION_HOURS = 12;

    /** Token lifetime, in hours, when "remember me" is checked. */
    private const REMEMBER_HOURS = 24 * 30;

    /**
     * Issue a Sanctum token for valid credentials. The token carries an
     * expiry so a leaked token cannot live forever; "remember me" extends it.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('بيانات الدخول غير صحيحة.'),
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => __('هذا الحساب موقوف.'),
            ]);
        }

        $expiresAt = Carbon::now()->addHours(
            ! empty($data['remember']) ? self::REMEMBER_HOURS : self::SESSION_HOURS,
        );

        $token = $user->createToken($data['device_name'] ?? 'spa', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
