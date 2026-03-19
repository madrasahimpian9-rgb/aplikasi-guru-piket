import { db } from '../src/lib/db';

const guruData = [
  { kode: 'A', nama: 'KH M. Suleman', gelar: 'S.Pd.I' },
  { kode: 'B', nama: 'Muhammad Tonowi', gelar: 'S.Pd.I' },
  { kode: 'C', nama: 'Mahmudun', gelar: 'S.Pd.' },
  { kode: 'D', nama: 'Ahmad Satibi', gelar: 'S.Pd.' },
  { kode: 'E', nama: 'Sarif Hidayat', gelar: 'S.Pd.' },
  { kode: 'F', nama: 'Sari Ridiyanti', gelar: 'S.Pd.' },
  { kode: 'G', nama: 'Syifa Nurfadilah', gelar: 'S.Pd.' },
  { kode: 'H', nama: 'Imma Anggraini', gelar: 'S.Pd.' },
  { kode: 'I', nama: 'M Lufti Kamaludin', gelar: 'SH' },
  { kode: 'J', nama: 'Dede Rosmawati', gelar: 'S.Pd.I' },
  { kode: 'K', nama: 'Iman Lukman Nul Hakim', gelar: 'S.Pd' },
  { kode: 'L', nama: 'Idham Maulana', gelar: 'S.Pd' },
  { kode: 'M', nama: 'M Arif Kharisyyahbud', gelar: 'S.Pd' },
  { kode: 'N', nama: 'Eva Novianti', gelar: 'S.Pd' },
  { kode: 'O', nama: 'Tika Mei Sendy', gelar: 'S.Pd.I' },
  { kode: 'P', nama: 'Saeful Anwar', gelar: 'SE' },
  { kode: 'Q', nama: 'Irfan Khoirul Huda', gelar: 'S.Pd' },
  { kode: 'R', nama: 'Wati Suleytiyawati', gelar: 'S.Pd' },
];

const mapelData = [
  { kode: 'AA', nama: 'Aqidah Akhlak' },
  { kode: 'QH', nama: 'Al-Quran Hadits' },
  { kode: 'FH', nama: 'Fiqih' },
  { kode: 'SI', nama: 'Sejarah Islam' },
  { kode: 'BIN', nama: 'Bahasa Indonesia' },
  { kode: 'BAR', nama: 'Bahasa Arab' },
  { kode: 'BIG', nama: 'Bahasa Inggris' },
  { kode: 'BDS', nama: 'Bahasa Sunda' },
  { kode: 'MTK', nama: 'Matematika' },
  { kode: 'IPA', nama: 'IPA' },
  { kode: 'IPS', nama: 'IPS' },
  { kode: 'SBK', nama: 'Seni Budaya' },
  { kode: 'PRA', nama: 'Prakarya' },
  { kode: 'PJK', nama: 'PJOK' },
  { kode: 'TIK', nama: 'TIK' },
  { kode: 'BK', nama: 'Bimbingan Konseling' },
  { kode: 'UPC', nama: 'Upacara' },
];

const kelasData = [
  { nama: '9A', tingkat: 9, shift: 'PAGI' },
  { nama: '9B', tingkat: 9, shift: 'PAGI' },
  { nama: '9C', tingkat: 9, shift: 'PAGI' },
  { nama: '9D', tingkat: 9, shift: 'PAGI' },
  { nama: '7A', tingkat: 7, shift: 'SIANG' },
  { nama: '7B', tingkat: 7, shift: 'SIANG' },
  { nama: '7C', tingkat: 7, shift: 'SIANG' },
  { nama: '7D', tingkat: 7, shift: 'SIANG' },
  { nama: '8A', tingkat: 8, shift: 'SIANG' },
  { nama: '8B', tingkat: 8, shift: 'SIANG' },
  { nama: '8C', tingkat: 8, shift: 'SIANG' },
  { nama: '8D', tingkat: 8, shift: 'SIANG' },
];

const jadwalPagi = [
  { hari: 'Senin', jamKe: 0, waktuMulai: '06:30', waktuSelesai: '07:00', mapelKode: 'UPC', guruKode: 'A' },
  { hari: 'Senin', jamKe: 1, waktuMulai: '07:00', waktuSelesai: '07:30', mapelKode: 'AA', guruKode: 'M' },
  { hari: 'Senin', jamKe: 2, waktuMulai: '07:30', waktuSelesai: '08:00', mapelKode: 'BAR', guruKode: 'B' },
  { hari: 'Senin', jamKe: 3, waktuMulai: '08:00', waktuSelesai: '08:45', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Senin', jamKe: 4, waktuMulai: '08:45', waktuSelesai: '09:20', mapelKode: 'BIG', guruKode: 'D' },
  { hari: 'Senin', jamKe: 5, waktuMulai: '09:20', waktuSelesai: '10:40', mapelKode: 'IPA', guruKode: 'E' },
  { hari: 'Senin', jamKe: 6, waktuMulai: '10:40', waktuSelesai: '11:25', mapelKode: 'BIN', guruKode: 'F' },
  { hari: 'Senin', jamKe: 7, waktuMulai: '11:25', waktuSelesai: '12:00', mapelKode: 'SBK', guruKode: 'G' },
  { hari: 'Selasa', jamKe: 1, waktuMulai: '07:00', waktuSelesai: '07:30', mapelKode: 'QH', guruKode: 'L' },
  { hari: 'Selasa', jamKe: 2, waktuMulai: '07:30', waktuSelesai: '08:00', mapelKode: 'FH', guruKode: 'J' },
  { hari: 'Selasa', jamKe: 3, waktuMulai: '08:00', waktuSelesai: '08:45', mapelKode: 'IPS', guruKode: 'H' },
  { hari: 'Selasa', jamKe: 4, waktuMulai: '08:45', waktuSelesai: '09:20', mapelKode: 'PRA', guruKode: 'N' },
  { hari: 'Selasa', jamKe: 5, waktuMulai: '09:20', waktuSelesai: '10:40', mapelKode: 'PJK', guruKode: 'O' },
  { hari: 'Selasa', jamKe: 6, waktuMulai: '10:40', waktuSelesai: '11:25', mapelKode: 'TIK', guruKode: 'Q' },
  { hari: 'Selasa', jamKe: 7, waktuMulai: '11:25', waktuSelesai: '12:00', mapelKode: 'BK', guruKode: 'P' },
  { hari: 'Rabu', jamKe: 1, waktuMulai: '07:00', waktuSelesai: '07:30', mapelKode: 'SI', guruKode: 'K' },
  { hari: 'Rabu', jamKe: 2, waktuMulai: '07:30', waktuSelesai: '08:00', mapelKode: 'BDS', guruKode: 'I' },
  { hari: 'Rabu', jamKe: 3, waktuMulai: '08:00', waktuSelesai: '08:45', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Rabu', jamKe: 4, waktuMulai: '08:45', waktuSelesai: '09:20', mapelKode: 'IPA', guruKode: 'E' },
  { hari: 'Rabu', jamKe: 5, waktuMulai: '09:20', waktuSelesai: '10:40', mapelKode: 'BIG', guruKode: 'R' },
  { hari: 'Rabu', jamKe: 6, waktuMulai: '10:40', waktuSelesai: '11:25', mapelKode: 'BIN', guruKode: 'F' },
  { hari: 'Rabu', jamKe: 7, waktuMulai: '11:25', waktuSelesai: '12:00', mapelKode: 'IPS', guruKode: 'H' },
  { hari: 'Kamis', jamKe: 1, waktuMulai: '07:00', waktuSelesai: '07:30', mapelKode: 'AA', guruKode: 'M' },
  { hari: 'Kamis', jamKe: 2, waktuMulai: '07:30', waktuSelesai: '08:00', mapelKode: 'BAR', guruKode: 'B' },
  { hari: 'Kamis', jamKe: 3, waktuMulai: '08:00', waktuSelesai: '08:45', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Kamis', jamKe: 4, waktuMulai: '08:45', waktuSelesai: '09:20', mapelKode: 'QH', guruKode: 'L' },
  { hari: 'Kamis', jamKe: 5, waktuMulai: '09:20', waktuSelesai: '10:40', mapelKode: 'IPA', guruKode: 'E' },
  { hari: 'Kamis', jamKe: 6, waktuMulai: '10:40', waktuSelesai: '11:25', mapelKode: 'FH', guruKode: 'J' },
  { hari: 'Kamis', jamKe: 7, waktuMulai: '11:25', waktuSelesai: '12:00', mapelKode: 'SBK', guruKode: 'G' },
  { hari: 'Jumat', jamKe: 1, waktuMulai: '07:00', waktuSelesai: '07:30', mapelKode: 'SI', guruKode: 'K' },
  { hari: 'Jumat', jamKe: 2, waktuMulai: '07:30', waktuSelesai: '08:00', mapelKode: 'BDS', guruKode: 'I' },
  { hari: 'Jumat', jamKe: 3, waktuMulai: '08:00', waktuSelesai: '08:45', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Jumat', jamKe: 4, waktuMulai: '08:45', waktuSelesai: '09:20', mapelKode: 'BIG', guruKode: 'D' },
  { hari: 'Jumat', jamKe: 5, waktuMulai: '09:20', waktuSelesai: '10:40', mapelKode: 'PRA', guruKode: 'N' },
  { hari: 'Jumat', jamKe: 6, waktuMulai: '10:40', waktuSelesai: '11:25', mapelKode: 'PJK', guruKode: 'O' },
  { hari: 'Sabtu', jamKe: 1, waktuMulai: '06:30', waktuSelesai: '07:00', mapelKode: 'AA', guruKode: 'M' },
  { hari: 'Sabtu', jamKe: 2, waktuMulai: '07:00', waktuSelesai: '07:30', mapelKode: 'BAR', guruKode: 'B' },
  { hari: 'Sabtu', jamKe: 3, waktuMulai: '07:30', waktuSelesai: '08:00', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Sabtu', jamKe: 4, waktuMulai: '08:00', waktuSelesai: '08:45', mapelKode: 'TIK', guruKode: 'Q' },
  { hari: 'Sabtu', jamKe: 5, waktuMulai: '08:45', waktuSelesai: '09:20', mapelKode: 'BK', guruKode: 'P' },
  { hari: 'Sabtu', jamKe: 6, waktuMulai: '09:20', waktuSelesai: '10:40', mapelKode: 'BIG', guruKode: 'R' },
  { hari: 'Sabtu', jamKe: 7, waktuMulai: '10:40', waktuSelesai: '11:25', mapelKode: 'BIN', guruKode: 'F' },
];

const jadwalSiang = [
  { hari: 'Senin', jamKe: 1, waktuMulai: '12:40', waktuSelesai: '13:10', mapelKode: 'AA', guruKode: 'M' },
  { hari: 'Senin', jamKe: 2, waktuMulai: '13:10', waktuSelesai: '13:40', mapelKode: 'BAR', guruKode: 'B' },
  { hari: 'Senin', jamKe: 3, waktuMulai: '13:40', waktuSelesai: '14:10', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Senin', jamKe: 4, waktuMulai: '14:10', waktuSelesai: '14:40', mapelKode: 'BIG', guruKode: 'D' },
  { hari: 'Senin', jamKe: 5, waktuMulai: '14:40', waktuSelesai: '15:10', mapelKode: 'IPA', guruKode: 'E' },
  { hari: 'Senin', jamKe: 6, waktuMulai: '15:10', waktuSelesai: '15:40', mapelKode: 'BIN', guruKode: 'F' },
  { hari: 'Senin', jamKe: 7, waktuMulai: '15:40', waktuSelesai: '16:10', mapelKode: 'SBK', guruKode: 'G' },
  { hari: 'Selasa', jamKe: 1, waktuMulai: '12:40', waktuSelesai: '13:10', mapelKode: 'QH', guruKode: 'L' },
  { hari: 'Selasa', jamKe: 2, waktuMulai: '13:10', waktuSelesai: '13:40', mapelKode: 'FH', guruKode: 'J' },
  { hari: 'Selasa', jamKe: 3, waktuMulai: '13:40', waktuSelesai: '14:10', mapelKode: 'IPS', guruKode: 'H' },
  { hari: 'Selasa', jamKe: 4, waktuMulai: '14:10', waktuSelesai: '14:40', mapelKode: 'PRA', guruKode: 'N' },
  { hari: 'Selasa', jamKe: 5, waktuMulai: '14:40', waktuSelesai: '15:10', mapelKode: 'PJK', guruKode: 'O' },
  { hari: 'Selasa', jamKe: 6, waktuMulai: '15:10', waktuSelesai: '15:40', mapelKode: 'TIK', guruKode: 'Q' },
  { hari: 'Selasa', jamKe: 7, waktuMulai: '15:40', waktuSelesai: '16:00', mapelKode: 'BK', guruKode: 'P' },
  { hari: 'Rabu', jamKe: 1, waktuMulai: '12:40', waktuSelesai: '13:10', mapelKode: 'SI', guruKode: 'K' },
  { hari: 'Rabu', jamKe: 2, waktuMulai: '13:10', waktuSelesai: '13:40', mapelKode: 'BDS', guruKode: 'I' },
  { hari: 'Rabu', jamKe: 3, waktuMulai: '13:40', waktuSelesai: '14:10', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Rabu', jamKe: 4, waktuMulai: '14:10', waktuSelesai: '14:40', mapelKode: 'IPA', guruKode: 'E' },
  { hari: 'Rabu', jamKe: 5, waktuMulai: '14:40', waktuSelesai: '15:10', mapelKode: 'BIG', guruKode: 'R' },
  { hari: 'Rabu', jamKe: 6, waktuMulai: '15:10', waktuSelesai: '15:40', mapelKode: 'BIN', guruKode: 'F' },
  { hari: 'Rabu', jamKe: 7, waktuMulai: '15:40', waktuSelesai: '16:00', mapelKode: 'IPS', guruKode: 'H' },
  { hari: 'Kamis', jamKe: 1, waktuMulai: '12:40', waktuSelesai: '13:10', mapelKode: 'AA', guruKode: 'M' },
  { hari: 'Kamis', jamKe: 2, waktuMulai: '13:10', waktuSelesai: '13:40', mapelKode: 'BAR', guruKode: 'B' },
  { hari: 'Kamis', jamKe: 3, waktuMulai: '13:40', waktuSelesai: '14:10', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Kamis', jamKe: 4, waktuMulai: '14:10', waktuSelesai: '14:40', mapelKode: 'QH', guruKode: 'L' },
  { hari: 'Kamis', jamKe: 5, waktuMulai: '14:40', waktuSelesai: '15:10', mapelKode: 'IPA', guruKode: 'E' },
  { hari: 'Kamis', jamKe: 6, waktuMulai: '15:10', waktuSelesai: '15:40', mapelKode: 'FH', guruKode: 'J' },
  { hari: 'Kamis', jamKe: 7, waktuMulai: '15:40', waktuSelesai: '16:10', mapelKode: 'SBK', guruKode: 'G' },
  { hari: 'Kamis', jamKe: 8, waktuMulai: '16:30', waktuSelesai: '17:00', mapelKode: 'IPS', guruKode: 'H' },
  { hari: 'Jumat', jamKe: 1, waktuMulai: '12:40', waktuSelesai: '13:10', mapelKode: 'SI', guruKode: 'K' },
  { hari: 'Jumat', jamKe: 2, waktuMulai: '13:10', waktuSelesai: '13:40', mapelKode: 'BDS', guruKode: 'I' },
  { hari: 'Jumat', jamKe: 3, waktuMulai: '13:40', waktuSelesai: '14:10', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Jumat', jamKe: 4, waktuMulai: '14:10', waktuSelesai: '14:40', mapelKode: 'BIG', guruKode: 'D' },
  { hari: 'Jumat', jamKe: 5, waktuMulai: '14:40', waktuSelesai: '15:10', mapelKode: 'PRA', guruKode: 'N' },
  { hari: 'Jumat', jamKe: 6, waktuMulai: '15:10', waktuSelesai: '15:40', mapelKode: 'PJK', guruKode: 'O' },
  { hari: 'Jumat', jamKe: 7, waktuMulai: '15:40', waktuSelesai: '16:30', mapelKode: 'TIK', guruKode: 'Q' },
  { hari: 'Sabtu', jamKe: 1, waktuMulai: '12:40', waktuSelesai: '13:10', mapelKode: 'AA', guruKode: 'M' },
  { hari: 'Sabtu', jamKe: 2, waktuMulai: '13:10', waktuSelesai: '13:40', mapelKode: 'BAR', guruKode: 'B' },
  { hari: 'Sabtu', jamKe: 3, waktuMulai: '13:40', waktuSelesai: '14:10', mapelKode: 'MTK', guruKode: 'C' },
  { hari: 'Sabtu', jamKe: 4, waktuMulai: '14:10', waktuSelesai: '14:40', mapelKode: 'TIK', guruKode: 'Q' },
  { hari: 'Sabtu', jamKe: 5, waktuMulai: '14:40', waktuSelesai: '15:10', mapelKode: 'BK', guruKode: 'P' },
  { hari: 'Sabtu', jamKe: 6, waktuMulai: '15:10', waktuSelesai: '15:40', mapelKode: 'BIG', guruKode: 'R' },
  { hari: 'Sabtu', jamKe: 7, waktuMulai: '15:40', waktuSelesai: '16:10', mapelKode: 'BIN', guruKode: 'F' },
  { hari: 'Sabtu', jamKe: 8, waktuMulai: '16:30', waktuSelesai: '17:00', mapelKode: 'IPS', guruKode: 'H' },
];

async function seed() {
  console.log('Seeding database...');

  console.log('Clearing existing data...');
  await db.kehadiranSiswa.deleteMany();
  await db.kehadiranGuru.deleteMany();
  await db.jadwal.deleteMany();
  await db.siswa.deleteMany();
  await db.kelas.deleteMany();
  await db.mataPelajaran.deleteMany();
  await db.guru.deleteMany();
  await db.pengaturan.deleteMany();

  console.log('Creating pengaturan...');
  await db.pengaturan.create({
    data: {
      namaSekolah: "MTs Da'arul Ma'arif Pasawahan",
      alamatSekolah: 'Kp. Pasawahan, Kec. Pasawahan',
      semester: 'Genap',
      tahunAjaran: '2025/2026',
      kepalaSekolah: 'Muhamad Tontowi, S.Pd.I',
    },
  });

  console.log('Creating guru...');
  const guru = await Promise.all(guruData.map((g) => db.guru.create({ data: g })));
  const guruMap = new Map(guru.map((g) => [g.kode, g.id]));

  console.log('Creating mata pelajaran...');
  const mapel = await Promise.all(mapelData.map((m) => db.mataPelajaran.create({ data: m })));
  const mapelMap = new Map(mapel.map((m) => [m.kode, m.id]));

  console.log('Creating kelas...');
  const kelas = await Promise.all(kelasData.map((k) => db.kelas.create({ data: k })));
  const kelasMap = new Map(kelas.map((k) => [k.nama, k.id]));

  console.log('Creating jadwal...');
  for (const k of kelas) {
    const isPagi = k.shift === 'PAGI';
    const jadwalData = isPagi ? jadwalPagi : jadwalSiang;

    for (const j of jadwalData) {
      await db.jadwal.create({
        data: {
          hari: j.hari,
          jamKe: j.jamKe,
          waktuMulai: j.waktuMulai,
          waktuSelesai: j.waktuSelesai,
          kelasId: k.id,
          mapelId: mapelMap.get(j.mapelKode)!,
          guruId: guruMap.get(j.guruKode)!,
        },
      });
    }
  }

  console.log('Creating sample siswa...');
  const sampleNames = [
    'Ahmad Rizki',
    'Siti Nurhaliza',
    'Muhammad Farhan',
    'Anisa Putri',
    'Dedi Kurniawan',
    'Nurul Hidayah',
    'Rizal Firmansyah',
    'Dewi Lestari',
    'Budi Santoso',
    'Fitri Handayani',
    'Agus Pratama',
    'Rina Susanti',
    'Hendra Wijaya',
    'Maya Sari',
    'Rudi Hermawan',
    'Indah Permata',
  ];

  for (const k of kelas) {
    for (let i = 0; i < 8; i++) {
      await db.siswa.create({
        data: {
          nama: sampleNames[i],
          kelasId: k.id,
        },
      });
    }
  }

  console.log('Seeding completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
