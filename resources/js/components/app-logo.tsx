export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-12 items-center justify-center">
                <img
                    src="/log-unsika.png"
                    alt="UNSIKA Logo"
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Tes Online UNSIKA</span>
            </div>
        </>
    );
}
