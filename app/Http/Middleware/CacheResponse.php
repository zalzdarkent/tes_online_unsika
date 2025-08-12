<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class CacheResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  int  $minutes
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $minutes = 5)
    {
        // Skip cache untuk POST, PUT, DELETE, PATCH
        if (!$request->isMethod('GET')) {
            return $next($request);
        }

        // Skip cache jika ada parameter khusus
        if ($request->has('no_cache') || $request->has('refresh')) {
            return $next($request);
        }

        $userId = Auth::id();
        $cacheKey = $this->generateCacheKey($request, $userId);

        // Ambil dari cache jika ada
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);

            return response($cachedResponse['content'])
                ->withHeaders($cachedResponse['headers'])
                ->header('X-Cache-Status', 'HIT');
        }

        // Proses request dan cache responsenya
        $response = $next($request);

        // Hanya cache response yang sukses
        if ($response->getStatusCode() === 200) {
            $cacheData = [
                'content' => $response->getContent(),
                'headers' => $response->headers->all()
            ];

            Cache::put($cacheKey, $cacheData, $minutes * 60);

            $response->header('X-Cache-Status', 'MISS');
        }

        return $response;
    }

    /**
     * Generate cache key berdasarkan request dan user
     */
    private function generateCacheKey(Request $request, $userId)
    {
        $url = $request->url();
        $queryParams = $request->query();

        // Sort query parameters untuk konsistensi cache key
        ksort($queryParams);

        $key = 'response_cache:' . $userId . ':' . md5($url . serialize($queryParams));

        return $key;
    }
}
