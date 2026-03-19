import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hari, shift, jadwalData } = body;
    
    if (!hari || !shift || !Array.isArray(jadwalData)) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Get all kelas for this shift to find their IDs
    const kelasShift = await db.kelas.findMany({
      where: { shift },
    });
    
    const kelasIds = kelasShift.map(k => k.id);
    
    // Delete existing kehadiranGuru first (cascade delete)
    if (kelasIds.length > 0) {
      const existingJadwal = await db.jadwal.findMany({
        where: {
          hari,
          kelasId: { in: kelasIds },
        },
        select: { id: true },
      });
      
      const jadwalIds = existingJadwal.map(j => j.id);
      
      if (jadwalIds.length > 0) {
        await db.kehadiranGuru.deleteMany({
          where: { jadwalId: { in: jadwalIds } },
        });
      }
    }
    
    // Delete existing jadwal for this hari and shift
    await db.jadwal.deleteMany({
      where: {
        hari,
        kelasId: { in: kelasIds },
      },
    });
    
    // Create new jadwal entries
    if (jadwalData.length > 0) {
      await db.jadwal.createMany({
        data: jadwalData.map(j => ({
          hari: j.hari,
          jamKe: j.jamKe,
          waktuMulai: j.waktuMulai,
          waktuSelesai: j.waktuSelesai,
          kelasId: j.kelasId,
          guruId: j.guruId,
          mapelId: null, // Explicitly set to null
        })),
        skipDuplicates: true,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      count: jadwalData.length,
      message: `Berhasil menyimpan ${jadwalData.length} jadwal` 
    });
  } catch (error) {
    console.error('Error saving bulk jadwal:', error);
    return NextResponse.json({ error: 'Gagal menyimpan jadwal' }, { status: 500 });
  }
}
