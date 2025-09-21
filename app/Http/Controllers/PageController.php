<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function notfound()
    {
        return Inertia::render('errors/404')
            ->toResponse(request())
            ->setStatusCode(404);
    }
}
