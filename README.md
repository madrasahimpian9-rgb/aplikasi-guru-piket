# Aplikasi Guru Piket - MTs Da'arul Ma'arif Pasawahan

Aplikasi untuk mengelola kehadiran guru piket dan siswa di MTs Da'arul Ma'arif Pasawahan.

## ✅ Fitur Lengkap

### Dashboard
- Ringkasan KBM harian (total siswa, guru, kelas, jadwal)
- Guru piket hari ini dengan input kehadiran
- Daftar siswa tidak hadir
- Cetak berita acara

### Monitoring KBM
- Tabel monitoring kehadiran guru per jam
- Filter berdasarkan shift (Pagi/Siang)
- Input status kehadiran langsung di tabel
- Warna hijau (hadir) dan merah (tidak hadir)

### Kehadiran Siswa
- Input kehadiran siswa per kelas
- Bulk selection untuk pilih banyak siswa
- Set status massal (Hadir, Sakit, Izin, Alfa, Kabur)
- Input keterangan per siswa
- Export kehadiran ke CSV

### Kehadiran Guru Piket
- Input kehadiran guru piket per hari dan shift
- Status Hadir/Tidak Hadir

### Data Siswa
- CRUD lengkap (Create, Read, Update, Delete)
- Bulk delete siswa terpilih
- Import dari CSV (format: Nama, Kelas)
- Export ke CSV
- Filter berdasarkan kelas
- Pencarian siswa

### Data Guru
- CRUD lengkap (Create, Read, Update, Delete)
- Bulk delete guru terpilih
- Export ke CSV

### Jadwal Piket
- CRUD lengkap jadwal piket
- Set guru piket per hari dan shift

### Laporan
- Rekap kehadiran bulanan
- Filter bulan dan tahun
- Rekap per kelas

### Pengaturan
- Nama sekolah
- Alamat sekolah
- Telepon & Email
- Kepala sekolah
- Semester & Tahun ajaran
- Logo sekolah (base64)

## Struktur Project

```
aplikasi-guru-piket-base44/
├── base44/
│   ├── entities/              # Schema database Base44
│   │   ├── Pengaturan.json
│   │   ├── Guru.json
│   │   ├── Kelas.json
│   │   ├── Siswa.json
│   │   ├── MataPelajaran.json
│   │   ├── Jadwal.json
│   │   ├── KehadiranGuru.json
│   │   ├── KehadiranSiswa.json
│   │   ├── JadwalPiket.json
│   │   └── KehadiranGuruPiket.json
│   ├── seed-data.json         # Data awal (guru, siswa, kelas, jadwal)
│   └── config.json            # Konfigurasi Base44
├── src/
│   ├── App.tsx               # Komponen utama aplikasi
│   ├── main.tsx              # Entry point
│   └── index.css             # Styling (Tailwind CSS)
├── public/
│   └── logo.svg              # Logo placeholder
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Data yang Disertakan

| Data | Jumlah |
|------|--------|
| Pengaturan | 1 record |
| Guru | 23 data |
| Kelas | 9 kelas |
| Siswa | 250 siswa |
| Jadwal Mengajar | 382 jadwal |
| Jadwal Piket | 12 jadwal |

## Deployment ke Base44

### Opsi 1: Via GitHub (Direkomendasikan)

1. **Push ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Aplikasi Guru Piket"
   git branch -M main
   git remote add origin https://github.com/USERNAME/aplikasi-guru-piket.git
   git push -u origin main
   ```

2. **Hubungkan ke Base44:**
   - Buka [Base44](https://base44.com)
   - Buat akun/login
   - Klik ikon GitHub di pojok kanan atas
   - Authorize dan pilih repository
   - Base44 akan otomatis deploy

### Opsi 2: Via Base44 CLI

```bash
# Install CLI
npm install -g @base44/cli

# Login
base44 login

# Deploy
base44 deploy
```

## Import Data Seed

Setelah deploy, import data awal:

1. Buka Base44 Dashboard
2. Pilih project
3. Buka menu Data
4. Import file `base44/seed-data.json`

Atau gunakan CLI:
```bash
base44 seed --file base44/seed-data.json
```

## Konfigurasi Database (Entities)

| Entity | Deskripsi |
|--------|-----------|
| Pengaturan | Konfigurasi sekolah |
| Guru | Data guru (kode, nama, gelar) |
| Kelas | Data kelas (nama, tingkat, shift) |
| Siswa | Data siswa dengan relasi ke kelas |
| Jadwal | Jadwal mengajar guru per kelas dan jam |
| KehadiranGuru | Kehadiran guru per jadwal |
| KehadiranSiswa | Kehadiran siswa harian |
| JadwalPiket | Jadwal piket guru per hari dan shift |
| KehadiranGuruPiket | Kehadiran guru piket |

## Teknologi

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Base44 NoSQL
- **SDK**: @base44/sdk
- **Date**: date-fns

## Sistem Shift

- **Shift Pagi**: 07:00 - 12:30 WIB (9 jam)
- **Shift Siang**: 12:40 - 17:00 WIB (8 jam)

## Status Kehadiran

### Guru
- `HADIR` - Guru hadir
- `TIDAK_HADIR` - Guru tidak hadir

### Siswa
- `HADIR` - Siswa hadir
- `SAKIT` - Siswa sakit
- `IZIN` - Siswa izin
- `ALFA` - Siswa alfa (tanpa keterangan)
- `KABUR` - Siswa kabur

## Format Import CSV

### Siswa
```csv
Nama,Kelas
Ahmad Fauzi,7A
Siti Aisyah,7A
```

### Guru
```csv
Kode,Nama,Gelar
G001,Ahmad Suryadi,S.Pd
G002,Siti Nurhaliza,M.Pd
```

## Pengembangan Lokal

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

## Dukungan

Jika mengalami masalah:
1. Baca [Dokumentasi Base44](https://docs.base44.com)
2. Hubungi support Base44

---

Dikembangkan untuk MTs Da'arul Ma'arif Pasawahan © 2025
