# Dokumentasi Anti-Screenshot Implementation

## Overview

Implementasi fitur anti-screenshot untuk sistem tes online guna mencegah peserta mengambil screenshot soal tes. Fitur ini menggunakan kombinasi teknik CSS, JavaScript, dan monitoring aktivitas browser.

## Fitur Yang Diimplementasikan

### 1. **Deteksi Kombinasi Tombol Screenshot**
- Windows: Print Screen, Win+Print Screen, Win+Shift+S, Alt+Print Screen
- Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
- Developer Tools: F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J

### 2. **CSS Protection**
- Mencegah text selection (`user-select: none`)
- Mencegah drag and drop
- Mencegah right-click context menu
- Print media protection
- Mobile touch protection

### 3. **Browser Activity Monitoring**
- Tab visibility changes
- Window focus/blur events
- Suspicious window resize detection
- Print media query detection

### 4. **Pelanggaran Tracking**
- Sistem 3 strike (3 kali pelanggaran = tes dihentikan)
- Toast notification untuk setiap pelanggaran
- Automatic test submission saat mencapai batas maksimal
- Logging aktivitas pelanggaran

## File Structure

```
resources/
├── css/
│   └── anti-screenshot.css          # CSS protection rules
├── js/
│   ├── components/
│   │   └── anti-screenshot.tsx      # React component untuk deteksi
│   └── pages/peserta/soal/
│       └── index.tsx               # Implementasi di halaman soal
```

## Implementasi

### 1. CSS Protection (`anti-screenshot.css`)

```css
/* Mencegah screenshot dengan CSS */
@media print {
    body * {
        visibility: hidden !important;
    }
    body::before {
        content: "Screenshot dan Print tidak diperbolehkan" !important;
        /* ... styling ... */
    }
}

/* Mencegah select text dan drag */
.anti-screenshot {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
    -webkit-tap-highlight-color: transparent !important;
}
```

### 2. React Component (`anti-screenshot.tsx`)

Komponen ini mendeteksi:
- Kombinasi keyboard shortcuts
- Context menu (right-click)
- Window focus changes
- Print media queries
- Window resize yang mencurigakan

```tsx
export default function AntiScreenshot({ 
    onScreenshotDetected, 
    isActive = true 
}: AntiScreenshotProps) {
    // Implementation details...
}
```

### 3. Integration (`index.tsx`)

```tsx
// Import component
import AntiScreenshot from '@/components/anti-screenshot';

// Implementasi dalam komponen soal
<AntiScreenshot 
    onScreenshotDetected={handleScreenshotDetected}
    isActive={true}
/>

// Container dengan CSS protection
<div className="flex min-h-screen anti-screenshot no-copy content-protection">
    {/* Konten soal */}
</div>
```

## Event Handlers

### `handleScreenshotDetected()`
- Increment counter pelanggaran
- Tampilkan toast warning untuk pelanggaran 1-2
- Auto-submit tes untuk pelanggaran ke-3
- Redirect ke halaman daftar tes
- Log aktivitas ke console

### Submission Reasons
- `manual`: Submit manual oleh peserta
- `tab_switch`: Submit karena keluar dari tab
- `time_up`: Submit karena waktu habis
- `screenshot_violation`: Submit karena pelanggaran screenshot

## CSS Classes Yang Digunakan

| Class | Function |
|-------|----------|
| `.anti-screenshot` | Main protection class |
| `.no-copy` | Mencegah copy-paste |
| `.content-protection` | Overlay protection |
| `.screenshot-blur` | Blur effect saat terdeteksi |
| `.anti-screenshot-watermark` | Watermark identification |

## Browser Support

### Desktop
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Mobile
- ✅ Chrome Mobile
- ✅ Safari Mobile
- ✅ Samsung Internet
- ⚠️ Firefox Mobile (limited)

## Limitations

### Teknis
1. **Tidak 100% fool-proof** - Masih bisa dibypass dengan tools advanced
2. **External camera** - Tidak bisa mencegah foto dengan kamera fisik
3. **Browser extensions** - Bisa dibypass dengan extension tertentu
4. **Mobile screenshot** - Deteksi terbatas pada beberapa device

### User Experience
1. **Accessibility** - Bisa mengganggu screen reader
2. **Legitimate use** - Bisa block aktivitas normal user
3. **False positives** - Bisa trigger detection tanpa intent screenshot

## Monitoring & Logging

### Console Logs
```javascript
console.warn('Screenshot attempt detected at:', timestamp);
console.log('Current screenshot violations count:', count);
```

### Server Logging (Rekomendasi)
Implementasikan logging di server untuk:
- Track semua aktivitas pelanggaran
- Identifikasi pola suspicious
- Generate laporan compliance
- Audit trail

## Security Best Practices

### 1. **Multi-layer Protection**
- CSS + JavaScript + Server-side validation
- Kombinasikan dengan proctoring tools
- Implement session monitoring

### 2. **Server-side Validation**
```php
// Laravel Controller
public function submitTest(Request $request) {
    $reason = $request->input('reason');
    
    if ($reason === 'screenshot_violation') {
        // Log violation
        // Flag submission for review
        // Notify administrators
    }
}
```

### 3. **Additional Measures**
- Implementasi time-based tokens
- IP address tracking
- Browser fingerprinting
- Webcam monitoring (jika diizinkan)

## Configuration

### Enable/Disable Protection
```tsx
<AntiScreenshot 
    onScreenshotDetected={handleScreenshotDetected}
    isActive={isTestActive && !isDebugMode}
/>
```

### Violation Threshold
```tsx
const MAX_VIOLATIONS = 3; // Configurable
```

### Watermark Customization
```css
.anti-screenshot-watermark::after {
    content: attr(data-watermark);
    /* Customize appearance */
}
```

## Testing

### Manual Testing
1. Coba kombinasi keyboard shortcuts
2. Test right-click menu
3. Test tab switching
4. Test print function
5. Test pada berbagai browser dan device

### Automated Testing
```javascript
// Jest test example
describe('AntiScreenshot', () => {
    test('should detect print screen key', () => {
        // Test implementation
    });
});
```

## Future Enhancements

### Planned Features
1. **AI-based detection** - Machine learning untuk detect patterns
2. **Behavioral analysis** - Track mouse/keyboard patterns
3. **Real-time proctoring** - Integrate dengan webcam
4. **Advanced watermarking** - Dynamic watermarks
5. **Server-side analytics** - Dashboard untuk monitoring

### Integration Ideas
1. **LMS Integration** - Connect dengan learning management systems
2. **Proctoring Services** - Integrate dengan ProctorU, Honorlock, etc.
3. **Biometric Authentication** - Facial recognition, fingerprint
4. **Blockchain Logging** - Immutable audit trail

## Support & Maintenance

### Known Issues
- False positives pada beberapa kombinasi keyboard
- Performance impact minimal pada device lama
- Kompatibilitas dengan screen readers perlu improvement

### Updates Required
- Regular testing pada browser updates
- Adaptation untuk new screenshot methods
- Mobile detection improvements

---

**Note**: Implementasi ini adalah langkah pencegahan, bukan solusi 100% sempurna. Kombinasikan dengan metode proctoring lain untuk keamanan maksimal.
