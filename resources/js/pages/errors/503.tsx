import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Home, Settings, RefreshCw } from 'lucide-react';

export default function ServiceUnavailable() {
    const handleGoBack = () => {
        window.history.back();
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <>
            <Head title="503 - Service Unavailable" />
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl text-center space-y-8">
                    {/* 503 Number with Animation */}
                    <div className="relative">
                        <div className="text-[12rem] md:text-[16rem] font-bold text-muted/20 leading-none select-none">
                            503
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Settings className="h-24 w-24 md:h-32 md:w-32 text-destructive animate-spin" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                            Service Unavailable
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto">
                            Sistem sedang dalam maintenance atau mengalami gangguan sementara. Silakan coba lagi dalam beberapa menit.
                        </p>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <CardContent className="p-6 text-center space-y-3">
                                <RefreshCw className="h-8 w-8 text-primary mx-auto" />
                                <h3 className="font-semibold text-foreground">Coba Lagi</h3>
                                <p className="text-sm text-muted-foreground">
                                    Refresh halaman ini
                                </p>
                                <Button onClick={handleRefresh} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <CardContent className="p-6 text-center space-y-3">
                                <Home className="h-8 w-8 text-primary mx-auto" />
                                <h3 className="font-semibold text-foreground">Beranda</h3>
                                <p className="text-sm text-muted-foreground">
                                    Kembali ke halaman utama
                                </p>
                                <Button onClick={handleGoHome} variant="outline" className="w-full">
                                    <Home className="mr-2 h-4 w-4" />
                                    Beranda
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <CardContent className="p-6 text-center space-y-3">
                                <ArrowLeft className="h-8 w-8 text-primary mx-auto" />
                                <h3 className="font-semibold text-foreground">Kembali</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ke halaman sebelumnya
                                </p>
                                <Button onClick={handleGoBack} variant="outline" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Card */}
                    <Card className="mt-8">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center space-x-3 text-muted-foreground">
                                <Settings className="h-5 w-5" />
                                <span className="text-sm">
                                    Sistem akan kembali normal dalam waktu singkat
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Info */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Error Code: 503 | Sistem Tes Online UNSIKA
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-10 left-10 opacity-20">
                        <div className="w-20 h-20 bg-primary/10 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-10 right-10 opacity-20">
                        <div className="w-16 h-16 bg-secondary/20 rounded-full"></div>
                    </div>
                    <div className="absolute top-1/2 left-5 opacity-10">
                        <div className="w-12 h-12 bg-accent/30 rounded-full"></div>
                    </div>
                </div>
            </div>
        </>
    );
}
