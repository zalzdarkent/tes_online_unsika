# Role-Based Authorization Middleware

## Overview

Middleware untuk mengatur akses berdasarkan role user dengan 3 tingkatan:
- **admin**: Akses penuh ke semua fitur
- **teacher**: Akses ke fitur pengajaran (hampir sama dengan admin)
- **peserta**: Akses terbatas hanya ke dashboard

## Penggunaan Middleware

### Di Routes (routes/web.php)

```php
// Route yang bisa diakses admin dan teacher
Route::middleware(['role:admin,teacher'])->group(function () {
    Route::get('jadwal', function () {
        return Inertia::render('jadwal');
    })->name('jadwal');
    
    Route::get('koreksi', function () {
        return Inertia::render('koreksi');
    })->name('koreksi');
});

// Route yang hanya bisa diakses admin
Route::middleware(['role:admin'])->group(function () {
    Route::get('admin', function () {
        return Inertia::render('admin-panel');
    })->name('admin');
});

// Route untuk single role
Route::get('teacher-only', function () {
    return Inertia::render('teacher-page');
})->middleware('role:teacher');
```

### Di Frontend (Sidebar/Menu)

Gunakan helper functions di `@/lib/auth-utils`:

```tsx
import { isAdmin, isTeacher, isPeserta, canAccessAdminFeatures, filterMenuByRole } from '@/lib/auth-utils';
import { usePage } from '@inertiajs/react';

const menuItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        // No roles = accessible by all
    },
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
        icon: Calendar,
        roles: ['admin', 'teacher'], // Only admin and teacher
    },
    {
        title: 'Admin Panel',
        href: '/admin',
        icon: Settings,
        roles: ['admin'], // Only admin
    },
];

export function MyComponent() {
    const page = usePage<SharedData>();
    const user = page.props.auth.user;
    
    // Filter menu berdasarkan role
    const filteredMenuItems = filterMenuByRole(menuItems, user);
    
    // Check role manually
    if (isAdmin(user)) {
        // Admin specific code
    }
    
    if (canAccessAdminFeatures(user)) {
        // Code for admin or teacher
    }
}
```

## Helper Functions

### Role Checking
- `isAdmin(user)` - Check if user is admin
- `isTeacher(user)` - Check if user is teacher  
- `isPeserta(user)` - Check if user is peserta
- `canAccessAdminFeatures(user)` - Check if user is admin or teacher
- `hasRole(user, roles)` - Check if user has specific role(s)

### Menu Filtering
- `filterMenuByRole(menuItems, user)` - Filter menu items based on user role

## Structure

### Middleware: `app/Http/Middleware/RoleMiddleware.php`
- Handles route-level authorization
- Registered as 'role' alias in bootstrap/app.php
- Redirects unauthorized users to dashboard with error message

### Frontend Helpers: `resources/js/lib/auth-utils.ts`
- Type-safe role checking functions
- Menu filtering utilities
- Works with TypeScript interfaces

### Types: `resources/js/types/index.d.ts`
- User interface with role: 'admin' | 'teacher' | 'peserta'
- NavItem interface with optional roles property

## User Roles

### Admin
- Full access to all features
- Can access: Dashboard, Jadwal Tes, Koreksi Peserta, Admin Panel
- Can manage users, system configuration, etc.

### Teacher
- Access to teaching features
- Can access: Dashboard, Jadwal Tes, Koreksi Peserta
- Cannot access: Admin Panel

### Peserta
- Limited access
- Can access: Dashboard only
- Cannot see menu items for admin/teacher features

## Security Notes

1. **Double Protection**: Both middleware (server-side) and frontend filtering (UX)
2. **Default Behavior**: If no roles specified, accessible by all authenticated users
3. **Graceful Fallback**: Unauthorized access redirects to dashboard with error message
4. **Type Safety**: TypeScript ensures role values are correct

## Database Schema

Users table has role enum:
```sql
ENUM('admin', 'teacher', 'peserta')
```

Sample users from seeder:
- admin/admin123 (admin)
- jajam/jajam123 (admin)  
- alif/alif123 (teacher)
- peserta/peserta123 (peserta)
- jojo/jojo123 (peserta)
