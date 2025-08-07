<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'unique:users,username',
                'regex:/^[a-zA-Z0-9_]+$/' // Only allow alphanumeric and underscore
            ],
            'email' => 'required|string|lowercase|email|max:100|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'username.unique' => 'Username sudah digunakan, silakan pilih username lain.',
            'username.regex' => 'Username hanya boleh mengandung huruf, angka, dan underscore.',
            'username.min' => 'Username minimal 3 karakter.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email sudah digunakan, silakan gunakan email lain.',
        ]);

        $user = User::create([
            'username' => $request->input('username'),
            'nama' => $request->input('username'), // Nama diambil dari username
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'role' => 'peserta', // default role untuk user baru
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Check if username is available.
     */
    public function checkUsername(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string|min:3|max:50',
        ]);

        $username = $request->input('username');

        // Check if username already exists
        $exists = User::where('username', $username)->exists();

        return response()->json([
            'available' => !$exists,
            'message' => $exists ? 'Username sudah digunakan' : 'Username tersedia'
        ]);
    }

    /**
     * Check if email is available.
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email|max:100',
        ]);

        $email = $request->input('email');

        // Check if email already exists
        $exists = User::where('email', $email)->exists();

        return response()->json([
            'available' => !$exists,
            'message' => $exists ? 'Email sudah digunakan' : 'Email tersedia'
        ]);
    }
}
