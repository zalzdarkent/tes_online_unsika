<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): mixed  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Check if user has required role
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // If user doesn't have permission, redirect with error
        return redirect()->route('dashboard')->with('error', 'Anda tidak memiliki akses untuk halaman ini.');
    }
}
