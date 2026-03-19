import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get('tanggal');
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
    
    const kehadiran = await db.kehadiranGuru.findMany({
      where,
      include: {
        jadwal: {
          include: {
            kelas: true,
          },
        },
        guru: true,
      },
      orderBy: [
        { tanggal: 'desc' },
        { jadwal: { jamKe: 'asc' } },
      ],
    });
    
    return NextResponse.json(kehadiran);
  } catch (error) {
    console.error('Error fetching kehadiran guru:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kehadiran guru' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk create/update
      const results = [];
      for (const item of body) {
        const { tanggal, jadwalId, guruId, status, keterangan } = item;
        const date = new Date(tanggal);
        
        const existing = await db.kehadiranGuru.findFirst({
          where: { tanggal: date, jadwalId },
        });
        
        if (existing) {
          const updated = await db.kehadiranGuru.update({
            where: { id: existing.id },
            data: { status, keterangan },
            include: {
              jadwal: { include: { kelas: true } },
              guru: true,
            },
          });
          results.push(updated);
        } else {
          const created = await db.kehadiranGuru.create({
            data: { tanggal: date, jadwalId, guruId, status, keterangan },
            include: {
              jadwal: { include: { kelas: true } },
              guru: true,
            },
          });
          results.push(created);
        }
      }
      return NextResponse.json(results);
    }
    
    const { tanggal, jadwalId, guruId, status, keterangan } = body;
    const date = new Date(tanggal);
    
    const existing = await db.kehadiranGuru.findFirst({
      where: { tanggal: date, jadwalId },
    });
    
    let kehadiran;
    if (existing) {
      kehadiran = await db.kehadiranGuru.update({
        where: { id: existing.id },
        data: { status, keterangan },
        include: {
          jadwal: { include: { kelas: true } },
          guru: true,
        },
      });
    } else {
      kehadiran = await db.kehadiranGuru.create({
        data: { tanggal: date, jadwalId, guruId, status, keterangan },
        include: {
          jadwal: { include: { kelas: true } },
          guru: true,
        },
      });
    }
    
    return NextResponse.json(kehadiran);
  } catch (error) {
    console.error('Error creating kehadiran guru:', error);
    return NextResponse.json({ error: 'Gagal menyimpan kehadiran guru' }, { status: 500 });
  }
}
