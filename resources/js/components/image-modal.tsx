import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface ImageModalProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    // Reset posisi dan zoom saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev * 1.2, 5));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev / 1.2, 0.5));
    }, []);

    const handleReset = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    }, [scale, position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, scale, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    }, [handleZoomIn, handleZoomOut]);

    const handleDownload = useCallback(() => {
        const link = document.createElement('a');
        link.href = src;
        link.download = alt || 'gambar-soal';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [src, alt]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    handleReset();
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                {/* Header dengan controls */}
                <div className="flex items-center justify-between p-4 pr-12 border-b bg-background">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Gambar Soal</span>
                        <span className="text-xs text-muted-foreground">
                            {Math.round(scale * 100)}%
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            title="Download gambar"
                        >
                            <Download className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-border mx-1"></div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={scale <= 0.5}
                            title="Zoom out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={scale >= 5}
                            title="Zoom in"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            title="Reset zoom dan posisi"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Image container */}
                <div
                    className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative"
                    style={{ height: 'calc(95vh - 80px)' }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center overflow-hidden"
                        onWheel={handleWheel}
                    >
                        <img
                            ref={imageRef}
                            src={src}
                            alt={alt}
                            className={`max-w-none transition-transform duration-200 ${
                                scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'
                            } ${isDragging ? 'cursor-grabbing' : ''}`}
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: 'center center'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            draggable={false}
                        />
                    </div>

                    {/* Instructions overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/70 text-white text-xs p-2 rounded">
                            <div className="flex flex-wrap gap-4">
                                <span>🖱️ Scroll: Zoom</span>
                                <span>⌨️ +/-: Zoom</span>
                                <span>⌨️ R: Reset</span>
                                <span>⌨️ ESC: Tutup</span>
                                {scale > 1 && <span>🖱️ Drag: Geser gambar</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
