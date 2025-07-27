import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { router } from "@inertiajs/react";
import { ReactNode, useState } from "react";
import { useForm } from "@inertiajs/react";

interface KategoriFormModalProps {
    mode: "create" | "edit";
    trigger: ReactNode;
    kategori?: {
        id: number;
        nama: string;
    };
    onSuccess?: () => void;
}

export default function KategoriFormModal({ mode, trigger, kategori, onSuccess }: KategoriFormModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const { data, setData, processing, errors, reset } = useForm({
        nama: kategori?.nama || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitHandler = mode === "create"
            ? () => router.post(route("kategori.store"), data)
            : () => router.put(route("kategori.update", kategori?.id), data);

        submitHandler();

        router.on('success', () => {
            setIsOpen(false);
            reset();
            if (onSuccess) onSuccess();
            toast({
                title: "Berhasil",
                description: `Kategori berhasil ${mode === "create" ? "ditambahkan" : "diperbarui"}`,
            });
        });

        router.on('error', (event: { detail: { errors: { nama?: string } } }) => {
            const errors = event.detail.errors;
            toast({
                variant: "destructive",
                title: "Gagal",
                description: errors?.nama || `Gagal ${mode === "create" ? "menambahkan" : "memperbarui"} kategori`,
            });
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {/* Trigger button/element */}
            <div onClick={() => setIsOpen(true)}>{trigger}</div>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Tambah Kategori Baru" : "Edit Kategori"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Tambahkan kategori baru untuk tes."
                            : "Ubah informasi kategori yang sudah ada."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Kategori</Label>
                        <Input
                            id="nama"
                            type="text"
                            placeholder="Masukkan nama kategori"
                            value={data.nama}
                            onChange={e => setData('nama', e.target.value)}
                        />
                        {errors.nama && (
                            <p className="text-sm text-destructive">{errors.nama}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => {
                                setIsOpen(false);
                                reset();
                            }}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="cursor-pointer">
                            {processing ? "Menyimpan..." : (mode === "create" ? "Simpan" : "Perbarui")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
