import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <div className="flex items-center">
            <div className={`flex aspect-square items-center justify-center ${isCollapsed ? 'w-full' : 'size-12'}`}>
                <img src="/logo-unsika-new.png" alt="UNSIKA Logo" className="h-full w-full object-contain transition-all duration-200" />
            </div>

            {!isCollapsed && (
                <div className="ml-2 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-tight font-semibold">Online Test UNSIKA</span>
                </div>
            )}
        </div>
    );
}
