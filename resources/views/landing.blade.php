<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Online Test UNSIKA adalah platform ujian online yang ringkas, aman, dan nyaman untuk peserta dan admin.">
        <meta name="robots" content="index,follow">
        <meta property="og:type" content="website">
        <meta property="og:title" content="Online Test UNSIKA">
        <meta property="og:description" content="Platform ujian online UNSIKA yang simpel, elegan, dan cepat diakses.">
        <meta property="og:url" content="{{ url('/') }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Online Test UNSIKA">
        <meta name="twitter:description" content="Platform ujian online UNSIKA yang simpel, elegan, dan cepat diakses.">

        <title>Online Test UNSIKA</title>

        <link rel="icon" href="/logo-unsika-new.png" sizes="any">
        <link rel="apple-touch-icon" href="/logo-unsika-new.png">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet">

        @vite(['resources/css/app.css'])
    </head>
    <body class="min-h-screen text-foreground antialiased">
        <main class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_35%)]"></div>

            <section class="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-4 lg:px-8">
                <header class="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3 backdrop-blur">
                    <div class="flex items-center gap-3">
                        <img src="/logo-unsika-new.png" alt="UNSIKA" class="h-10 w-10 rounded-xl object-contain ring-1 ring-border/70">
                        <div>
                            <p class="text-sm font-semibold leading-none">Online Test UNSIKA</p>
                            <p class="text-xs text-muted-foreground">Karya mahasiswa UNSIKA</p>
                        </div>
                    </div>

                    <nav class="hidden items-center gap-2 sm:flex">
                        <a href="{{ route('login') }}" class="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">Masuk</a>
                        <a href="{{ route('register') }}" class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">Daftar</a>
                    </nav>
                </header>

                <div class="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-12">
                    <div class="max-w-2xl">
                        <div class="mb-5 inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                            Buatan mahasiswa UNSIKA untuk ujian online
                        </div>

                        <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                            Platform ujian UNSIKA yang sederhana, elegan, dan fokus.
                        </h1>

                        <p class="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                            Dibuat oleh mahasiswa UNSIKA untuk menghadirkan proses tes yang ringan, rapi, dan nyaman dipakai peserta maupun pengelola.
                        </p>

                        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                            <a href="{{ route('login') }}" class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:opacity-95">Masuk ke Sistem</a>
                            <a href="{{ route('register') }}" class="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">Buat Akun</a>
                        </div>

                        <div class="mt-10 grid gap-3 sm:grid-cols-3">
                            <div class="rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
                                <p class="text-2xl font-semibold">Mahasiswa</p>
                                <p class="mt-1 text-sm text-muted-foreground">Dibuat sebagai karya internal UNSIKA.</p>
                            </div>
                            <div class="rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
                                <p class="text-2xl font-semibold">{{ number_format($userCount, 0, ',', '.') }}</p>
                                <p class="mt-1 text-sm text-muted-foreground">Pengguna yang sudah merasakan manfaatnya.</p>
                            </div>
                            <div class="rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
                                <p class="text-2xl font-semibold">Sederhana</p>
                                <p class="mt-1 text-sm text-muted-foreground">Tampilan bersih, jelas, dan enak dilihat.</p>
                            </div>
                        </div>
                    </div>

                    <div class="relative">
                        <div class="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl"></div>
                        <div class="relative rounded-[2rem] border border-border bg-card/90 p-6 shadow-2xl shadow-black/10 backdrop-blur">
                            <div class="flex items-center justify-between border-b border-border pb-4">
                                <div>
                                    <p class="text-sm font-medium text-muted-foreground">Dashboard Preview</p>
                                    <p class="mt-1 text-lg font-semibold">Alur ujian terpusat</p>
                                </div>
                                <div class="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">Live</div>
                            </div>

                            <div class="mt-5 space-y-4">
                                <div class="rounded-xl border border-border bg-background p-4">
                                    <div class="flex items-center justify-between gap-3">
                                        <div>
                                            <p class="font-medium">Pendaftaran tes</p>
                                            <p class="text-sm text-muted-foreground">Daftar dan mulai dengan alur yang jelas.</p>
                                        </div>
                                        <div class="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">01</div>
                                    </div>
                                </div>
                                <div class="rounded-xl border border-border bg-background p-4">
                                    <div class="flex items-center justify-between gap-3">
                                        <div>
                                            <p class="font-medium">Pengerjaan soal</p>
                                            <p class="text-sm text-muted-foreground">Interface fokus tanpa distraksi.</p>
                                        </div>
                                        <div class="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">02</div>
                                    </div>
                                </div>
                                <div class="rounded-xl border border-border bg-background p-4">
                                    <div class="flex items-center justify-between gap-3">
                                        <div>
                                            <p class="font-medium">Koreksi & rekap</p>
                                            <p class="text-sm text-muted-foreground">Semua data terkumpul dalam satu tempat.</p>
                                        </div>
                                        <div class="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">03</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </body>
</html>