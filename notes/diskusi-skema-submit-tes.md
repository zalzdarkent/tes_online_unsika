# Diskusi Skema Submit Tes

Tanggal: 2026-05-27

## Ringkasan

Kami membahas skema penyimpanan jawaban saat peserta mengerjakan tes. Kesimpulan sementara:

- Jawaban sebaiknya disimpan ke database secara bertahap per soal, bukan menunggu semua soal selesai baru dikirim.
- `sessionStorage` boleh dipakai sebagai cache atau recovery lokal, tetapi bukan sebagai source of truth.
- Submit final tetap harus dilakukan oleh backend sebagai proses atomik dengan transaction.
- Saat waktu habis, sistem harus melakukan auto-submit final walaupun jawaban belum lengkap.

## Pertimbangan Teknis

- Untuk skala 15-20 peserta bersamaan, pola autosave per soal yang di-debounce masih tergolong aman untuk database normal seperti MySQL atau PostgreSQL.
- Beban write bisa ditekan dengan:
  - debounce saat menyimpan jawaban,
  - unique key untuk kombinasi peserta, jadwal, dan soal,
  - penggunaan transaction saat submit final.
- Risiko terbesar bukan jumlah peserta, tetapi konsistensi data saat submit final, tab berpindah, reload, koneksi putus, atau timeout.

## Rekomendasi

1. Simpan jawaban per soal ke database secara real-time atau debounce.
2. Gunakan `sessionStorage` hanya untuk pemulihan UI jika halaman di-refresh.
3. Final submit harus dikunci dengan transaction dan status tes yang jelas.
4. Auto-submit karena waktu habis harus menjadi prioritas utama dan tidak bergantung pada kelengkapan jawaban.
5. Jangan melakukan update produksi besar jika jadwal tes dekat tanpa pengujian yang memadai.

## Catatan Risiko

Jika sistem akan dipakai dalam waktu dekat, perubahan yang menyentuh alur submit perlu diperlakukan hati-hati karena bug pada jalur ini bisa berdampak langsung ke peserta dan penyelenggara.

Risiko yang perlu dicek sebelum rilis:

- jawaban kosong padahal sudah diisi,
- submit dobel,
- status tes masih bisa dibuka lagi setelah selesai,
- auto-submit saat timer habis,
- recovery saat koneksi terputus.

## Kesimpulan

Skema yang paling aman adalah autosave per soal ke database, lalu submit final menggunakan transaction. Untuk kondisi penggunaan dekat waktu tes, sebaiknya perubahan diuji dengan sangat ketat sebelum diaktifkan ke produksi.
