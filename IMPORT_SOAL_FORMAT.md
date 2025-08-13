# Format Import Soal dari Excel

## Template File
Template file Excel tersedia di: `/template-soal.xlsx` atau `/template-soal.csv`

## Format Kolom yang Diperlukan

| Kolom | Nama Field | Deskripsi | Wajib | Contoh |
|-------|------------|-----------|-------|---------|
| A | `jenis_soal` | Jenis soal | Ya | `pilihan_ganda`, `multi_choice`, `esai`, `skala`, `equation` |
| B | `pertanyaan` | Isi pertanyaan | Ya | "Apa ibukota Indonesia?" |
| C | `skor` | Skor/nilai soal | Ya | 1, 5, 10 |
| D | `opsi_a` | Pilihan A | Tidak* | "Jakarta" |
| E | `opsi_b` | Pilihan B | Tidak* | "Bandung" |
| F | `opsi_c` | Pilihan C | Tidak | "Surabaya" |
| G | `opsi_d` | Pilihan D | Tidak | "Medan" |
| H | `jawaban_benar` | Jawaban yang benar | Ya | "a", "Jakarta", "a,b,d" |

*) Wajib untuk jenis soal pilihan ganda

## Jenis Soal yang Didukung

### 1. Pilihan Ganda (`pilihan_ganda`)
- **Kolom wajib**: `jenis_soal`, `pertanyaan`, `skor`, `opsi_a`, `opsi_b`, `jawaban_benar`
- **Kolom opsional**: `opsi_c`, `opsi_d`
- **Format jawaban**: Huruf pilihan (a, b, c, atau d)
- **Contoh**:
  ```
  pilihan_ganda | "Apa ibukota Indonesia?" | 1 | "Jakarta" | "Bandung" | "Surabaya" | "Medan" | "a"
  ```

### 2. Pilihan Ganda Multi Jawaban (`multi_choice`)
- **Kolom wajib**: `jenis_soal`, `pertanyaan`, `skor`, `opsi_a`, `opsi_b`, `jawaban_benar`
- **Kolom opsional**: `opsi_c`, `opsi_d`
- **Format jawaban**: Huruf pilihan dipisah koma (a,b,d)
- **Contoh**:
  ```
  multi_choice | "Bahasa pemrograman mana saja yang compiled?" | 3 | "Java" | "Python" | "C++" | "JavaScript" | "a,c"
  ```

### 3. Esai (`esai`)
- **Kolom wajib**: `jenis_soal`, `pertanyaan`, `skor`, `jawaban_benar`
- **Kolom tidak diperlukan**: `opsi_a`, `opsi_b`, `opsi_c`, `opsi_d`
- **Format jawaban**: Teks bebas
- **Contoh**:
  ```
  esai | "Jelaskan pengertian algoritma!" | 5 | | | | | "Algoritma adalah urutan langkah logis untuk menyelesaikan masalah"
  ```

### 4. Skala (`skala`)
- **Kolom wajib**: `jenis_soal`, `pertanyaan`, `skor`, `jawaban_benar`
- **Kolom tambahan**: `skala_min`, `skala_maks`, `skala_label_min`, `skala_label_maks`
- **Format jawaban**: Angka dalam rentang skala
- **Contoh**:
  ```
  skala | "Tingkat kepuasan layanan (1-5)?" | 2 | | | | | "3"
  ```

### 5. Equation (`equation`)
- **Kolom wajib**: `jenis_soal`, `pertanyaan`, `skor`, `jawaban_benar`, `equation`
- **Format jawaban**: Teks/formula
- **Contoh**:
  ```
  equation | "Hitung integral dari x²" | 5 | | | | | "x³/3 + C"
  ```

## Aturan Validasi

1. **File Format**: Hanya menerima file .xlsx atau .xls
2. **Kolom Header**: Harus sesuai dengan nama field yang ditentukan
3. **Baris Data**: Minimal 1 baris data setelah header
4. **Skor**: Harus berupa angka positif (minimal 1)
5. **Jenis Soal**: Harus sesuai dengan yang didukung system

## Contoh Template Lengkap

```csv
jenis_soal,pertanyaan,skor,opsi_a,opsi_b,opsi_c,opsi_d,jawaban_benar
pilihan_ganda,"Apa ibukota Indonesia?",1,"Jakarta","Bandung","Surabaya","Medan","a"
multi_choice,"Bahasa pemrograman mana yang compiled?",3,"Java","Python","C++","JavaScript","a,c"
esai,"Jelaskan pengertian algoritma!",5,"","","","","Algoritma adalah urutan langkah logis"
skala,"Tingkat kepuasan (1-5)?",2,"","","","","3"
```

## Error Handling

System akan memberikan feedback jika:
- Format file tidak sesuai
- Data tidak valid atau kosong
- Ada error pada baris tertentu
- Beberapa soal berhasil, beberapa gagal diimport

## Tips Penggunaan

1. **Download template** terlebih dahulu dari link yang tersedia
2. **Isi data** sesuai dengan format yang ditentukan
3. **Pastikan encoding** file Excel adalah UTF-8 untuk karakter khusus
4. **Test dengan data sedikit** dulu sebelum import dalam jumlah besar
5. **Backup data** sebelum melakukan import besar-besaran
