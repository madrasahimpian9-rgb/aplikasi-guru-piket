import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const mapel = await db.mataPelajaran.findMany({
      include: {
        jadwal: {
          include: {
            kelas: true,
            guru: true,
          },
        },
      },
      orderBy: { kode: 'asc' },
    });
    
    return NextResponse.json(mapel);
  } catch (error) {
    console.error('Error fetching mapel:', error);
    return NextResponse.json({ error: 'Gagal mengambil data mata pelajaran' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kode, nama } = body;
    
    const existingMapel = await db.mataPelajaran.findUnique({
      where: { kode },
    });
    
    if (existingMapel) {
      return NextResponse.json({ error: 'Kode mata pelajaran sudah ada' }, { status: 400 });
    }
    
    const mapel = await db.mataPelajaran.create({
      data: { kode, nama },
    });
    
    return NextResponse.json(mapel);
  } catch (error) {
    console.error('Error creating mapel:', error);
    return NextResponse.json({ error: 'Gagal menambah mata pelajaran' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, kode, nama } = body;
    
    const existingMapel = await db.mataPelajaran.findFirst({
      where: { 
        kode,
        NOT: { id },
      },
    });
    
    if (existingMapel) {
      return NextResponse.json({ error: 'Kode mata pelajaran sudah ada' }, { status: 400 });
    }
    
    const mapel = await db.mataPelajaran.update({
      where: { id },
      data: { kode, nama },
    });
    
    return NextResponse.json(mapel);
  } catch (error) {
    console.error('Error updating mapel:', error);
    return NextResponse.json({ error: 'Gagal mengupdate mata pelajaran' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID mata pelajaran diperlukan' }, { status: 400 });
    }
    
    await db.mataPelajaran.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mapel:', error);
    return NextResponse.json({ error: 'Gagal menghapus mata pelajaran' }, { status: 500 });
  }
}
