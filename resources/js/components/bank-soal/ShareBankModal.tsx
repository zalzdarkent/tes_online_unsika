import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareBankModalProps {
    open: boolean;
    onClose: () => void;
}

interface ShareUser {
    id: number;
    owner_id: number;
    grantee_id: number;
    can_view: boolean;
    can_copy: boolean;
    grantee: {
        id: number;
        name: string;
        email: string;
    };
}

export default function ShareBankModal({ open, onClose }: ShareBankModalProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [canCopy, setCanCopy] = useState(true);
    const [loading, setLoading] = useState(false);
    const [shares, setShares] = useState<ShareUser[]>([]);

    const fetchShares = async () => {
        try {
            const response = await fetch('/bank-soal/share-list');
            const data = await response.json();
            setShares(data);
        } catch (error) {
            console.error('Failed to fetch shares', error);
        }
    };

    useEffect(() => {
        if (open) {
            fetchShares();
        }
    }, [open]);

    const handleShare = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.post(
            '/bank-soal/share',
            { email, can_copy: canCopy },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil',
                        description: 'Akses bank soal berhasil dibagikan',
                    });
                    setEmail('');
                    fetchShares();
                    setLoading(false);
                },
                onError: (errors) => {
                    toast({
                        variant: 'destructive',
                        title: 'Gagal',
                        description: errors.email || 'Terjadi kesalahan',
                    });
                    setLoading(false);
                },
            }
        );
    };

    const handleUnshare = (userId: number) => {
        if (!confirm('Apakah Anda yakin ingin mencabut akses user ini?')) return;

        router.delete(`/bank-soal/unshare/${userId}`, {
            onSuccess: () => {
                toast({
                    title: 'Berhasil',
                    description: 'Akses berhasil dicabut',
                });
                fetchShares();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bagikan Bank Soal</DialogTitle>
                    <DialogDescription>
                        Berikan akses bank soal Anda kepada user lain. Mereka akan bisa melihat dan menyalin soal Anda.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleShare} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email User</Label>
                        <div className="flex gap-2">
                            <Input
                                id="email"
                                placeholder="user@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Button type="submit" disabled={loading}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Bagikan
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="can-copy" checked={canCopy} onCheckedChange={setCanCopy} />
                        <Label htmlFor="can-copy">Izinkan menyalin soal</Label>
                    </div>
                </form>

                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Akses Diberikan Ke:</h4>
                    {shares.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada user yang diberi akses.</p>
                    ) : (
                        <div className="space-y-2">
                            {shares.map((share) => (
                                <div key={share.id} className="flex items-center justify-between rounded-lg border p-2">
                                    <div>
                                        <div className="font-medium">{share.grantee.name}</div>
                                        <div className="text-xs text-gray-500">{share.grantee.email}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => handleUnshare(share.grantee_id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
