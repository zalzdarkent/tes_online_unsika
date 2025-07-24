import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import axios from 'axios';

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

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
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
