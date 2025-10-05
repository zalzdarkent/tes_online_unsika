import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Konfigurasi axios untuk CSRF token
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token untuk axios
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    const tokenValue = token.getAttribute('content');
    axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenValue;
    console.log('CSRF token set:', tokenValue);
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Global function untuk refresh CSRF token
(window as unknown as { refreshCSRFToken: () => Promise<string | null> }).refreshCSRFToken = async (): Promise<string | null> => {
    try {
        const response = await fetch('/session-info', {
            method: 'GET',
            credentials: 'same-origin'
        });
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.csrf_token) {
                const newToken = data.data.csrf_token;

                // Update meta tag
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', newToken);
                }

                // Update axios header
                axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;

                console.log('CSRF token refreshed:', newToken);
                return newToken;
            }
        }
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
    }
    return null;
};

// eslint-disable-next-line no-constant-binary-expression
const appName = 'Online Test UNSIKA' || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
