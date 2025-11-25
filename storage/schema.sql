/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `admin_bypass_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_bypass_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_bypass_sessions_session_id_unique` (`session_id`),
  KEY `admin_bypass_sessions_session_id_expires_at_index` (`session_id`,`expires_at`),
  KEY `admin_bypass_sessions_user_id_foreign` (`user_id`),
  CONSTRAINT `admin_bypass_sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hasil_test_peserta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hasil_test_peserta` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_jadwal` bigint unsigned NOT NULL,
  `id_user` bigint unsigned NOT NULL,
  `total_skor` decimal(8,2) DEFAULT '0.00',
  `total_nilai` decimal(5,2) DEFAULT '0.00',
  `status_koreksi` enum('draft','submitted') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `is_submitted_test` tinyint(1) NOT NULL DEFAULT '0',
  `status_tes` enum('sedang_mengerjakan','terputus','selesai','tidak_dimulai') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tidak_dimulai',
  `waktu_mulai_tes` timestamp NULL DEFAULT NULL,
  `waktu_terakhir_aktif` timestamp NULL DEFAULT NULL,
  `waktu_submit` timestamp NULL DEFAULT NULL,
  `sisa_waktu_detik` int DEFAULT NULL,
  `boleh_dilanjutkan` tinyint(1) NOT NULL DEFAULT '0',
  `alasan_terputus` text COLLATE utf8mb4_unicode_ci,
  `diizinkan_lanjut_pada` timestamp NULL DEFAULT NULL,
  `waktu_resume_tes` timestamp NULL DEFAULT NULL,
  `total_waktu_pause_detik` int NOT NULL DEFAULT '0',
  `diizinkan_oleh` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hasil_test_unique_user_jadwal` (`id_user`,`id_jadwal`),
  KEY `hasil_test_peserta_id_jadwal_index` (`id_jadwal`),
  KEY `hasil_test_peserta_id_user_index` (`id_user`),
  KEY `hasil_test_peserta_diizinkan_oleh_foreign` (`diizinkan_oleh`),
  CONSTRAINT `hasil_test_peserta_diizinkan_oleh_foreign` FOREIGN KEY (`diizinkan_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `hasil_test_peserta_id_jadwal_foreign` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hasil_test_peserta_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jadwal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jadwal` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_jadwal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_jadwal` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_mulai` datetime NOT NULL,
  `tanggal_berakhir` datetime NOT NULL,
  `waktu_mulai_tes` datetime DEFAULT NULL,
  `status` enum('Buka','Tutup') COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_mode` enum('online','offline') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `auto_close` tinyint(1) NOT NULL DEFAULT '1',
  `durasi` int NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `id_jadwal_sebelumnya` bigint unsigned DEFAULT NULL,
  `kategori_tes_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_shuffled` tinyint(1) NOT NULL DEFAULT '0',
  `is_answer_shuffled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `jadwal_kode_jadwal_unique` (`kode_jadwal`),
  KEY `jadwal_user_id_index` (`user_id`),
  KEY `jadwal_id_jadwal_sebelumnya_index` (`id_jadwal_sebelumnya`),
  KEY `jadwal_kategori_tes_id_index` (`kategori_tes_id`),
  CONSTRAINT `jadwal_id_jadwal_sebelumnya_foreign` FOREIGN KEY (`id_jadwal_sebelumnya`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `jadwal_kategori_tes_id_foreign` FOREIGN KEY (`kategori_tes_id`) REFERENCES `kategori_tes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `jadwal_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jadwal_peserta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jadwal_peserta` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_jadwal` bigint unsigned NOT NULL,
  `id_peserta` bigint unsigned NOT NULL,
  `status` enum('menunggu','disetujui','ditolak') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'menunggu',
  `cara_daftar` enum('mandiri','teacher') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mandiri',
  `tanggal_daftar` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_approval` timestamp NULL DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jadwal_peserta_id_jadwal_id_peserta_unique` (`id_jadwal`,`id_peserta`),
  KEY `jadwal_peserta_approved_by_foreign` (`approved_by`),
  KEY `jadwal_peserta_id_jadwal_status_index` (`id_jadwal`,`status`),
  KEY `jadwal_peserta_id_peserta_status_index` (`id_peserta`,`status`),
  CONSTRAINT `jadwal_peserta_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `jadwal_peserta_id_jadwal_foreign` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `jadwal_peserta_id_peserta_foreign` FOREIGN KEY (`id_peserta`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jawaban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jawaban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` bigint unsigned NOT NULL,
  `id_jadwal` bigint unsigned NOT NULL,
  `id_soal` bigint unsigned NOT NULL,
  `jawaban` text COLLATE utf8mb4_unicode_ci,
  `skor_didapat` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jawaban_id_user_foreign` (`id_user`),
  KEY `jawaban_id_jadwal_foreign` (`id_jadwal`),
  KEY `jawaban_id_soal_foreign` (`id_soal`),
  CONSTRAINT `jawaban_id_jadwal_foreign` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `jawaban_id_soal_foreign` FOREIGN KEY (`id_soal`) REFERENCES `soal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `jawaban_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kategori_tes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kategori_tes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_kategori` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kategori_tes_nama_user_id_unique` (`nama`,`user_id`),
  UNIQUE KEY `kategori_tes_kode_kategori_unique` (`kode_kategori`),
  KEY `kategori_tes_user_id_foreign` (`user_id`),
  CONSTRAINT `kategori_tes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_bank_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_bank_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `question_bank_id` bigint unsigned NOT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `requester_id` bigint unsigned NOT NULL,
  `permission_type` enum('request','shared') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected','active') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `message` text COLLATE utf8mb4_unicode_ci,
  `approved_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qb_permissions_unique` (`question_bank_id`,`owner_id`,`requester_id`),
  KEY `question_bank_permissions_question_bank_id_index` (`question_bank_id`),
  KEY `question_bank_permissions_owner_id_index` (`owner_id`),
  KEY `question_bank_permissions_requester_id_index` (`requester_id`),
  KEY `question_bank_permissions_status_index` (`status`),
  CONSTRAINT `question_bank_permissions_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_bank_permissions_question_bank_id_foreign` FOREIGN KEY (`question_bank_id`) REFERENCES `question_banks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_bank_permissions_requester_id_foreign` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_banks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_banks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pertanyaan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_soal` enum('pilihan_ganda','multi_choice','esai','essay_gambar','essay_audio','skala','equation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe_jawaban` enum('single_choice','multi_choice','essay','essay_gambar','essay_audio','skala','equation') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single_choice',
  `opsi_a` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_b` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_c` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_d` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jawaban_benar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipe_skala` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `equation` text COLLATE utf8mb4_unicode_ci,
  `skala_min` int DEFAULT NULL,
  `skala_maks` int DEFAULT NULL,
  `skala_label_min` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skala_label_maks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skor` int NOT NULL DEFAULT '1',
  `difficulty_level` enum('easy','medium','hard','expert') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `tags` text COLLATE utf8mb4_unicode_ci,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `usage_count` int NOT NULL DEFAULT '0',
  `user_id` bigint unsigned NOT NULL,
  `kategori_tes_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_banks_user_id_index` (`user_id`),
  KEY `question_banks_kategori_tes_id_index` (`kategori_tes_id`),
  KEY `question_banks_jenis_soal_index` (`jenis_soal`),
  KEY `question_banks_difficulty_level_index` (`difficulty_level`),
  KEY `question_banks_is_public_index` (`is_public`),
  CONSTRAINT `question_banks_kategori_tes_id_foreign` FOREIGN KEY (`kategori_tes_id`) REFERENCES `kategori_tes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `question_banks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `screenshot_violations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `screenshot_violations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `jadwal_id` bigint unsigned NOT NULL,
  `peserta_id` bigint unsigned NOT NULL,
  `violation_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detection_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `browser_info` json DEFAULT NULL,
  `violation_time` timestamp NOT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_notes` text COLLATE utf8mb4_unicode_ci,
  `auto_submitted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `screenshot_violations_jadwal_id_foreign` (`jadwal_id`),
  KEY `screenshot_violations_peserta_id_foreign` (`peserta_id`),
  CONSTRAINT `screenshot_violations_jadwal_id_foreign` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `screenshot_violations_peserta_id_foreign` FOREIGN KEY (`peserta_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `soal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soal` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_jadwal` bigint unsigned NOT NULL,
  `urutan_soal` int NOT NULL DEFAULT '0',
  `jenis_soal` enum('pilihan_ganda','multi_choice','esai','essay_gambar','essay_audio','skala','equation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe_jawaban` enum('single_choice','multi_choice','essay','essay_gambar','essay_audio','skala','equation') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single_choice',
  `pertanyaan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `opsi_a` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_b` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_c` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opsi_d` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jawaban_benar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skala_min` int DEFAULT NULL COMMENT 'Nilai minimum untuk skala (contoh: 1)',
  `skala_maks` int DEFAULT NULL COMMENT 'Nilai maksimum untuk skala (contoh: 5)',
  `skala_label_min` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Label untuk nilai minimum (contoh: Sangat Tidak Setuju)',
  `skala_label_maks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Label untuk nilai maksimum (contoh: Sangat Setuju)',
  `equation` text COLLATE utf8mb4_unicode_ci,
  `skor` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `soal_id_jadwal_index` (`id_jadwal`),
  KEY `soal_id_jadwal_urutan_soal_index` (`id_jadwal`,`urutan_soal`),
  CONSTRAINT `soal_id_jadwal_foreign` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `access` enum('public','private') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','teacher','peserta') COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `no_hp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `prodi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fakultas` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `universitas` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `npm` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000000_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2025_07_17_000001_create_kategori_tes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2025_07_18_000001_create_jadwal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2025_07_18_000002_create_soal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2025_07_18_000003_create_jawaban_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2025_07_18_000004_create_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2025_07_19_000000_create_screenshot_violations_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10,'2025_07_24_000001_add_dynamic_fields_to_soal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11,'2025_07_28_000001_add_scale_fields_to_soal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12,'2025_07_30_175723_add_start_time_to_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13,'2025_07_31_070403_add_kode_kategori',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14,'2025_07_31_070622_add_kode_jadwal',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15,'2025_08_01_000001_modify_total_columns_in_hasil_test_peserta',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16,'2025_08_04_123608_add_skor_didapat_to_jawaban_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17,'2025_08_05_152714_add_unique_constraint_to_hasil_test_peserta',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18,'2025_08_05_160930_add_status_koreksi_to_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19,'2025_08_05_223851_alter_jawaban_column_nullable_on_jawaban_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20,'2025_08_05_225349_add_updated_at_to_jawaban_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21,'2025_08_05_233214_add_is_submitted_to_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22,'2025_08_08_160625_update_users_table_add_academic_fields',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23,'2025_08_11_135154_rename_is_submitted_column_in_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24,'2025_08_21_132330_add_urutan_soal_to_soal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25,'2025_09_11_124229_create_jadwal_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26,'2025_09_15_173101_add_is_shuffled_to_jadwal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27,'2025_09_18_065811_create_system_settings_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (28,'2025_09_30_120834_add_waktu_mulai_tes_to_jadwal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29,'2025_09_30_123059_add_test_session_fields_to_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30,'2025_09_30_131832_add_waktu_resume_tes_to_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31,'2025_10_03_095229_update_soal_table_nullable_fields',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32,'2025_10_03_102816_create_admin_bypass_sessions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33,'2025_10_05_102154_add_waktu_submit_to_hasil_test_peserta_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34,'2025_10_08_141532_add_is_answer_shuffled_to_jadwal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35,'2025_10_17_104059_add_access_mode_to_jadwal_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36,'2025_11_21_081907_create_question_banks_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37,'2025_11_21_082025_create_question_bank_permissions_table',1);
