import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Eye } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface ViolationData {
    id: number;
    peserta_id: number;
    peserta_name: string;
    peserta_email: string;
    violation_type: string;
    detection_method: string;
    violation_time: string;
    ip_address: string;
    browser_info: {
        userAgent: string;
        screenWidth: number;
        screenHeight: number;
        windowWidth: number;
        windowHeight: number;
        language: string;
        platform: string;
    };
}

interface ViolationSummary {
    total_violations: number;
    unique_violators: number;
    violation_types: Record<string, number>;
    recent_violations: ViolationData[];
}

interface ViolationAlertProps {
    jadwalId: number;
    pesertaId?: number;
    compact?: boolean;
}

export default function ViolationAlert({ jadwalId, pesertaId, compact = false }: ViolationAlertProps) {
    const [violations, setViolations] = useState<ViolationData[]>([]);
    const [summary, setSummary] = useState<ViolationSummary | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadViolations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('jadwal.peserta.violations', jadwalId));
            const data = await response.json();

            if (data.success) {
                let filteredViolations = data.violations;
                if (pesertaId) {
                    // Filter violations for specific peserta if pesertaId provided
                    filteredViolations = data.violations.filter((v: ViolationData) => v.peserta_id === pesertaId);
                }
                setViolations(filteredViolations);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to load violations:', error);
        } finally {
            setIsLoading(false);
        }
    }, [jadwalId, pesertaId]);

    // Auto-load data on component mount
    useEffect(() => {
        loadViolations();
    }, [loadViolations]);

    const formatViolationType = (type: string): string => {
        const typeMap: Record<string, string> = {
            'snipping_tool': 'Snipping Tool',
            'screenshot_key_combination': 'Screenshot Shortcut',
            'developer_tools': 'Developer Tools',
            'print_screen': 'Print Screen',
            'window_focus_change': 'Window Switch',
            'print_media': 'Print Mode',
        };
        return typeMap[type] || type;
    };

    const formatDetectionMethod = (method: string): string => {
        const methodMap: Record<string, string> = {
            'windows_s': 'Windows + S',
            'windows_shift_s': 'Windows + Shift + S',
            'f12_key': 'F12 Key',
            'printscreen_key': 'Print Screen Key',
            'ctrl_shift_i': 'Ctrl + Shift + I',
            'blur_detection': 'Window Focus Lost',
            'print_screen': 'Print Screen Mode',
        };
        return methodMap[method] || method;
    };

    const getViolationSeverity = (type: string): 'default' | 'secondary' | 'destructive' => {
        const highRisk = ['snipping_tool', 'screenshot_key_combination', 'print_screen'];
        const mediumRisk = ['developer_tools'];

        if (highRisk.includes(type)) return 'destructive';
        if (mediumRisk.includes(type)) return 'secondary';
        return 'default';
    };

    if (compact) {
        // For compact mode, check if there are violations for this specific peserta
        const pesertaViolations = pesertaId ? violations.filter(v => v.peserta_id === pesertaId) : violations;

        if (pesertaViolations.length > 0) {
            return (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={loadViolations}
                        >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {pesertaViolations.length} Pelanggaran
                        </Button>
                    </DialogTrigger>
                    <ViolationDialog
                        violations={pesertaViolations}
                        summary={summary}
                        isLoading={isLoading}
                        formatViolationType={formatViolationType}
                        formatDetectionMethod={formatDetectionMethod}
                        getViolationSeverity={getViolationSeverity}
                    />
                </Dialog>
            );
        } else {
            return <span className="text-xs text-muted-foreground">Tidak ada</span>;
        }
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadViolations}
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Pelanggaran
                </Button>
            </DialogTrigger>
            <ViolationDialog
                violations={violations}
                summary={summary}
                isLoading={isLoading}
                formatViolationType={formatViolationType}
                formatDetectionMethod={formatDetectionMethod}
                getViolationSeverity={getViolationSeverity}
            />
        </Dialog>
    );
}

interface ViolationDialogProps {
    violations: ViolationData[];
    summary: ViolationSummary | null;
    isLoading: boolean;
    formatViolationType: (type: string) => string;
    formatDetectionMethod: (method: string) => string;
    getViolationSeverity: (type: string) => 'default' | 'secondary' | 'destructive';
}

function ViolationDialog({
    violations,
    summary,
    isLoading,
    formatViolationType,
    formatDetectionMethod,
    getViolationSeverity
}: ViolationDialogProps) {
    return (
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Laporan Pelanggaran Screenshot
                </DialogTitle>
            </DialogHeader>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{summary.total_violations}</div>
                                <div className="text-sm text-red-600">Total Pelanggaran</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">{summary.unique_violators}</div>
                                <div className="text-sm text-orange-600">Peserta Pelanggar</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {Object.keys(summary.violation_types).length}
                                </div>
                                <div className="text-sm text-blue-600">Jenis Pelanggaran</div>
                            </div>
                        </div>
                    )}

                    {violations.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                Tidak ada pelanggaran screenshot yang terdeteksi untuk jadwal ini.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="font-semibold">Riwayat Pelanggaran</h3>
                            {violations.map((violation) => (
                                <div
                                    key={violation.id}
                                    className="border rounded-lg p-4 bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{violation.peserta_name}</span>
                                                <Badge variant={getViolationSeverity(violation.violation_type)}>
                                                    {formatViolationType(violation.violation_type)}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <div>Email: {violation.peserta_email}</div>
                                                <div>Metode: {formatDetectionMethod(violation.detection_method)}</div>
                                                <div>Waktu: {new Date(violation.violation_time).toLocaleString('id-ID')}</div>
                                                <div>IP Address: {violation.ip_address}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Platform: {violation.browser_info.platform} |
                                                Browser: {violation.browser_info.userAgent.split(' ')[0]} |
                                                Screen: {violation.browser_info.screenWidth}x{violation.browser_info.screenHeight}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </DialogContent>
    );
}
