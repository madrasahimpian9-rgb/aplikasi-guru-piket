import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data dari SQLite yang sudah diexport
const seedData = {
  pengaturan: {
    id: "pengaturan-1",
    namaSekolah: "MTs Da'arul Ma'arif Pasawahan",
    alamatSekolah: "Kp. Pasawahan, Kec. Maleber, Kab. Kuningan",
    telepon: null,
    email: null,
    kepalaSekolah: "KH. M. Sulaeman",
    semester: "Genap",
    tahunAjaran: "2024/2025",
    logo: null
  },
  kelas: [
    { id: "kelas-7a", nama: "7A", tingkat: 7, shift: "PAGI" },
    { id: "kelas-7b", nama: "7B", tingkat: 7, shift: "PAGI" },
    { id: "kelas-7c", nama: "7C", tingkat: 7, shift: "PAGI" },
    { id: "kelas-8a", nama: "8A", tingkat: 8, shift: "SIANG" },
    { id: "kelas-8b", nama: "8B", tingkat: 8, shift: "SIANG" },
    { id: "kelas-8c", nama: "8C", tingkat: 8, shift: "SIANG" },
    { id: "kelas-9a", nama: "9A", tingkat: 9, shift: "PAGI" },
    { id: "kelas-9b", nama: "9B", tingkat: 9, shift: "PAGI" },
    { id: "kelas-9c", nama: "9C", tingkat: 9, shift: "SIANG" }
  ],
  guru: [
    { id: "guru-1", kode: "G001", nama: "Ahmad Suryadi", gelar: "S.Pd" },
    { id: "guru-2", kode: "G002", nama: "Siti Nurhaliza", gelar: "M.Pd" },
    { id: "guru-3", kode: "G003", nama: "Budi Santoso", gelar: "S.Pd.I" },
    { id: "guru-4", kode: "G004", nama: "Dewi Lestari", gelar: "S.Pd" },
    { id: "guru-5", kode: "G005", nama: "Eko Prasetyo", gelar: "S.Kom" },
    { id: "guru-6", kode: "G006", nama: "Fitri Handayani", gelar: "S.Pd" },
    { id: "guru-7", kode: "G007", nama: "Gunawan Wijaya", gelar: "M.Pd" },
    { id: "guru-8", kode: "G008", nama: "Hesti Wulandari", gelar: "S.Pd" },
    { id: "guru-9", kode: "G009", nama: "Irfan Hakim", gelar: "S.Pd" },
    { id: "guru-10", kode: "G010", nama: "Joko Susilo", gelar: "S.Ag" },
    { id: "guru-11", kode: "G011", nama: "Kartini Sari", gelar: "S.Pd" },
    { id: "guru-12", kode: "G012", nama: "Lukman Hakim", gelar: "M.Pd" },
    { id: "guru-13", kode: "G013", nama: "Maya Sari", gelar: "S.Pd" },
    { id: "guru-14", kode: "G014", nama: "Nana Supriatna", gelar: "S.Pd" },
    { id: "guru-15", kode: "G015", nama: "Oki Setiawan", gelar: "S.Kom" },
    { id: "guru-16", kode: "G016", nama: "Putri Rahayu", gelar: "S.Pd" },
    { id: "guru-17", kode: "G017", nama: "Qomariah", gelar: "S.Pd.I" },
    { id: "guru-18", kode: "G018", nama: "Rudi Hartono", gelar: "S.Pd" },
    { id: "guru-19", kode: "G019", nama: "Sri Mulyani", gelar: "M.Pd" },
    { id: "guru-20", kode: "G020", nama: "Tono Widodo", gelar: "S.Pd" },
    { id: "guru-21", kode: "G021", nama: "Umi Kulsum", gelar: "S.Ag" },
    { id: "guru-22", kode: "G022", nama: "Vina Melati", gelar: "S.Pd" },
    { id: "guru-23", kode: "G023", nama: "Wawan Setiawan", gelar: "S.Pd" }
  ]
};

// Hari untuk jadwal
const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Jam pelajaran per shift
const jamPagi = [
  { jamKe: 1, mulai: "07:00", selesai: "07:40" },
  { jamKe: 2, mulai: "07:40", selesai: "08:20" },
  { jamKe: 3, mulai: "08:20", selesai: "09:00" },
  { jamKe: 4, mulai: "09:15", selesai: "09:55" },
  { jamKe: 5, mulai: "09:55", selesai: "10:35" },
  { jamKe: 6, mulai: "10:35", selesai: "11:15" },
  { jamKe: 7, mulai: "11:15", selesai: "11:55" },
  { jamKe: 8, mulai: "11:55", selesai: "12:30" }
];

const jamSiang = [
  { jamKe: 1, mulai: "12:40", selesai: "13:20" },
  { jamKe: 2, mulai: "13:20", selesai: "14:00" },
  { jamKe: 3, mulai: "14:00", selesai: "14:40" },
  { jamKe: 4, mulai: "14:55", selesai: "15:35" },
  { jamKe: 5, mulai: "15:35", selesai: "16:15" },
  { jamKe: 6, mulai: "16:15", selesai: "17:00" }
];

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create Pengaturan
  console.log("📝 Creating pengaturan...");
  await prisma.pengaturan.upsert({
    where: { id: seedData.pengaturan.id },
    update: seedData.pengaturan,
    create: seedData.pengaturan
  });

  // 2. Create Kelas
  console.log("📚 Creating kelas...");
  for (const kelas of seedData.kelas) {
    await prisma.kelas.upsert({
      where: { id: kelas.id },
      update: kelas,
      create: kelas
    });
  }

  // 3. Create Guru
  console.log("👨‍🏫 Creating guru...");
  for (const guru of seedData.guru) {
    await prisma.guru.upsert({
      where: { id: guru.id },
      update: guru,
      create: guru
    });
  }

  // 4. Create Jadwal Piket
  console.log("📅 Creating jadwal piket...");
  const shiftList = ["PAGI", "SIANG"];
  let jadwalPiketId = 1;

  for (const hari of hariList) {
    for (const shift of shiftList) {
      const guruIndex = (hariList.indexOf(hari) * 2 + shiftList.indexOf(shift)) % seedData.guru.length;

      await prisma.jadwalPiket.upsert({
        where: {
          hari_shift: { hari, shift }
        },
        update: {
          guruId: seedData.guru[guruIndex].id
        },
        create: {
          id: `jp-${jadwalPiketId}`,
          hari,
          shift,
          guruId: seedData.guru[guruIndex].id
        }
      });
      jadwalPiketId++;
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log(`
📊 Summary:
- Pengaturan: 1
- Kelas: ${seedData.kelas.length}
- Guru: ${seedData.guru.length}
- Jadwal Piket: 12
`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
