# 🚀 Panduan Deploy ke Vercel + Neon PostgreSQL

Aplikasi Guru Piket - MTs Da'arul Ma'arif Pasawahan

---

## 📋 Prasyarat

1. **GitHub Account** - untuk menyimpan kode
2. **Vercel Account** - gratis, signup dengan GitHub
3. **Neon Account** - untuk database PostgreSQL gratis

---

## 🔧 Langkah 1: Setup Database Neon

### 1.1 Buat Akun Neon
1. Buka https://neon.tech
2. Klik **"Sign Up"**
3. Pilih **"Sign up with GitHub"**
4. Authorize Neon

### 1.2 Buat Project Database
1. Klik **"Create a project"**
2. Isi form:
   - **Name**: `guru-piket-db`
   - **Region**: pilih terdekat (Singapore: `ap-southeast-1`)
3. Klik **"Create project"**

### 1.3 Salin Connection String
Setelah project dibuat, Neon akan menampilkan connection string:

```
postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Simpan baik-baik string ini!**

---

## 🚀 Langkah 2: Deploy ke Vercel

### 2.1 Buat Akun Vercel
1. Buka https://vercel.com
2. Klik **"Sign Up"**
3. Pilih **"Continue with GitHub"**
4. Authorize Vercel

### 2.2 Import Project
1. Di dashboard Vercel, klik **"Add New..."** → **"Project"**
2. Di bagian **"Import Git Repository"**:
   - Pilih repository: `madrasahimpian9-rgb/aplikasi-guru-piket`
   - Klik **"Import"**

### 2.3 Konfigurasi Project
1. **Framework Preset**: Next.js (otomatis terdeteksi)
2. **Root Directory**: `./` (default)
3. **Build Command**: `bun run build` (default)
4. **Output Directory**: `.next` (default)

### 2.4 Set Environment Variables
Di bagian **"Environment Variables"**, tambahkan:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_DATABASE_URL` | `postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |

> ⚠️ **Penting**: Gunakan connection string yang sama untuk kedua variabel.

### 2.5 Deploy
1. Klik **"Deploy"**
2. Tunggu proses build (2-5 menit)
3. Jika sukses, akan muncul **"Congratulations!"**

---

## 🌱 Langkah 3: Inisialisasi Database

### 3.1 Jalankan Migration
Setelah deploy pertama, database masih kosong. Jalankan migration:

**Option A: Via Vercel Dashboard**
1. Buka project di Vercel
2. Pilih tab **"Storage"** → **"Neon"**
3. Klik **"Query"** tab
4. Buka Prisma schema, copy SQL dan jalankan

**Option B: Via Local CLI (Recommended)**
```bash
# Set environment variable lokal
export DATABASE_URL="postgresql://..."

# Jalankan migration
bun run db:push

# Jalankan seed data
bun run db:seed
```

### 3.2 Verifikasi Data
Buka aplikasi di browser:
```
https://your-app.vercel.app
```

Pastikan:
- ✅ Dashboard menampilkan data
- ✅ Data guru tersedia
- ✅ Data kelas tersedia

---

## 📁 Struktur Environment Variables

### Untuk Development Lokal
Buat file `.env`:
```env
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="random-string-32-karakter"
NEXTAUTH_URL="http://localhost:3000"
```

### Untuk Production (Vercel)
Set di Vercel Dashboard → Settings → Environment Variables

---

## ⚙️ Konfigurasi Tambahan

### Custom Domain (Opsional)
1. Vercel Dashboard → Settings → Domains
2. Tambahkan domain Anda
3. Update DNS sesuai instruksi

### Auto Deploy
Setiap push ke branch `main` akan otomatis deploy ulang.

---

## 🔍 Troubleshooting

### Error: "P1001: Can't reach database server"
- Periksa `DATABASE_URL` sudah benar
- Pastikan IP Vercel tidak diblokir (Neon memblokir default)
- Di Neon, buka **"Connection Limit"** dan tambah

### Error: "P3009: migrate found failed migration"
```bash
# Reset database dan mulai dari awal
bun run db:push --force-reset
bun run db:seed
```

### Build Error: "Prisma Client could not be generated"
```bash
# Regenerate Prisma Client
bun run db:generate
```

---

## 📊 Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Guru      │────<│   Jadwal    │>────│   Kelas     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐
│ KehadiranGuru   │ │ KehadiranSiswa  │ │   Siswa     │
└─────────────────┘ └─────────────────┘ └─────────────┘
```

---

## 🆘 Bantuan

Jika mengalami masalah:
1. Cek Vercel Build Logs
2. Cek Neon Dashboard
3. Hubungi developer

---

## ✅ Checklist Deploy

- [ ] Akun GitHub sudah ada
- [ ] Akun Neon sudah dibuat
- [ ] Database Neon sudah dibuat
- [ ] Connection string sudah disalin
- [ ] Akun Vercel sudah dibuat
- [ ] Project sudah di-import
- [ ] Environment variables sudah di-set
- [ ] Build berhasil
- [ ] Migration sudah dijalankan
- [ ] Seed data sudah dijalankan
- [ ] Aplikasi bisa diakses

---

**Happy Deploying! 🎉**
