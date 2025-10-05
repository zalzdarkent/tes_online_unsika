# Solusi Cloudflare Session Keep-Alive

## Masalah
Setelah implementasi Cloudflare di production, user sering mengalami verification berulang kali meskipun hanya diam beberapa menit dan mengakses menu. Ini sangat mengganggu terutama untuk peserta yang sedang mengerjakan tes.

## Penyebab Masalah
1. **Session Timeout**: Session Laravel default hanya 2 jam dan Cloudflare memiliki mekanisme challenge yang dapat memutus session
2. **Cloudflare Challenge**: Cloudflare melakukan challenge berkala terutama untuk user yang tidak aktif
3. **Browser Tab Switching**: Ketika user switch tab, session bisa dianggap inactive
4. **Network Latency**: Delay network bisa menyebabkan session timeout lebih cepat

## Solusi yang Diimplementasikan

### 1. Session Keep-Alive Hook (`useSessionKeepAlive`)
Hook React yang mengirim ping berkala ke server untuk menjaga session tetap aktif.

**Fitur:**
- Ping otomatis setiap 5 menit (default) atau interval yang dapat dikustomisasi
- Ping saat tab menjadi visible kembali
- Ping saat user tidak aktif lebih dari 2 menit
- Error handling dan retry mechanism
- Manual ping function

**Lokasi:** `resources/js/hooks/use-session-keepalive.ts`

### 2. Session Keep-Alive Controller
Controller backend untuk menangani ping requests dari frontend.

**Fitur:**
- Validasi authentication
- Update user activity timestamp
- Regenerate session untuk extend lifetime
- Logging untuk debugging
- Error handling

**Lokasi:** `app/Http/Controllers/SessionKeepAliveController.php`

**Endpoints:**
- `POST /keep-alive` - Ping keep-alive
- `GET /session-info` - Informasi session (debugging)
- `GET /session-test` - Test session active

### 3. Session Manager Component
Komponen React global untuk mengelola session keep-alive di seluruh aplikasi.

**Fitur:**
- Automatic integration dengan semua halaman
- Status indicator (hanya di development)
- Adaptive interval berdasarkan context (2 menit untuk halaman tes, 5 menit untuk lainnya)
- Manual ping button
- Connection status monitoring

**Lokasi:** `resources/js/components/session-manager.tsx`

### 4. Cloudflare Session Optimizer Middleware
Middleware untuk mengoptimalkan konfigurasi session khusus production dengan Cloudflare.

**Fitur:**
- Extend session lifetime menjadi 16 jam
- Optimize cookie settings untuk Cloudflare
- Set proper caching headers
- Cloudflare-specific optimizations

**Lokasi:** `app/Http/Middleware/CloudflareSessionOptimizer.php`

### 5. Enhanced Session Configuration
Konfigurasi session yang sudah dioptimalkan:

```php
// config/session.php
'lifetime' => (int) env('SESSION_LIFETIME', 480), // 8 hours instead of 2
'expire_on_close' => false,
'secure' => env('SESSION_SECURE_COOKIE'),
'http_only' => true,
'same_site' => 'lax',
```

## Implementasi di Production

### 1. Environment Variables
Tambahkan ke `.env` production:

```env
SESSION_LIFETIME=960  # 16 jam
SESSION_SECURE_COOKIE=true  # Karena HTTPS
SESSION_DOMAIN=.unsika.ac.id  # Domain wildcard
```

### 2. Nginx Configuration
Pastikan nginx pass headers Cloudflare:

```nginx
# Pass Cloudflare headers
proxy_set_header CF-RAY $http_cf_ray;
proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
proxy_set_header CF-IPCountry $http_cf_ipcountry;
```

### 3. Database Session Table
Pastikan table sessions sudah ada dan optimal:

```sql
-- Index untuk performance
CREATE INDEX sessions_user_id_index ON sessions(user_id);
CREATE INDEX sessions_last_activity_index ON sessions(last_activity);
```

## Cara Kerja

### 1. Normal Flow
1. User login → Session dibuat dengan lifetime 16 jam
2. SessionManager aktif di background
3. Setiap 5 menit (atau sesuai interval), ping keep-alive dikirim
4. Server update user activity dan regenerate session
5. Session tetap aktif, Cloudflare tidak challenge lagi

### 2. Test Page Flow
1. User masuk halaman tes → Interval ping lebih agresif (90 detik)
2. Hook khusus untuk halaman tes aktif
3. Ping saat user inactive, tab switch, dll
4. Session dijaga ketat untuk mencegah gangguan saat tes

### 3. Error Handling
1. Ping gagal → Retry otomatis
2. Session expired → Redirect ke login
3. Network error → Manual ping tersedia

## Monitoring & Debugging

### 1. Development Mode
- Session status indicator di pojok kanan bawah
- Console logs untuk semua ping activity
- Manual ping button untuk testing

### 2. Production Logs
```php
// Log keep-alive activity (hanya di local)
Log::info('Session keep-alive ping', [
    'user_id' => $user->id,
    'timestamp' => $timestamp,
    'session_id' => Session::getId()
]);
```

### 3. Debug Endpoints
- `/session-info` - Cek informasi session
- `/session-test` - Test apakah session aktif

## Testing

### 1. Manual Testing
```javascript
// Di console browser
fetch('/keep-alive', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify({
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        page_url: window.location.href
    })
});
```

### 2. Load Testing
Test dengan multiple users dan observe session persistence.

## Konfigurasi Interval Berdasarkan Context

| Context | Interval | Keterangan |
|---------|----------|------------|
| Halaman Tes | 90 detik | Sangat agresif untuk mencegah gangguan |
| User Peserta | 3 menit | Lebih sering karena mereka yang paling terdampak |
| Admin/Teacher | 5 menit | Interval normal |
| Development | Manual control | Dengan status indicator |

## Performa Impact

- **Network**: ~1 request per interval (very minimal)
- **Server**: Lightweight ping, update timestamp only
- **Database**: 1 UPDATE query per ping
- **User Experience**: Seamless, no more Cloudflare challenges

## Fallback Strategies

1. **Manual Ping**: User bisa manual ping jika ada masalah
2. **Error Recovery**: Auto-retry pada error
3. **Session Info**: Debug endpoint untuk troubleshooting
4. **Graceful Degradation**: Aplikasi tetap berfungsi tanpa keep-alive

## Maintenance

### 1. Session Cleanup
Jalankan regular cleanup untuk expired sessions:

```php
// Di cron job atau scheduler
DB::table('sessions')
    ->where('last_activity', '<', now()->subHours(24)->timestamp)
    ->delete();
```

### 2. Monitoring Logs
Monitor logs untuk anomali:
- High error rate pada keep-alive
- Session timeout yang tidak normal
- Cloudflare challenge yang masih sering

### 3. Performance Optimization
- Monitor database performance untuk table sessions
- Adjust interval berdasarkan server load
- Review Cloudflare settings jika masih ada issues

## Kesimpulan

Dengan implementasi Session Keep-Alive ini, masalah Cloudflare verification berulang seharusnya teratasi. User bisa diam beberapa menit atau switch menu tanpa harus verify lagi. Sistem ini sangat penting untuk UX peserta saat mengerjakan tes.

Key benefits:
- ✅ No more frequent Cloudflare challenges
- ✅ Seamless user experience
- ✅ Tes dapat berjalan tanpa gangguan
- ✅ Automatic dengan fallback manual
- ✅ Production-ready dengan monitoring
