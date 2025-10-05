<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class CloudflareSessionOptimizer
{
    /**
     * Handle an incoming request.
     * Middleware ini mengoptimalkan konfigurasi session untuk environment production
     * yang menggunakan Cloudflare, untuk mengurangi verification yang berulang.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Hanya aktif di production dengan Cloudflare
        if (app()->environment('production') && $this->isCloudflareRequest($request)) {
            $this->optimizeSessionConfig($request);
        }

        $response = $next($request);

        // Set additional headers untuk Cloudflare caching
        if (app()->environment('production') && $this->isCloudflareRequest($request)) {
            $this->setCloudflareHeaders($response, $request);
        }

        return $response;
    }

    /**
     * Check if request is coming through Cloudflare
     */
    private function isCloudflareRequest(Request $request): bool
    {
        return $request->hasHeader('CF-RAY') ||
               $request->hasHeader('CF-Connecting-IP') ||
               $request->hasHeader('CF-IPCountry');
    }

    /**
     * Optimize session configuration for Cloudflare environment
     */
    private function optimizeSessionConfig(Request $request): void
    {
        // Extend session lifetime untuk mengurangi verification
        Config::set('session.lifetime', 960); // 16 jam (2x default)

        // Pastikan session tidak expire saat browser ditutup
        Config::set('session.expire_on_close', false);

        // Optimize cookie settings untuk Cloudflare
        Config::set('session.secure', true); // HTTPS only
        Config::set('session.http_only', true); // Prevent XSS
        Config::set('session.same_site', 'lax'); // Allow cross-site dengan restrictions

        // Set domain untuk Cloudflare
        $domain = $request->getHost();
        if (str_contains($domain, 'unsika.ac.id')) {
            Config::set('session.domain', '.' . $domain);
        }

        // Optimize session path
        Config::set('session.path', '/');

        // Use database driver untuk persistence yang lebih baik
        if (Config::get('session.driver') !== 'database') {
            Config::set('session.driver', 'database');
        }
    }

    /**
     * Set headers untuk optimasi Cloudflare caching
     */
    private function setCloudflareHeaders(Response $response, Request $request): void
    {
        // Untuk authenticated users, disable caching di Cloudflare
        if (auth()->check()) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        // Set headers untuk session persistence
        if ($request->hasSession()) {
            $response->headers->set('Vary', 'Cookie');

            // Cloudflare optimization headers
            $response->headers->set('CF-Cache-Status', 'DYNAMIC'); // Force dynamic content
        }

        // Headers untuk mencegah session fixation
        if ($response->headers->has('Set-Cookie')) {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }
    }
}
