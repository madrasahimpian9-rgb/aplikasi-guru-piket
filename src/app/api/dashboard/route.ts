import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
    const date = new Date(tanggal);
    const hariIni = HARI[date.getDay()];
    
    // Get jadwal hari ini
    const jadwalHariIni = await db.jadwal.findMany({
      where: { hari: hariIni },
      include: {
        kelas: true,
        guru: true,
      },
      orderBy: [
        { jamKe: 'asc' },
        { kelas: { nama: 'asc' } },
      ],
    });
    
    // Get kehadiran guru hari ini
    const kehadiranGuru = await db.kehadiranGuru.findMany({
      where: { tanggal: date },
      include: {
        jadwal: {
          include: {
            kelas: true,
          },
        },
        guru: true,
      },
    });
    
    // Get kehadiran siswa hari ini
    const kehadiranSiswa = await db.kehadiranSiswa.findMany({
      where: { tanggal: date },
      include: {
        siswa: true,
        kelas: true,
      },
    });
    
    // Get total siswa
    const totalSiswa = await db.siswa.count();
    
    // Get total guru
    const totalGuru = await db.guru.count();
    
    // Get total kelas
    const totalKelas = await db.kelas.count();
    
    // Summary ketidakhadiran siswa per kelas
    const kelasList = await db.kelas.findMany({
      include: {
        _count: { select: { siswa: true } },
      },
      orderBy: { nama: 'asc' },
    });
    
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
    const guruHadir = kehadiranGuru.filter(k => k.status === 'HADIR').length;
    const guruTidakHadir = kehadiranGuru.filter(k => k.status === 'TIDAK_HADIR').length;
    
    // Guru yang mengajar hari ini (unique)
    const guruMengajarHariIni = [...new Set(jadwalHariIni.map(j => j.guruId))];
    
    return NextResponse.json({
      tanggal,
      hari: hariIni,
      jadwalHariIni,
      kehadiranGuru,
      kehadiranSiswa,
      ketidakhadiranPerKelas,
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
