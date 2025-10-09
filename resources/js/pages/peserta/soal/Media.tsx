import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ImageModal from '@/components/image-modal';
import { useState } from 'react';
import { Expand } from 'lucide-react';

export default function Media({ url }: { url: string }) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const ext = url.split('.').pop()?.toLowerCase();

    if (!ext) return null;

    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        const imageSrc = `/storage/${url}`;

        return (
            <div className="my-3">
                <Label className="mb-2 block text-sm font-medium">Gambar Pendukung</Label>
                <div className="relative group">
                    <img
                        src={imageSrc}
                        alt="Gambar Soal"
                        className="h-auto max-h-60 w-auto rounded-md shadow-sm md:max-w-xl cursor-pointer transition-all hover:shadow-md"
                        onClick={() => setIsImageModalOpen(true)}
                    />

                    {/* Overlay button untuk zoom */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-gray-800"
                            onClick={() => setIsImageModalOpen(true)}
                        >
                            <Expand className="h-4 w-4 mr-2" />
                            Lihat Detail
                        </Button>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                    💡 Klik gambar untuk melihat detail dan zoom
                </p>

                <ImageModal
                    src={imageSrc}
                    alt="Gambar Soal"
                    isOpen={isImageModalOpen}
                    onClose={() => setIsImageModalOpen(false)}
                />
            </div>
        );
    }

    if (['mp3', 'ogg', 'wav', 'm4a'].includes(ext)) {
        return (
            <div className="my-3">
                <Label className="mb-2 block text-sm font-medium">Audio Pendukung</Label>
                <audio controls src={`/storage/${url}`} className="w-full max-w-sm" />
            </div>
        );
    }

    return null;
}
