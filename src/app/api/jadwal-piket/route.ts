import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all jadwal piket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hari = searchParams.get('hari');
    const shift = searchParams.get('shift');

    const where: Record<string, string> = {};
    if (hari) where.hari = hari;
    if (shift) where.shift = shift;

    const jadwalPiket = await db.jadwalPiket.findMany({
      where,
      include: {
        guru: true,
      },
      orderBy: [
        { hari: 'asc' },
        { shift: 'asc' },
      ],
    });

    return NextResponse.json(jadwalPiket);
  } catch (error) {
    console.error('Error fetching jadwal piket:', error);
    return NextResponse.json({ error: 'Gagal mengambil data jadwal piket' }, { status: 500 });
  }
}

// POST - Create new jadwal piket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hari, shift, guruId } = body;

    if (!hari || !shift || !guruId) {
      return NextResponse.json({ error: 'Hari, shift, dan guruId wajib diisi' }, { status: 400 });
    }

    // Check if already exists
    const existing = await db.jadwalPiket.findUnique({
      where: {
        hari_shift: { hari, shift },
      },
    });

    if (existing) {
      // Update existing
      const updated = await db.jadwalPiket.update({
        where: { id: existing.id },
        data: { guruId },
        include: { guru: true },
      });
      return NextResponse.json(updated);
    }

    const jadwalPiket = await db.jadwalPiket.create({
      data: {
        hari,
        shift,
        guruId,
      },
      include: {
        guru: true,
      },
    });

    return NextResponse.json(jadwalPiket);
  } catch (error) {
    console.error('Error creating jadwal piket:', error);
    return NextResponse.json({ error: 'Gagal membuat jadwal piket' }, { status: 500 });
  }
}

// PUT - Update jadwal piket
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, hari, shift, guruId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    const jadwalPiket = await db.jadwalPiket.update({
      where: { id },
      data: {
        hari,
        shift,
        guruId,
      },
      include: {
        guru: true,
      },
    });

    return NextResponse.json(jadwalPiket);
  } catch (error) {
    console.error('Error updating jadwal piket:', error);
    return NextResponse.json({ error: 'Gagal mengupdate jadwal piket' }, { status: 500 });
  }
}

// DELETE - Delete jadwal piket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    await db.jadwalPiket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting jadwal piket:', error);
    return NextResponse.json({ error: 'Gagal menghapus jadwal piket' }, { status: 500 });
  }
}
