import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get('tanggal');
    const kelasId = searchParams.get('kelasId');
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    
    let where: Record<string, unknown> = {};
    
    if (tanggal) {
      const date = new Date(tanggal);
      where.tanggal = date;
    } else if (bulan && tahun) {
      const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1);
      const endDate = new Date(parseInt(tahun), parseInt(bulan), 0);
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }
    
    if (kelasId) {
      where.kelasId = kelasId;
    }
    
    const kehadiran = await db.kehadiranSiswa.findMany({
      where,
      include: {
        siswa: true,
        kelas: true,
      },
      orderBy: [
        { tanggal: 'desc' },
        { siswa: { nama: 'asc' } },
      ],
    });
    
    return NextResponse.json(kehadiran);
  } catch (error) {
    console.error('Error fetching kehadiran siswa:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kehadiran siswa' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk create/update
      const results = [];
      for (const item of body) {
        const { tanggal, siswaId, kelasId, status, keterangan } = item;
        const date = new Date(tanggal);
        
        const existing = await db.kehadiranSiswa.findFirst({
          where: { tanggal: date, siswaId },
        });
        
        if (existing) {
          const updated = await db.kehadiranSiswa.update({
            where: { id: existing.id },
            data: { status, keterangan },
            include: {
              siswa: true,
              kelas: true,
            },
          });
          results.push(updated);
        } else {
          const created = await db.kehadiranSiswa.create({
            data: { tanggal: date, siswaId, kelasId, status, keterangan },
            include: {
              siswa: true,
              kelas: true,
            },
          });
          results.push(created);
        }
      }
      return NextResponse.json(results);
    }
    
    const { tanggal, siswaId, kelasId, status, keterangan } = body;
    const date = new Date(tanggal);
    
    const existing = await db.kehadiranSiswa.findFirst({
      where: { tanggal: date, siswaId },
    });
    
    let kehadiran;
    if (existing) {
      kehadiran = await db.kehadiranSiswa.update({
        where: { id: existing.id },
        data: { status, keterangan },
        include: {
          siswa: true,
          kelas: true,
        },
      });
    } else {
      kehadiran = await db.kehadiranSiswa.create({
        data: { tanggal: date, siswaId, kelasId, status, keterangan },
        include: {
          siswa: true,
          kelas: true,
        },
      });
    }
    
    return NextResponse.json(kehadiran);
  } catch (error) {
    console.error('Error creating kehadiran siswa:', error);
    return NextResponse.json({ error: 'Gagal menyimpan kehadiran siswa' }, { status: 500 });
  }
}
