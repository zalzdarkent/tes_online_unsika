import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppearance, type ThemeAccent } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type ThemeAccentOption = {
    value: ThemeAccent;
    label: string;
    description: string;
    primary: string;
    accent: string;
    ring: string;
};

const themeAccentOptions: ThemeAccentOption[] = [
    {
        value: 'default',
        label: 'Netral',
        description: 'Mengikuti warna standar aplikasi tanpa aksen khusus.',
        primary: '#111827',
        accent: '#e5e7eb',
        ring: '#9ca3af',
    },
    {
        value: 'maroon',
        label: 'Maroon',
        description: 'Merah gelap yang lebih formal dan tegas.',
        primary: '#7f1d1d',
        accent: '#fca5a5',
        ring: '#dc2626',
    },
    {
        value: 'violet',
        label: 'Ungu',
        description: 'Tone ungu yang modern dan sedikit berani.',
        primary: '#6d28d9',
        accent: '#c084fc',
        ring: '#8b5cf6',
    },
    {
        value: 'navy',
        label: 'Biru Donker',
        description: 'Biru gelap yang cocok untuk tampilan yang tenang.',
        primary: '#1e3a8a',
        accent: '#7dd3fc',
        ring: '#2563eb',
    },
    {
        value: 'blue',
        label: 'Biru',
        description: 'Warna biru klasik yang bersih dan familiar.',
        primary: '#1d4ed8',
        accent: '#93c5fd',
        ring: '#3b82f6',
    },
    {
        value: 'emerald',
        label: 'Hijau',
        description: 'Hijau segar untuk nuansa yang lebih hidup.',
        primary: '#047857',
        accent: '#6ee7b7',
        ring: '#10b981',
    },
];

export default function ThemeAccentPicker() {
    const { themeAccent, updateThemeAccent } = useAppearance();

    return (
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                    <CardTitle>Warna Aksen</CardTitle>
                    <Badge variant="secondary" className="rounded-full border-border/60 bg-muted/80 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Beta
                    </Badge>
                </div>
                <CardDescription>Pilih satu warna utama yang akan dipakai tombol, hover, toggle, dan state aktif di seluruh aplikasi.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {themeAccentOptions.map((option) => {
                        const isActive = themeAccent === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateThemeAccent(option.value)}
                                aria-pressed={isActive}
                                className={cn(
                                    'group rounded-2xl border p-4 text-left transition-all outline-none',
                                    isActive
                                        ? 'border-ring shadow-md ring-2 ring-ring/25'
                                        : 'border-border/70 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm',
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{option.label}</div>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                                    </div>
                                    {isActive ? <Check className="mt-0.5 h-4 w-4 text-primary" /> : null}
                                </div>

                                <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background">
                                    <div className="flex h-10" style={{ backgroundImage: `linear-gradient(135deg, ${option.primary} 0%, ${option.accent} 100%)` }} />
                                    <div className="grid grid-cols-3 gap-2 p-3">
                                        <div className="h-3 rounded-full" style={{ backgroundColor: option.primary }} />
                                        <div className="h-3 rounded-full" style={{ backgroundColor: option.accent }} />
                                        <div className="h-3 rounded-full" style={{ backgroundColor: option.ring }} />
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Button & active</span>
                                    <span>Hover & focus</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}