import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1));
    const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()));
    const tipe = searchParams.get('tipe') || 'guru'; // 'guru' atau 'siswa'
    
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0);
    
    if (tipe === 'guru') {
      // Laporan kehadiran guru
      const kehadiranGuru = await db.kehadiranGuru.findMany({
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          guru: true,
          jadwal: {
            include: {
              kelas: true,
              mapel: true,
            },
          },
        },
        orderBy: [
          { guru: { nama: 'asc' } },
          { tanggal: 'asc' },
        ],
      });
      
      // Get all jadwal for the month
      const allJadwal = await db.jadwal.findMany({
        include: {
          guru: true,
          kelas: true,
          mapel: true,
        },
      });
      
      // Group by guru
      const guruIds = [...new Set(allJadwal.map(j => j.guruId))];
      const laporanGuru = await Promise.all(
        guruIds.map(async (guruId) => {
          const guru = await db.guru.findUnique({ where: { id: guruId } });
          const jadwalGuru = allJadwal.filter(j => j.guruId === guruId);
          const kehadiranGuruData = kehadiranGuru.filter(k => k.guruId === guruId);
          
          // Calculate total jam mengajar in the month (based on schedule * working days)
          const totalJam = jadwalGuru.length * 4; // Approximation: 4 weeks
          
          const hadir = kehadiranGuruData.filter(k => k.status === 'HADIR').length;
          const tidakHadir = kehadiranGuruData.filter(k => k.status === 'TIDAK_HADIR').length;
          
          return {
            guru,
            totalJam,
            hadir,
            tidakHadir,
            persentase: totalJam > 0 ? ((hadir / totalJam) * 100).toFixed(1) : '0.0',
          };
        })
      );
      
      return NextResponse.json({
        bulan,
        tahun,
        tipe: 'guru',
        data: laporanGuru.filter(l => l.guru !== null),
      });
    } else {
      // Laporan kehadiran siswa
      const kehadiranSiswa = await db.kehadiranSiswa.findMany({
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          siswa: true,
          kelas: true,
        },
        orderBy: [
          { kelas: { nama: 'asc' } },
          { siswa: { nama: 'asc' } },
        ],
      });
      
      // Get all siswa
      const allSiswa = await db.siswa.findMany({
        include: { kelas: true },
        orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }],
      });
      
      // Group by siswa
      const laporanSiswa = allSiswa.map(siswa => {
        const kehadiranSiswaData = kehadiranSiswa.filter(k => k.siswaId === siswa.id);
        
        // Calculate total days (approximation: 20 working days in a month)
        const totalHari = 20;
        
        return {
          siswa,
          kelas: siswa.kelas,
          totalHari,
          hadir: kehadiranSiswaData.filter(k => k.status === 'HADIR').length,
          sakit: kehadiranSiswaData.filter(k => k.status === 'SAKIT').length,
          izin: kehadiranSiswaData.filter(k => k.status === 'IZIN').length,
          alfa: kehadiranSiswaData.filter(k => k.status === 'ALFA').length,
          kabur: kehadiranSiswaData.filter(k => k.status === 'KABUR').length,
        };
      });
      
      return NextResponse.json({
        bulan,
        tahun,
        tipe: 'siswa',
        data: laporanSiswa,
      });
    }
  } catch (error) {
    console.error('Error fetching laporan:', error);
    return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 });
  }
}
