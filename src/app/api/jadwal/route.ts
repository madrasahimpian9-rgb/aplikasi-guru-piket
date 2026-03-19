import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hari = searchParams.get('hari');
    const kelasId = searchParams.get('kelasId');
    const guruId = searchParams.get('guruId');
    
    const where: Record<string, string> = {};
    if (hari) where.hari = hari;
    if (kelasId) where.kelasId = kelasId;
    if (guruId) where.guruId = guruId;
    
    const jadwal = await db.jadwal.findMany({
      where,
      include: {
        kelas: true,
        guru: true,
      },
      orderBy: [
        { hari: 'asc' },
        { jamKe: 'asc' },
        { kelas: { nama: 'asc' } },
      ],
    });
    
    return NextResponse.json(jadwal);
  } catch (error) {
    console.error('Error fetching jadwal:', error);
    return NextResponse.json({ error: 'Gagal mengambil data jadwal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk create for upload - delete existing first
      await db.jadwal.deleteMany({});
      const jadwal = await db.jadwal.createMany({
        data: body.map((j: { hari: string; jamKe: number; waktuMulai: string; waktuSelesai: string; kelasId: string; guruId: string }) => ({
          hari: j.hari,
          jamKe: j.jamKe,
          waktuMulai: j.waktuMulai,
          waktuSelesai: j.waktuSelesai,
          kelasId: j.kelasId,
          guruId: j.guruId,
          mapelId: null,
        })),
        skipDuplicates: true,
      });
      return NextResponse.json(jadwal);
    }
    
    const { hari, jamKe, waktuMulai, waktuSelesai, kelasId, guruId } = body;
    
    const existingJadwal = await db.jadwal.findFirst({
      where: { hari, jamKe, kelasId },
    });
    
    if (existingJadwal) {
      return NextResponse.json({ error: 'Jadwal untuk slot ini sudah ada' }, { status: 400 });
    }
    
    const jadwal = await db.jadwal.create({
      data: { hari, jamKe, waktuMulai, waktuSelesai, kelasId, guruId, mapelId: null },
      include: {
        kelas: true,
        guru: true,
      },
    });
    
    return NextResponse.json(jadwal);
  } catch (error) {
    console.error('Error creating jadwal:', error);
    return NextResponse.json({ error: 'Gagal menambah jadwal' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, hari, jamKe, waktuMulai, waktuSelesai, kelasId, guruId } = body;
    
    const existingJadwal = await db.jadwal.findFirst({
      where: { 
        hari,
        jamKe,
        kelasId,
        NOT: { id },
      },
    });
    
    if (existingJadwal) {
      return NextResponse.json({ error: 'Jadwal untuk slot ini sudah ada' }, { status: 400 });
    }
    
    const jadwal = await db.jadwal.update({
      where: { id },
      data: { hari, jamKe, waktuMulai, waktuSelesai, kelasId, guruId },
      include: {
        kelas: true,
        guru: true,
      },
    });
    
    return NextResponse.json(jadwal);
  } catch (error) {
    console.error('Error updating jadwal:', error);
    return NextResponse.json({ error: 'Gagal mengupdate jadwal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID jadwal diperlukan' }, { status: 400 });
    }
    
    // Delete related kehadiran guru first (cascade delete)
    await db.kehadiranGuru.deleteMany({
      where: { jadwalId: id },
    });
    
    // Then delete the jadwal
    await db.jadwal.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting jadwal:', error);
    return NextResponse.json({ error: 'Gagal menghapus jadwal' }, { status: 500 });
  }
}
