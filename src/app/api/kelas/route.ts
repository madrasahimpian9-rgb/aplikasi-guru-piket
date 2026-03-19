import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const kelas = await db.kelas.findMany({
      include: {
        _count: {
          select: { siswa: true },
        },
      },
      orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }],
    });
    
    return NextResponse.json(kelas);
  } catch (error) {
    console.error('Error fetching kelas:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kelas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, tingkat, shift } = body;
    
    const existingKelas = await db.kelas.findUnique({
      where: { nama },
    });
    
    if (existingKelas) {
      return NextResponse.json({ error: 'Nama kelas sudah ada' }, { status: 400 });
    }
    
    const kelas = await db.kelas.create({
      data: { nama, tingkat, shift },
    });
    
    return NextResponse.json(kelas);
  } catch (error) {
    console.error('Error creating kelas:', error);
    return NextResponse.json({ error: 'Gagal menambah kelas' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, tingkat, shift } = body;
    
    const existingKelas = await db.kelas.findFirst({
      where: { 
        nama,
        NOT: { id },
      },
    });
    
    if (existingKelas) {
      return NextResponse.json({ error: 'Nama kelas sudah ada' }, { status: 400 });
    }
    
    const kelas = await db.kelas.update({
      where: { id },
      data: { nama, tingkat, shift },
    });
    
    return NextResponse.json(kelas);
  } catch (error) {
    console.error('Error updating kelas:', error);
    return NextResponse.json({ error: 'Gagal mengupdate kelas' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID kelas diperlukan' }, { status: 400 });
    }
    
    // Get all jadwal IDs for this kelas
    const jadwalList = await db.jadwal.findMany({
      where: { kelasId: id },
      select: { id: true },
    });
    const jadwalIds = jadwalList.map(j => j.id);
    
    // Get all siswa IDs for this kelas
    const siswaList = await db.siswa.findMany({
      where: { kelasId: id },
      select: { id: true },
    });
    const siswaIds = siswaList.map(s => s.id);
    
    // Delete in correct order to respect foreign key constraints:
    // 1. Delete kehadiran guru related to jadwal in this kelas
    if (jadwalIds.length > 0) {
      await db.kehadiranGuru.deleteMany({
        where: { jadwalId: { in: jadwalIds } },
      });
    }
    
    // 2. Delete kehadiran siswa related to this kelas
    await db.kehadiranSiswa.deleteMany({
      where: { kelasId: id },
    });
    
    // 3. Delete kehadiran siswa related to siswa in this kelas
    if (siswaIds.length > 0) {
      await db.kehadiranSiswa.deleteMany({
        where: { siswaId: { in: siswaIds } },
      });
    }
    
    // 4. Delete jadwal for this kelas
    await db.jadwal.deleteMany({
      where: { kelasId: id },
    });
    
    // 5. Delete all siswa in this kelas
    await db.siswa.deleteMany({
      where: { kelasId: id },
    });
    
    // 6. Finally delete the kelas
    await db.kelas.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return NextResponse.json({ error: 'Gagal menghapus kelas' }, { status: 500 });
  }
}
