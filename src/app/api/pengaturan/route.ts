import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let pengaturan = await db.pengaturan.findFirst();
    
    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          namaSekolah: 'MTs Da\'arul Ma\'arif Pasawahan',
          alamatSekolah: 'Pasawahan',
          semester: 'Genap',
          tahunAjaran: '2025/2026',
        },
      });
    }
    
    return NextResponse.json(pengaturan);
  } catch (error) {
    console.error('Error fetching pengaturan:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengaturan' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { namaSekolah, alamatSekolah, telepon, email, kepalaSekolah, semester, tahunAjaran, logo } = body;
    
    let pengaturan = await db.pengaturan.findFirst();
    
    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          namaSekolah,
          alamatSekolah,
          telepon,
          email,
          kepalaSekolah,
          semester,
          tahunAjaran,
          logo,
        },
      });
    } else {
      pengaturan = await db.pengaturan.update({
        where: { id: pengaturan.id },
        data: {
          namaSekolah,
          alamatSekolah,
          telepon,
          email,
          kepalaSekolah,
          semester,
          tahunAjaran,
          ...(logo !== undefined && { logo }),
        },
      });
    }
    
    return NextResponse.json(pengaturan);
  } catch (error) {
    console.error('Error updating pengaturan:', error);
    return NextResponse.json({ error: 'Gagal mengupdate pengaturan' }, { status: 500 });
  }
}
