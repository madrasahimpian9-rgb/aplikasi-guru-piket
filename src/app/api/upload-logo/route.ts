import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file logo yang diupload' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP' 
      }, { status: 400 });
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Ukuran file terlalu besar. Maksimal 2MB' 
      }, { status: 400 });
    }
    
    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Update pengaturan
    let pengaturan = await db.pengaturan.findFirst();
    
    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          namaSekolah: 'MTs Da\'arul Ma\'arif Pasawahan',
          logo: base64,
          semester: 'Genap',
          tahunAjaran: '2024/2025',
        },
      });
    } else {
      pengaturan = await db.pengaturan.update({
        where: { id: pengaturan.id },
        data: { logo: base64 },
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      logo: base64,
      message: 'Logo berhasil diupload' 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Gagal mengupload logo' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const pengaturan = await db.pengaturan.findFirst();
    
    if (pengaturan) {
      await db.pengaturan.update({
        where: { id: pengaturan.id },
        data: { logo: null },
      });
    }
    
    return NextResponse.json({ success: true, message: 'Logo berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({ error: 'Gagal menghapus logo' }, { status: 500 });
  }
}
