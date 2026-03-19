import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
    const date = new Date(tanggal);
    const hariIni = HARI[date.getDay()];
    
    // Run all independent queries in parallel for better performance
    const [
      jadwalHariIni,
      kehadiranGuru,
      kehadiranSiswa,
      totalSiswa,
      totalGuru,
      totalKelas,
      jadwalPiketHariIni,
      kehadiranGuruPiket,
      kelasList,
    ] = await Promise.all([
      // Get jadwal hari ini
      db.jadwal.findMany({
        where: { hari: hariIni },
        include: {
          kelas: true,
          guru: true,
        },
        orderBy: [
          { jamKe: 'asc' },
          { kelas: { nama: 'asc' } },
        ],
      }),
      // Get kehadiran guru hari ini
      db.kehadiranGuru.findMany({
        where: { tanggal: date },
        include: {
          jadwal: {
            include: {
              kelas: true,
            },
          },
          guru: true,
        },
      }),
      // Get kehadiran siswa hari ini
      db.kehadiranSiswa.findMany({
        where: { tanggal: date },
        include: {
          siswa: true,
          kelas: true,
        },
      }),
      // Get total siswa
      db.siswa.count(),
      // Get total guru
      db.guru.count(),
      // Get total kelas
      db.kelas.count(),
      // Get guru piket hari ini (for both shifts)
      db.jadwalPiket.findMany({
        where: { hari: hariIni },
        include: {
          guru: true,
        },
      }),
      // Get kehadiran guru piket hari ini
      db.kehadiranGuruPiket.findMany({
        where: { tanggal: date },
        include: {
          guru: true,
        },
      }),
      // Get kelas list with student count
      db.kelas.findMany({
        include: {
          _count: { select: { siswa: true } },
        },
        orderBy: { nama: 'asc' },
      }),
    ]);
    
    const ketidakhadiranPerKelas = kelasList.map(kelas => {
      const kelasKehadiran = kehadiranSiswa.filter(k => k.kelasId === kelas.id);
      
      return {
        kelasId: kelas.id,
        kelas: kelas.nama,
        shift: kelas.shift,
        totalSiswa: kelas._count.siswa,
        hadir: kelasKehadiran.filter(k => k.status === 'HADIR').length,
        sakit: kelasKehadiran.filter(k => k.status === 'SAKIT').length,
        izin: kelasKehadiran.filter(k => k.status === 'IZIN').length,
        alfa: kelasKehadiran.filter(k => k.status === 'ALFA').length,
        kabur: kelasKehadiran.filter(k => k.status === 'KABUR').length,
        belumInput: kelas._count.siswa - kelasKehadiran.length,
      };
    });
    
    // Summary guru hadir/tidak hadir
    // Default is HADIR, so count TIDAK_HADIR from records, and hadir = total jadwal - tidak hadir
    const guruTidakHadir = kehadiranGuru.filter(k => k.status === 'TIDAK_HADIR').length;
    const guruHadir = jadwalHariIni.length - guruTidakHadir;
    
    // Guru yang mengajar hari ini (unique)
    const guruMengajarHariIni = [...new Set(jadwalHariIni.map(j => j.guruId))];
    
    return NextResponse.json({
      tanggal,
      hari: hariIni,
      jadwalHariIni,
      kehadiranGuru,
      kehadiranSiswa,
      ketidakhadiranPerKelas,
      jadwalPiketHariIni,
      kehadiranGuruPiket,
      summary: {
        totalSiswa,
        totalGuru,
        totalKelas,
        totalJadwalHariIni: jadwalHariIni.length,
        guruMengajarHariIni: guruMengajarHariIni.length,
        guruHadir,
        guruTidakHadir,
        siswaHadir: kehadiranSiswa.filter(k => k.status === 'HADIR').length,
        siswaSakit: kehadiranSiswa.filter(k => k.status === 'SAKIT').length,
        siswaIzin: kehadiranSiswa.filter(k => k.status === 'IZIN').length,
        siswaAlfa: kehadiranSiswa.filter(k => k.status === 'ALFA').length,
        siswaKabur: kehadiranSiswa.filter(k => k.status === 'KABUR').length,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dashboard' }, { status: 500 });
  }
}
