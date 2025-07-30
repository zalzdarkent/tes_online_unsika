# Panduan Deployment

## Prasyarat
- Docker dan Docker Compose terinstall di server
- Git (opsional, jika menggunakan clone repository)

## Langkah Deployment

1. Extract file zip project (atau clone repository) ke direktori yang diinginkan

2. Copy file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:
```bash
cp .env.example .env
```

3. Sesuaikan konfigurasi berikut di file `.env`:
- `APP_URL`: URL aplikasi
- `DB_HOST`: mysql (sesuai nama service di docker-compose)
- `DB_DATABASE`: laravel (sesuai konfigurasi di docker-compose)
- `DB_USERNAME`: laravel
- `DB_PASSWORD`: secret

4. Build dan jalankan container Docker:
```bash
docker-compose up -d
```

5. Install dependencies PHP:
```bash
docker-compose exec app composer install
```

6. Generate application key:
```bash
docker-compose exec app php artisan key:generate
```

7. Install dependencies Node.js dan build assets:
```bash
docker-compose exec app npm install
docker-compose exec app npm run build
```

8. Buat symbolic link untuk storage:
```bash
docker-compose exec app php artisan storage:link
```

9. Set permission yang benar untuk folder storage:
```bash
docker-compose exec app chmod -R 775 storage
docker-compose exec app chown -R www-data:www-data storage
```

10. Jalankan migrasi database:
```bash
docker-compose exec app php artisan migrate
```

## Troubleshooting

Jika menemui masalah:

1. **Error koneksi database**
   - Pastikan konfigurasi database di `.env` sudah benar
   - Tunggu beberapa saat sampai MySQL siap menerima koneksi
   - Cek log dengan `docker-compose logs mysql`

2. **Error permission storage**
   - Jalankan ulang command permission di langkah 9
   - Pastikan user www-data memiliki akses ke folder storage

3. **Gambar tidak muncul**
   - Pastikan symbolic link storage sudah dibuat
   - Cek permission folder storage
   - Pastikan volume storage di docker-compose.yml sudah benar

## Command Berguna

- Lihat log container:
  ```bash
  docker-compose logs -f
  ```

- Restart container:
  ```bash
  docker-compose restart
  ```

- Rebuild container (jika ada perubahan Dockerfile):
  ```bash
  docker-compose up -d --build
  ```

- Masuk ke shell container:
  ```bash
  docker-compose exec app bash
  ```
