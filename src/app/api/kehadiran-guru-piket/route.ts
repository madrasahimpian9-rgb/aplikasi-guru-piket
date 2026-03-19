import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get kehadiran guru piket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get('tanggal');
    const shift = searchParams.get('shift');
    const guruId = searchParams.get('guruId');

    const where: Record<string, unknown> = {};
    if (tanggal) {
      where.tanggal = new Date(tanggal);
    }
    if (shift) {
      where.shift = shift;
    }
    if (guruId) {
      where.guruId = guruId;
    }

    const kehadiran = await db.kehadiranGuruPiket.findMany({
      where,
      include: {
        guru: true,
      },
      orderBy: {
        tanggal: 'desc',
      },
    });

    return NextResponse.json(kehadiran);
  } catch (error) {
    console.error('Error fetching kehadiran guru piket:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kehadiran guru piket' }, { status: 500 });
  }
}

// POST - Create/Update kehadiran guru piket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tanggal, guruId, shift, status, keterangan } = body;

    if (!tanggal || !guruId || !shift || !status) {
      return NextResponse.json({ error: 'Tanggal, guruId, shift, dan status wajib diisi' }, { status: 400 });
    }

    const tanggalDate = new Date(tanggal);

    // Upsert - update if exists, create if not
    const kehadiran = await db.kehadiranGuruPiket.upsert({
      where: {
        tanggal_guruId_shift: {
          tanggal: tanggalDate,
          guruId,
          shift,
        },
      },
      update: {
        status,
        keterangan,
      },
      create: {
        tanggal: tanggalDate,
        guruId,
        shift,
        status,
        keterangan,
      },
      include: {
        guru: true,
      },
    });

    return NextResponse.json(kehadiran);
  } catch (error) {
    console.error('Error creating kehadiran guru piket:', error);
    return NextResponse.json({ error: 'Gagal menyimpan kehadiran guru piket' }, { status: 500 });
  }
}

// DELETE - Delete kehadiran guru piket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    await db.kehadiranGuruPiket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting kehadiran guru piket:', error);
    return NextResponse.json({ error: 'Gagal menghapus kehadiran guru piket' }, { status: 500 });
  }
}
