import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

window.Pusher = Pusher;

// Log environment variables untuk debugging
console.log('🔧 Reverb Configuration:');
console.log('  VITE_REVERB_APP_KEY:', import.meta.env.VITE_REVERB_APP_KEY);
console.log('  VITE_REVERB_HOST:', import.meta.env.VITE_REVERB_HOST);
console.log('  VITE_REVERB_PORT:', import.meta.env.VITE_REVERB_PORT ?? 4090);
console.log('  VITE_REVERB_SCHEME:', import.meta.env.VITE_REVERB_SCHEME ?? 'http');
console.log('  forceTLS:', (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https');

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 4090,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 4090,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    encrypted: false,
});

// Monitor connection state
const pusher = (window.Echo.connector as any).pusher;

if (pusher && pusher.connection) {
    pusher.connection.bind('connecting', () => {
        console.log('🔄 Reverb: Connecting to WebSocket...');
    });

    pusher.connection.bind('connected', () => {
        console.log('✅ Reverb: Connected to WebSocket successfully!');
        console.log('   Socket ID:', pusher.connection.socket_id);
    });

    pusher.connection.bind('unavailable', () => {
        console.error('❌ Reverb: WebSocket connection unavailable');
    });

    pusher.connection.bind('failed', () => {
        console.error('❌ Reverb: WebSocket connection failed');
    });

    pusher.connection.bind('disconnected', () => {
        console.warn('⚠️ Reverb: Disconnected from WebSocket');
    });

    pusher.connection.bind('error', (error: any) => {
        console.error('❌ Reverb: Connection error:', error);
    });

    // Log initial state
    console.log('📡 Reverb: Initial connection state:', pusher.connection.state);
} else {
    console.error('❌ Reverb: Pusher connection not available');
}

export default window.Echo;
