import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');
    
    const where = kelasId ? { kelasId } : {};
    
    const siswa = await db.siswa.findMany({
      where,
      include: {
        kelas: true,
      },
      orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }],
    });
    
    return NextResponse.json(siswa);
  } catch (error) {
    console.error('Error fetching siswa:', error);
    return NextResponse.json({ error: 'Gagal mengambil data siswa' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk create for upload - filter valid entries
      const validData = body.filter(item => item.nama && item.kelasId);
      if (validData.length === 0) {
        return NextResponse.json({ error: 'Tidak ada data siswa yang valid' }, { status: 400 });
      }
      
      const siswa = await db.siswa.createMany({
        data: validData,
        skipDuplicates: true,
      });
      return NextResponse.json({ count: siswa.count, message: `Berhasil menambah ${siswa.count} siswa` });
    }
    
    const { nama, kelasId } = body;
    
    if (!nama || !kelasId) {
      return NextResponse.json({ error: 'Nama dan kelas diperlukan' }, { status: 400 });
    }
    
    const siswa = await db.siswa.create({
      data: { nama, kelasId },
      include: { kelas: true },
    });
    
    return NextResponse.json(siswa);
  } catch (error) {
    console.error('Error creating siswa:', error);
    return NextResponse.json({ error: 'Gagal menambah siswa' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, kelasId } = body;
    
    const siswa = await db.siswa.update({
      where: { id },
      data: { nama, kelasId },
      include: { kelas: true },
    });
    
    return NextResponse.json(siswa);
  } catch (error) {
    console.error('Error updating siswa:', error);
    return NextResponse.json({ error: 'Gagal mengupdate siswa' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID siswa diperlukan' }, { status: 400 });
    }
    
    // Delete related attendance records first (cascade delete)
    await db.kehadiranSiswa.deleteMany({
      where: { siswaId: id },
    });
    
    // Then delete the siswa
    await db.siswa.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting siswa:', error);
    return NextResponse.json({ error: 'Gagal menghapus siswa' }, { status: 500 });
  }
}
