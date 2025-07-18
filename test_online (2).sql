-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Waktu pembuatan: 24 Feb 2025 pada 05.23
-- Versi server: 8.0.40
-- Versi PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test_online`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `hasil_test_peserta`
--

CREATE TABLE `hasil_test_peserta` (
  `id_hasil` int NOT NULL,
  `id_jadwal` int NOT NULL,
  `id` int NOT NULL,
  `id_soal` int NOT NULL,
  `jawaban` varchar(255) NOT NULL,
  `jawaban_benar` varchar(255) NOT NULL,
  `skor` int NOT NULL DEFAULT '0',
  `waktu_ujian` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `hasil_test_peserta`
--

INSERT INTO `hasil_test_peserta` (`id_hasil`, `id_jadwal`, `id`, `id_soal`, `jawaban`, `jawaban_benar`, `skor`, `waktu_ujian`) VALUES
(14, 10, 5, 8, 'A', 'A', 1, '2025-02-23 06:36:46'),
(15, 10, 5, 9, 'a', 'a', 1, '2025-02-23 06:36:50'),
(16, 10, 5, 12, 'Indonesia', 'Indonesia', 10, '2025-02-23 06:36:59'),
(17, 10, 5, 13, 'Kretek', 'Kretek', 10, '2025-02-23 06:37:05'),
(18, 10, 5, 14, '1', '1', 1, '2025-02-23 06:37:09'),
(19, 13, 5, 10, 'A', 'A', 1, '2025-02-23 06:37:37'),
(20, 13, 5, 11, 'gak punya duit', 'gak punya duit', 10, '2025-02-23 06:37:51');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jadwal`
--

CREATE TABLE `jadwal` (
  `id_jadwal` int NOT NULL,
  `nama_jadwal` varchar(255) NOT NULL,
  `tanggal_mulai` datetime NOT NULL,
  `tanggal_berakhir` datetime NOT NULL,
  `status` enum('Buka','Tutup') NOT NULL,
  `auto_close` tinyint(1) DEFAULT '1',
  `id_jadwal_sebelumnya` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `jadwal`
--

INSERT INTO `jadwal` (`id_jadwal`, `nama_jadwal`, `tanggal_mulai`, `tanggal_berakhir`, `status`, `auto_close`, `id_jadwal_sebelumnya`) VALUES
(10, 'Test s2', '2025-02-22 23:06:00', '2025-03-07 23:06:00', 'Buka', 1, NULL),
(13, 'Test s2 2', '2025-02-22 23:34:00', '2025-03-08 23:34:00', 'Buka', 1, 10),
(14, 'Test s2 3', '2025-02-22 23:35:00', '2025-03-08 23:35:00', 'Buka', 1, 13);

-- --------------------------------------------------------

--
-- Struktur dari tabel `jawaban`
--

CREATE TABLE `jawaban` (
  `id_jawaban` int NOT NULL,
  `id_user` int NOT NULL,
  `id_jadwal` int NOT NULL,
  `id_soal` int NOT NULL,
  `jawaban` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `jawaban`
--

INSERT INTO `jawaban` (`id_jawaban`, `id_user`, `id_jadwal`, `id_soal`, `jawaban`, `created_at`) VALUES
(1, 5, 13, 10, 'A', '2025-02-22 19:40:00'),
(2, 5, 13, 11, 'tidak punya duit', '2025-02-22 19:40:00'),
(3, 5, 13, 10, 'C', '2025-02-22 19:41:18'),
(4, 5, 13, 11, 'gak punya duit', '2025-02-22 19:41:18');

-- --------------------------------------------------------

--
-- Struktur dari tabel `soal`
--

CREATE TABLE `soal` (
  `id_soal` int NOT NULL,
  `id_jadwal` int NOT NULL,
  `jenis_soal` enum('pilihan_ganda','esai') NOT NULL,
  `pertanyaan` text NOT NULL,
  `opsi_a` varchar(255) DEFAULT NULL,
  `opsi_b` varchar(255) DEFAULT NULL,
  `opsi_c` varchar(255) DEFAULT NULL,
  `opsi_d` varchar(255) DEFAULT NULL,
  `jawaban_benar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `skor` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `soal`
--

INSERT INTO `soal` (`id_soal`, `id_jadwal`, `jenis_soal`, `pertanyaan`, `opsi_a`, `opsi_b`, `opsi_c`, `opsi_d`, `jawaban_benar`, `skor`) VALUES
(3, 5, 'esai', 'siapa nama kamu?', NULL, NULL, NULL, NULL, 'nama kamu sendiri', 1),
(4, 5, 'esai', 'dan', NULL, NULL, NULL, NULL, 'sd', 1),
(5, 5, 'pilihan_ganda', '123', '1', '2', '3', '4', '', 1),
(6, 6, 'esai', 'asfdasf', NULL, NULL, NULL, NULL, '', 1),
(7, 6, 'pilihan_ganda', 'sdfadfsdf', '2', '3', '4', '5', '', 1),
(8, 10, 'pilihan_ganda', '1', '1', '2', '3', '4', 'A', 1),
(9, 10, 'esai', 'a', NULL, NULL, NULL, NULL, 'a', 1),
(10, 13, 'pilihan_ganda', '1', '1', '2', '3', '4', 'A', 1),
(11, 13, 'esai', 'akibat dari apakah pusing itu', NULL, NULL, NULL, NULL, 'gak punya duit', 10),
(12, 10, 'esai', 'Uang rupiah berasal dari negara?', NULL, NULL, NULL, NULL, 'Indonesia', 10),
(13, 10, 'esai', 'Dji SAm Soe adalah rokok jenia?', NULL, NULL, NULL, NULL, 'Kretek', 10),
(14, 10, 'esai', '1', NULL, NULL, NULL, NULL, '1', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','peserta') NOT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `nama`, `email`, `foto`, `created_at`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin Utama', 'admin@example.com', 'FOTO_JAJAM_c.jpg', '2025-02-16 17:38:01'),
(4, 'jajam', '$2y$10$Kb/H43TexLb/.32fX6cwTe928nCNdlbOb/4WvJ.SGrBeC1JBWe5Ra', 'admin', 'jajam', 'jajam@gmail.com', 'Foto Ku 11-01-21.jpg', '2025-02-16 17:46:06'),
(5, 'peserta', '$2y$10$HqsdARMeXz/JOfx3Epp2dOiTifB8fswhaBkIduwhFBQN10gg0wJAy', 'peserta', 'brian', 'brian@gmail.com', '123.jpg', '2025-02-18 02:02:21'),
(6, 'jojo', '$2y$10$9Khx5cxiy.3bwfI6hwyGCeDNCML7OdW4mX1rYNz1904kzPlwTYj7S', 'peserta', 'jojo sumarjo', 'jojo.s@gmail.com', '123.jpg', '2025-02-23 04:30:48');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `hasil_test_peserta`
--
ALTER TABLE `hasil_test_peserta`
  ADD PRIMARY KEY (`id_hasil`),
  ADD KEY `id_jadwal` (`id_jadwal`),
  ADD KEY `id` (`id`),
  ADD KEY `id_soal` (`id_soal`);

--
-- Indeks untuk tabel `jadwal`
--
ALTER TABLE `jadwal`
  ADD PRIMARY KEY (`id_jadwal`),
  ADD KEY `id_jadwal_sebelumnya` (`id_jadwal_sebelumnya`);

--
-- Indeks untuk tabel `jawaban`
--
ALTER TABLE `jawaban`
  ADD PRIMARY KEY (`id_jawaban`);

--
-- Indeks untuk tabel `soal`
--
ALTER TABLE `soal`
  ADD PRIMARY KEY (`id_soal`),
  ADD KEY `id_jadwal` (`id_jadwal`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `hasil_test_peserta`
--
ALTER TABLE `hasil_test_peserta`
  MODIFY `id_hasil` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT untuk tabel `jadwal`
--
ALTER TABLE `jadwal`
  MODIFY `id_jadwal` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `jawaban`
--
ALTER TABLE `jawaban`
  MODIFY `id_jawaban` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `soal`
--
ALTER TABLE `soal`
  MODIFY `id_soal` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `hasil_test_peserta`
--
ALTER TABLE `hasil_test_peserta`
  ADD CONSTRAINT `hasil_test_peserta_ibfk_1` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal` (`id_jadwal`) ON DELETE CASCADE,
  ADD CONSTRAINT `hasil_test_peserta_ibfk_2` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hasil_test_peserta_ibfk_3` FOREIGN KEY (`id_soal`) REFERENCES `soal` (`id_soal`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `jadwal`
--
ALTER TABLE `jadwal`
  ADD CONSTRAINT `jadwal_ibfk_1` FOREIGN KEY (`id_jadwal_sebelumnya`) REFERENCES `jadwal` (`id_jadwal`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
