# Ringkasan Aplikasi Guru Piket

## Informasi Umum
**Nama Aplikasi:** Aplikasi Guru Piket  
**Sekolah:** MTs Da'arul Ma'arif Pasawahan  
**Teknologi:** Next.js 16, TypeScript, Prisma ORM, SQLite, Tailwind CSS, shadcn/ui

---

## Fitur Utama

### 1. Dashboard
- Ringkasan KBM hari ini
- Total siswa, guru, dan kelas
- Status kehadiran guru (hadir/tidak hadir/belum absen)
- Daftar guru tidak hadir dengan keterangan
- Info guru piket hari ini (Pagi & Siang) dengan status kehadiran
- Rekap ketidakhadiran siswa per kelas

### 2. Monitoring Kehadiran Guru
- Tabel monitoring kehadiran guru per jam
- Visual warna: Hijau (hadir), Merah coret (tidak hadir), Abu-abu (tidak ada jadwal)
- Filter berdasarkan shift (Pagi/Siang/Semua)
- Input keterangan untuk guru tidak hadir
- Export ke XLSX
- Print dengan format A4 Landscape
  - Tabel per shift dengan warna header (coklat untuk Pagi, biru untuk Siang)
  - Logo sekolah di header dokumen
  - Tanda tangan: Kepala Madrasah + Guru Piket Pagi + Guru Piket Siang

### 3. Berita Acara KBM
- Input kehadiran siswa per kelas
- Rekap kehadiran guru per shift (tabel berdampingan - Pagi & Siang)
- Daftar siswa tidak hadir dengan status (Sakit/Izin/Alfa/Kabur)
- Warna baris siswa berdasarkan status (kuning, biru, merah, oranye)
- Print format A4 Landscape dalam 1 halaman
- Export kehadiran siswa ke XLSX
- 3 tanda tangan: Kepala Madrasah, Guru Piket Pagi, Guru Piket Siang

### 4. Jadwal Piket
- Tabel jadwal piket mingguan (Senin-Sabtu)
- Input guru piket per hari dan shift
- Absensi kehadiran guru piket harian
- Input keterangan jika tidak hadir

### 5. Laporan Bulanan
- Rekap kehadiran guru per bulan
- Rekap kehadiran siswa per bulan
- Rekap kehadiran guru piket per bulan
- Filter berdasarkan bulan dan tahun

### 6. Jadwal Mengajar
- Matriks jadwal mengajar guru per shift
- Input jadwal per jam (Jam 1-9 untuk Pagi, Jam 1-8 untuk Siang)
- Pilih kelas untuk setiap slot jadwal
- Import jadwal dari XLSX
- Daftar jadwal tersimpan

### 7. Siswa & Kelas
- Manajemen data kelas (nama, tingkat, shift)
- Manajemen data siswa
- Import siswa dari XLSX
- Export siswa ke XLSX
- Template import
- Pilih kelas dan bulk delete

### 8. Pengaturan
- Nama sekolah
- Alamat sekolah
- Telepon & Email
- Kepala sekolah
- Semester & Tahun ajaran
- Logo sekolah (upload, preview, hapus)
  - Format: JPG, PNG, GIF, WebP (max 2MB)
  - Ditampilkan di header aplikasi dan dokumen cetak

---

## Sistem Shift

### Shift Pagi
- **Waktu:** 07:00 - 12:30 WIB
- **Jumlah Jam:** 9 jam
- **Kelas:** 9A, 9B, 9C, 9D

### Shift Siang
- **Waktu:** 12:40 - 17:00 WIB
- **Jumlah Jam:** 8 jam
- **Kelas:** 7A, 7B, 8A, 8B, 8C

---

## Struktur Database

### Models:
1. **Pengaturan** - Konfigurasi sekolah (nama, alamat, logo, dll)
2. **Guru** - Data guru dengan indeks nama
3. **MataPelajaran** - Data mata pelajaran (tersedia di schema)
4. **Kelas** - Data kelas dengan indeks shift
5. **Siswa** - Data siswa dengan indeks kelasId dan nama
6. **Jadwal** - Jadwal mengajar dengan unique constraint (hari, jamKe, kelasId)
7. **KehadiranGuru** - Absensi guru mengajar
8. **KehadiranSiswa** - Absensi siswa
9. **JadwalPiket** - Jadwal guru piket mingguan
10. **KehadiranGuruPiket** - Absensi guru piket

---

## Optimasi Performance

### Frontend
- Paralel API calls dengan Promise.all() pada initial load
- Paralel API calls saat perubahan tanggal

### Backend (Dashboard API)
- Paralel database queries dengan Promise.all()
- 9 database queries berjalan bersamaan

### Database Indexes
| Model | Indexed Fields |
|-------|---------------|
| Guru | nama |
| Siswa | kelasId, nama |
| Kelas | shift |
| Jadwal | hari, guruId, kelasId |
| KehadiranGuru | tanggal, guruId, status |
| KehadiranSiswa | tanggal, kelasId, status |
| JadwalPiket | hari |
| KehadiranGuruPiket | tanggal, shift |

---

## API Endpoints

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/dashboard` | GET | Data dashboard harian |
| `/api/guru` | GET, POST, PUT, DELETE | CRUD guru |
| `/api/kelas` | GET, POST, PUT, DELETE | CRUD kelas |
| `/api/siswa` | GET, POST, PUT, DELETE | CRUD siswa |
| `/api/jadwal` | GET, POST, PUT, DELETE | CRUD jadwal |
| `/api/jadwal/bulk` | POST | Bulk save jadwal |
| `/api/jadwal-piket` | GET, POST, DELETE | CRUD jadwal piket |
| `/api/kehadiran/guru` | GET, POST | Kehadiran guru mengajar |
| `/api/kehadiran/siswa` | GET, POST | Kehadiran siswa |
| `/api/kehadiran-guru-piket` | GET, POST | Kehadiran guru piket |
| `/api/laporan` | GET | Laporan bulanan |
| `/api/pengaturan` | GET, PUT | Pengaturan sekolah |
| `/api/upload-logo` | POST, DELETE | Upload/hapus logo |
| `/api/import-jadwal` | POST | Import jadwal dari XLSX |

---

## Fitur Print

### Print Color Support
- CSS `print-color-adjust: exact` untuk cetak warna
- Semua background color menggunakan `!important`
- Catatan: Pengguna perlu centang "Background graphics" di pengaturan print browser

### Berita Acara
- Format: A4 Landscape (margin 0.7cm)
- Layout: Tabel shift berdampingan (side by side)
- Warna header: Coklat (Pagi), Biru (Siang)
- Siswa tidak hadir dengan warna status (Sakit=kuning, Izin=biru, Alfa=merah, Kabur=oranye)
- Logo sekolah di header

### Monitoring KBM
- Format: A4 Landscape (margin 0.8cm)
- Logo sekolah di header
- Tabel per shift dengan header warna
- Legend warna keterangan

---

## Status Kehadiran

### Guru Mengajar
| Status | Warna |
|--------|-------|
| HADIR | Hijau |
| TIDAK_HADIR | Merah |

### Guru Piket
| Status | Warna |
|--------|-------|
| HADIR | Hijau |
| TIDAK_HADIR | Merah |

### Siswa
| Status | Warna | Label |
|--------|-------|-------|
| HADIR | - | Hadir |
| SAKIT | Kuning | Sakit |
| IZIN | Biru | Izin |
| ALFA | Merah | Alfa |
| KABUR | Oranye | Kabur |

---

## Cara Penggunaan

### Absensi Guru Piket
1. Buka tab **"Jadwal Piket"**
2. Atur jadwal guru piket per hari di tabel atas
3. Scroll ke bagian **"Absensi Guru Piket"**
4. Klik tombol **Hadir** atau **Tidak Hadir**
5. Isi keterangan jika tidak hadir

### Upload Logo
1. Buka tab **"Pengaturan"**
2. Scroll ke bagian **"Logo Sekolah"**
3. Klik **"Upload Logo"**
4. Pilih file gambar (JPG/PNG/GIF/WebP, max 2MB)
5. Logo akan tampil di header dan dokumen cetak

---

## Waktu Pengembangan
**Tanggal:** Maret 2025

---
*Ringkasan diperbarui sesuai kondisi aplikasi saat ini*
