<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Inertia\Inertia;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle 404 errors specifically for web requests
        if ($e instanceof NotFoundHttpException && !$request->is('api/*') && $request->expectsJson() === false) {
            return Inertia::render('errors/404')
                ->toResponse($request)
                ->setStatusCode(404);
        }

        // Handle other HTTP exceptions
        if ($e instanceof HttpException && !$request->is('api/*') && $request->expectsJson() === false) {
            $status = $e->getStatusCode();

            switch ($status) {
                case 403:
                    return Inertia::render('errors/403')
                        ->toResponse($request)
                        ->setStatusCode(403);
                case 500:
                    return Inertia::render('errors/500')
                        ->toResponse($request)
                        ->setStatusCode(500);
                case 503:
                    return Inertia::render('errors/503')
                        ->toResponse($request)
                        ->setStatusCode(503);
            }
        }

        return parent::render($request, $e);
    }
}
