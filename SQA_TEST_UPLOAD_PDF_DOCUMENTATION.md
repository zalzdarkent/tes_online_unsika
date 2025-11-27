# 📋 Dokumentasi Software Quality Assurance (SQA)
## Testing Modul Upload Dokumen PDF - Sistem Tes Online UNSIKA

---

### 📊 **Informasi Proyek**
- **Nama Aplikasi**: Sistem Tes Online UNSIKA
- **Modul yang Diuji**: Upload Dokumen PDF
- **Jenis Testing**: Black-Box Testing
- **Tanggal Testing**: [Tanggal Testing]
- **Tester**: [Nama Tester]
- **Versi Aplikasi**: [Versi]

---

### 🎯 **Tujuan Testing**
Memastikan modul upload dokumen PDF berfungsi dengan baik dan sesuai dengan spesifikasi yang telah ditentukan, khususnya untuk validasi ukuran file maksimal 2 MB dan format file yang diperbolehkan.

---

### 📋 **Spesifikasi Requirement**
1. **Format File**: Hanya menerima file dengan ekstensi .pdf
2. **Ukuran Maksimal**: 2 MB (2,048 KB)
3. **Validasi**: Sistem harus menampilkan pesan error yang sesuai untuk kondisi invalid
4. **Respon Sistem**: Upload berhasil menampilkan konfirmasi success

---

## 🧪 **Test Cases & Execution**

### **Test Case 1: Valid File Upload**
**Tujuan**: Memverifikasi sistem dapat menerima file PDF yang valid dengan ukuran ≤ 2MB

| **Test Case ID** | TC_UPLOAD_01 |
|------------------|--------------|
| **Test Scenario** | Upload file PDF dengan ukuran valid |
| **Prerequisite** | User sudah login dan mengakses halaman upload |
| **Test Steps** | 1. Klik tombol "Choose File" atau "Browse"<br>2. Pilih file PDF dengan ukuran ≤ 2MB<br>3. Klik tombol "Upload" |
| **Test Data** | File: `dokumen_test.pdf` (1.5 MB) |
| **Expected Result** | File berhasil diupload, muncul pesan "Upload berhasil" |
| **Actual Result** | [Hasil aktual akan diisi saat testing] |
| **Status** | [PASS/FAIL] |
| **Screenshot** | [Attach screenshot] |

---

### **Test Case 2: File Size Exceeds Limit**
**Tujuan**: Memverifikasi sistem menolak file PDF dengan ukuran > 2MB

| **Test Case ID** | TC_UPLOAD_02 |
|------------------|--------------|
| **Test Scenario** | Upload file PDF dengan ukuran melebihi batas |
| **Prerequisite** | User sudah login dan mengakses halaman upload |
| **Test Steps** | 1. Klik tombol "Choose File" atau "Browse"<br>2. Pilih file PDF dengan ukuran > 2MB<br>3. Klik tombol "Upload" |
| **Test Data** | File: `dokumen_besar.pdf` (3.2 MB) |
| **Expected Result** | Upload gagal, muncul pesan error "Ukuran file melebihi batas maksimal 2MB" |
| **Actual Result** | [Hasil aktual akan diisi saat testing] |
| **Status** | [PASS/FAIL] |
| **Screenshot** | [Attach screenshot] |

---

### **Test Case 3: Invalid File Format**
**Tujuan**: Memverifikasi sistem menolak file dengan format selain PDF

| **Test Case ID** | TC_UPLOAD_03 |
|------------------|--------------|
| **Test Scenario** | Upload file dengan format tidak sesuai |
| **Prerequisite** | User sudah login dan mengakses halaman upload |
| **Test Steps** | 1. Klik tombol "Choose File" atau "Browse"<br>2. Pilih file non-PDF (contoh: .docx, .jpg, .txt)<br>3. Klik tombol "Upload" |
| **Test Data** | File: `dokumen_test.docx` (500 KB) |
| **Expected Result** | Upload gagal, muncul pesan error "Format file tidak didukung. Hanya file PDF yang diperbolehkan" |
| **Actual Result** | [Hasil aktual akan diisi saat testing] |
| **Status** | [PASS/FAIL] |
| **Screenshot** | [Attach screenshot] |

---

### **Test Case 4: Empty File Upload**
**Tujuan**: Memverifikasi sistem menolak file kosong atau corrupt

| **Test Case ID** | TC_UPLOAD_04 |
|------------------|--------------|
| **Test Scenario** | Upload file PDF kosong atau corrupt |
| **Prerequisite** | User sudah login dan mengakses halaman upload |
| **Test Steps** | 1. Klik tombol "Choose File" atau "Browse"<br>2. Pilih file PDF kosong (0 KB) atau corrupt<br>3. Klik tombol "Upload" |
| **Test Data** | File: `dokumen_kosong.pdf` (0 KB) |
| **Expected Result** | Upload gagal, muncul pesan error "File tidak valid atau kosong" |
| **Actual Result** | [Hasil aktual akan diisi saat testing] |
| **Status** | [PASS/FAIL] |
| **Screenshot** | [Attach screenshot] |

---

## 📊 **Test Execution Summary**

### **Environment Setup**
- **Browser**: [Chrome/Firefox/Edge version]
- **Operating System**: [Windows/Linux/Mac version]
- **Screen Resolution**: [1920x1080/1366x768/etc]
- **Network Connection**: [Stable/WiFi/LAN]

### **Test Data Preparation**
| **File Name** | **Size** | **Format** | **Purpose** |
|---------------|----------|------------|-------------|
| dokumen_test.pdf | 1.5 MB | PDF | Valid test case |
| dokumen_besar.pdf | 3.2 MB | PDF | Size exceed test |
| dokumen_test.docx | 500 KB | DOCX | Invalid format test |
| dokumen_kosong.pdf | 0 KB | PDF | Empty file test |

---

## 🔍 **Test Results Analysis**

### **Summary Table**
| **Test Case ID** | **Test Scenario** | **Status** | **Priority** |
|------------------|-------------------|------------|--------------|
| TC_UPLOAD_01 | Valid file upload | [PASS/FAIL] | High |
| TC_UPLOAD_02 | File size exceeds limit | [PASS/FAIL] | High |
| TC_UPLOAD_03 | Invalid file format | [PASS/FAIL] | Medium |
| TC_UPLOAD_04 | Empty file upload | [PASS/FAIL] | Medium |

### **Defect Summary**
| **Defect ID** | **Severity** | **Priority** | **Description** | **Status** |
|---------------|--------------|--------------|-----------------|------------|
| [DEF_001] | [High/Medium/Low] | [High/Medium/Low] | [Deskripsi bug] | [Open/Fixed/Closed] |

---

## 📈 **Quality Metrics**

### **Test Coverage**
- **Total Test Cases**: 4
- **Test Cases Passed**: [X/4]
- **Test Cases Failed**: [X/4]
- **Test Coverage**: [X]%

### **Pass/Fail Rate**
- **Pass Rate**: [X]%
- **Fail Rate**: [X]%

---

## 🔧 **Technical Implementation Details**

### **Backend Validation (PHP Laravel)**
```php
// File validation rules dari controller
'media' => 'nullable|file|mimes:pdf|max:2048', // 2MB limit
```

### **Frontend Validation (TypeScript React)**
```typescript
// Client-side file validation
const validateFile = (file: File) => {
    if (file.type !== 'application/pdf') {
        return 'Format file tidak didukung';
    }
    if (file.size > 2048 * 1024) { // 2MB in bytes
        return 'Ukuran file melebihi batas';
    }
    return null;
};
```

---

## 🛠️ **Test Automation Recommendations**

### **Automated Test Script (Pseudocode)**
```javascript
describe('PDF Upload Functionality', () => {
    test('should upload valid PDF file', async () => {
        // Test case 1 implementation
    });
    
    test('should reject oversized PDF file', async () => {
        // Test case 2 implementation
    });
    
    test('should reject non-PDF files', async () => {
        // Test case 3 implementation
    });
    
    test('should reject empty files', async () => {
        // Test case 4 implementation
    });
});
```

---

## 📝 **Recommendations & Improvements**

### **Security Considerations**
1. **File Content Validation**: Tambahkan validasi konten file untuk memastikan file benar-benar PDF
2. **Virus Scanning**: Implementasi antivirus scanning untuk file upload
3. **File Name Sanitization**: Bersihkan nama file dari karakter berbahaya

### **User Experience Improvements**
1. **Progress Indicator**: Tambahkan loading indicator saat upload
2. **Drag & Drop**: Implementasi drag & drop functionality
3. **Preview**: Tambahkan preview dokumen setelah upload
4. **Multiple Upload**: Support upload multiple files sekaligus

### **Performance Optimizations**
1. **Chunked Upload**: Untuk file besar, implementasi chunked upload
2. **Compression**: Auto-compress PDF jika diperlukan
3. **Caching**: Implementasi caching untuk file yang sering diakses

---

## 📋 **Conclusion**

### **Overall Assessment**
[Berisi ringkasan hasil testing secara keseluruhan]

### **Critical Issues Found**
[List issue kritis yang ditemukan]

### **Recommendations for Production**
[Rekomendasi sebelum deploy ke production]

---

## 📎 **Appendices**

### **Appendix A: Test Screenshots**
[Tempat untuk attach screenshot hasil testing]

### **Appendix B: Error Logs**
[Log error jika ada yang ditemukan saat testing]

### **Appendix C: Browser Compatibility Matrix**
| **Browser** | **Version** | **Status** | **Notes** |
|-------------|-------------|------------|-----------|
| Chrome | [version] | [PASS/FAIL] | [notes] |
| Firefox | [version] | [PASS/FAIL] | [notes] |
| Edge | [version] | [PASS/FAIL] | [notes] |
| Safari | [version] | [PASS/FAIL] | [notes] |

---

**Document Version**: 1.0  
**Last Updated**: [Tanggal]  
**Prepared By**: [Nama Tester]  
**Reviewed By**: [Nama Reviewer]  
**Approved By**: [Nama Approver]
