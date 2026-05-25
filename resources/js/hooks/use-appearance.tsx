import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';
export type ThemeAccent = 'default' | 'maroon' | 'violet' | 'navy' | 'blue' | 'emerald';

const APPEARANCE_STORAGE_KEY = 'appearance';
const THEME_ACCENT_STORAGE_KEY = 'theme-accent';

const appearances: Appearance[] = ['light', 'dark', 'system'];
const themeAccents: ThemeAccent[] = ['default', 'maroon', 'violet', 'navy', 'blue', 'emerald'];

const isAppearance = (value: string | null): value is Appearance => value !== null && appearances.includes(value as Appearance);

const isThemeAccent = (value: string | null): value is ThemeAccent => value !== null && themeAccents.includes(value as ThemeAccent);

const getSavedAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    const savedAppearance = localStorage.getItem(APPEARANCE_STORAGE_KEY);

    return isAppearance(savedAppearance) ? savedAppearance : 'system';
};

const getSavedThemeAccent = (): ThemeAccent => {
    if (typeof window === 'undefined') {
        return 'default';
    }

    const savedAccent = localStorage.getItem(THEME_ACCENT_STORAGE_KEY);

    return isThemeAccent(savedAccent) ? savedAccent : 'default';
};

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const applyThemeAccent = (accent: ThemeAccent) => {
    if (accent === 'default') {
        document.documentElement.removeAttribute('data-theme-accent');
        return;
    }

    document.documentElement.setAttribute('data-theme-accent', accent);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    applyTheme(getSavedAppearance());
};

export function initializeTheme() {
    const savedAppearance = getSavedAppearance();
    const savedThemeAccent = getSavedThemeAccent();

    applyTheme(savedAppearance);
    applyThemeAccent(savedThemeAccent);

    // Add the event listener for system theme changes...
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');
    const [themeAccent, setThemeAccent] = useState<ThemeAccent>('default');

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);

        // Store in localStorage for client-side persistence...
        localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);

        // Store in cookie for SSR...
        setCookie('appearance', mode);

        applyTheme(mode);
    }, []);

    const updateThemeAccent = useCallback((accent: ThemeAccent) => {
        setThemeAccent(accent);
        localStorage.setItem(THEME_ACCENT_STORAGE_KEY, accent);
        applyThemeAccent(accent);
    }, []);

    useEffect(() => {
        const savedAppearance = getSavedAppearance();
        const savedThemeAccent = getSavedThemeAccent();

        setAppearance(savedAppearance);
        setThemeAccent(savedThemeAccent);

        applyTheme(savedAppearance);
        applyThemeAccent(savedThemeAccent);

        const systemMediaQuery = mediaQuery();

        systemMediaQuery?.addEventListener('change', handleSystemThemeChange);

        return () => systemMediaQuery?.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance, themeAccent, updateThemeAccent } as const;
}
