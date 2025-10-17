# Per-Jadwal Access Control Implementation

## Overview
Implementasi sistem kontrol akses per-jadwal yang memungkinkan setiap tes memiliki pengaturan "online" atau "offline" secara individual, menggantikan pengaturan global sebelumnya.

## Features Implemented

### 1. Database Schema Changes
- **File**: `database/migrations/2025_10_17_104059_add_access_mode_to_jadwal_table.php`
- **Changes**: 
  - Added `access_mode` enum column with values 'online'/'offline'
  - Default value: 'online'

### 2. Backend Model Updates
- **File**: `app/Models/Jadwal.php`
- **Changes**: Added `access_mode` to fillable array

### 3. Controller Updates

#### JadwalController.php
- Added `access_mode` validation rules in store/update methods
- Included `access_mode` in select queries and response mapping

#### PesertaTesController.php
- Added comprehensive IP checking logic in `startTest()` method
- Added IP checking logic in `lanjutkanTes()` method
- Implemented structured error responses for frontend modal handling
- Campus IP ranges supported:
  - 103.121.197.1 - 103.121.197.254
  - 36.50.94.1 - 36.50.94.254
  - Localhost (127.0.0.1, ::1)

### 4. IP Checking Logic (public/index.php)
- Per-jadwal IP validation at application entry point
- Regex pattern matching for test URLs
- Database queries for jadwal access_mode
- Conditional IP checking based on mode

### 5. Frontend Components

#### Access Control Modal
- **File**: `resources/js/components/modal/AccessDeniedModal.tsx`
- **Features**:
  - Elegant ShadCN UI-based modal design
  - Clear error messaging with test details
  - IP address display with copy functionality
  - Network range information
  - Professional UX with icons and color coding
  - Solutions and guidance for users

#### Custom Hook
- **File**: `resources/js/hooks/useAccessControl.ts`
- **Features**:
  - Error handling for access control scenarios
  - Type-safe error detection
  - Support for multiple error response formats
  - Modal state management

#### Updated Pages
- **File**: `resources/js/pages/peserta/daftar-tes/index.tsx`
- **Changes**:
  - Integrated access control hook and modal
  - Enhanced error handling for startTest and lanjutkanTes
  - Graceful fallback to normal toast for non-access errors

### 6. Form UI Updates

#### JadwalFormModal.tsx
- Added access_mode field with Select component
- Consistent UI with other form fields
- Proper form validation integration

#### edit.tsx (Jadwal Edit Page)
- Added access_mode field to edit form
- Consistent styling with create form
- Proper data binding and submission

#### jadwal.tsx (Data Table)
- Added access_mode column display
- Status badges with appropriate colors
- Clear visual indication of mode

## Configuration

### Campus IP Ranges
The system recognizes the following IP ranges as "campus network":

1. **Range 1**: 103.121.197.1 - 103.121.197.254
2. **Range 2**: 36.50.94.1 - 36.50.94.254
3. **Localhost**: 127.0.0.1, ::1 (for development)

### Access Modes

#### Online Mode ('online')
- Test can be accessed from anywhere
- No IP restrictions applied
- Default setting for new tests

#### Offline Mode ('offline')
- Test can only be accessed from campus network
- IP validation enforced
- Structured error responses for better UX

## Error Handling

### Backend Error Response Format
```json
{
    "error": "OFFLINE_MODE_RESTRICTED",
    "details": {
        "client_ip": "192.168.1.100",
        "test_name": "UTS Sistem Informasi",
        "access_mode": "offline"
    },
    "message": "Tes ini dikonfigurasi untuk mode offline dan hanya dapat diakses dari jaringan kampus universitas. IP Address Anda (192.168.1.100) tidak terdaftar dalam jaringan yang diizinkan."
}
```

### Frontend Modal Features
- Professional error display with icons
- IP address information
- Allowed network ranges
- Clear solutions and guidance
- Copy IP address functionality
- Responsive design

## Business Impact

### Problem Solved
- **Before**: Global system setting affected all tests (TOEFL admin setting private mode affected UTS tests)
- **After**: Each test has independent access control (TOEFL can be private while UTS remains public)

### Benefits
1. **Granular Control**: Individual test access management
2. **Conflict Prevention**: No more cross-administrator interference
3. **Better UX**: Professional error handling instead of plain HTML pages
4. **Flexibility**: Mixed online/offline tests possible
5. **Consistency**: Unified access control across all entry points

## Usage

### For Administrators
1. Create/edit test schedule
2. Choose access mode:
   - **Online**: Accessible from anywhere
   - **Offline**: Campus network only
3. Save settings

### For Students
1. Access test from allowed network (if offline mode)
2. If access denied, see professional modal with:
   - Clear error explanation
   - Current IP address
   - Allowed network information
   - Suggested solutions

## Technical Notes

### IP Detection Priority
1. HTTP_CF_CONNECTING_IP (Cloudflare)
2. HTTP_CLIENT_IP (Proxy)
3. HTTP_X_FORWARDED_FOR (Load balancer/proxy)
4. HTTP_X_FORWARDED (Proxy)
5. HTTP_X_CLUSTER_CLIENT_IP (Cluster)
6. HTTP_FORWARDED_FOR (Proxy)
7. HTTP_FORWARDED (Proxy)
8. REMOTE_ADDR (Standard)

### Security Considerations
- Handles comma-separated IPs from proxies
- Removes port numbers from IP addresses
- IPv6 localhost support (::1)
- Comprehensive IP source detection

## Future Enhancements

### Potential Improvements
1. **IP Range Management**: Admin interface for managing allowed IP ranges
2. **Location-based Access**: GPS-based verification for mobile devices
3. **Time-based Restrictions**: Additional time constraints for offline mode
4. **Audit Logging**: Track access attempts and denials
5. **Network Detection**: Automatic campus network detection
6. **Multiple Locations**: Support for multiple campus locations

### Extensibility
The system is designed to be easily extensible for:
- Additional access modes
- Custom IP range configurations
- Integration with external authentication systems
- Enhanced security features

## Testing

### Test Cases Covered
1. ✅ Online mode access from any IP
2. ✅ Offline mode access from campus IP
3. ✅ Offline mode denial from external IP
4. ✅ Modal display for access denial
5. ✅ Form field validation and submission
6. ✅ Database migration and model updates
7. ✅ Controller IP checking logic
8. ✅ Frontend error handling integration

### Validation Points
- Database schema changes applied successfully
- Form fields display and save correctly
- IP checking works at entry point and controller level
- Modal displays professional error messages
- Error handling gracefully falls back to normal toasts
- UI consistency across create/edit forms

## Conclusion

The per-jadwal access control system successfully replaces the global access control mechanism with a granular, per-test solution. This eliminates conflicts between different test administrators while providing a professional user experience through elegant error handling and clear guidance for students.

The implementation is production-ready and provides a solid foundation for future enhancements in access control and security features.