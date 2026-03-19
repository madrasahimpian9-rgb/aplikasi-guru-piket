import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const guru = await db.guru.findMany({
      include: {
        jadwal: {
          include: {
            kelas: true,
          },
        },
      },
      orderBy: { kode: 'asc' },
    });
    
    return NextResponse.json(guru);
  } catch (error) {
    console.error('Error fetching guru:', error);
    return NextResponse.json({ error: 'Gagal mengambil data guru' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle bulk create for import
    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
        const { kode, nama, gelar } = item;
        
        // Skip if kode already exists
        const existing = await db.guru.findUnique({
          where: { kode },
        });
        
        if (!existing && nama) {
          const guru = await db.guru.create({
            data: { kode: kode || '', nama, gelar: gelar || null },
          });
          results.push(guru);
        }
      }
      return NextResponse.json({ count: results.length, data: results });
    }
    
    const { kode, nama, gelar } = body;
    
    if (!nama) {
      return NextResponse.json({ error: 'Nama guru diperlukan' }, { status: 400 });
    }
    
    if (kode) {
      const existingGuru = await db.guru.findUnique({
        where: { kode },
      });
      
      if (existingGuru) {
        return NextResponse.json({ error: 'Kode guru sudah ada' }, { status: 400 });
      }
    }
    
    const guru = await db.guru.create({
      data: { kode: kode || '', nama, gelar },
    });
    
    return NextResponse.json(guru);
  } catch (error) {
    console.error('Error creating guru:', error);
    return NextResponse.json({ error: 'Gagal menambah guru' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, kode, nama, gelar } = body;
    
    const existingGuru = await db.guru.findFirst({
      where: { 
        kode,
        NOT: { id },
      },
    });
    
    if (existingGuru) {
      return NextResponse.json({ error: 'Kode guru sudah ada' }, { status: 400 });
    }
    
    const guru = await db.guru.update({
      where: { id },
      data: { kode, nama, gelar },
    });
    
    return NextResponse.json(guru);
  } catch (error) {
    console.error('Error updating guru:', error);
    return NextResponse.json({ error: 'Gagal mengupdate guru' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID guru diperlukan' }, { status: 400 });
    }
    
    // Delete related attendance records first (cascade delete)
    await db.kehadiranGuru.deleteMany({
      where: { guruId: id },
    });
    
    // Delete related jadwal records
    await db.jadwal.deleteMany({
      where: { guruId: id },
    });
    
    // Then delete the guru
    await db.guru.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guru:', error);
    return NextResponse.json({ error: 'Gagal menghapus guru' }, { status: 500 });
  }
}
