import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

interface ScheduleItem {
  hari: string;
  jamKe: number;
  waktuMulai: string;
  waktuSelesai: string;
  kelas: string;
  guru: string;
  shift: string;
}

interface ImportData {
  teachers: string[];
  classes: string[];
  schedules: ScheduleItem[];
}

export async function POST(request: Request) {
  try {
    const body: ImportData = await request.json();
    const { teachers, classes, schedules } = body;

    console.log('Starting import...');
    console.log(`Teachers: ${teachers.length}, Classes: ${classes.length}, Schedules: ${schedules.length}`);

    // Step 1: Create all classes
    const kelasMap: Record<string, string> = {};
    for (const kelasNama of classes) {
      const tingkat = parseInt(kelasNama.charAt(0));
      const shift = ['9A', '9B', '9C', '9D'].includes(kelasNama) ? 'PAGI' : 'SIANG';
      
      const existingKelas = await db.kelas.findUnique({
        where: { nama: kelasNama },
      });
      
      if (existingKelas) {
        kelasMap[kelasNama] = existingKelas.id;
      } else {
        const newKelas = await db.kelas.create({
          data: { nama: kelasNama, tingkat, shift },
        });
        kelasMap[kelasNama] = newKelas.id;
      }
    }
    console.log('Classes created/found:', Object.keys(kelasMap).length);

    // Step 2: Create all teachers
    const guruMap: Record<string, string> = {};
    for (let i = 0; i < teachers.length; i++) {
      const teacherFull = teachers[i];
      // Parse name and gelar
      const parts = teacherFull.split(',').map(s => s.trim());
      const nama = parts[0] || teacherFull;
      const gelar = parts.length > 1 ? parts.slice(1).join(', ') : null;
      const kode = `G${String(i + 1).padStart(3, '0')}`;
      
      const existingGuru = await db.guru.findFirst({
        where: { nama },
      });
      
      if (existingGuru) {
        guruMap[teacherFull] = existingGuru.id;
      } else {
        const newGuru = await db.guru.create({
          data: { kode, nama, gelar },
        });
        guruMap[teacherFull] = newGuru.id;
      }
    }
    console.log('Teachers created/found:', Object.keys(guruMap).length);

    // Step 3: Delete existing schedules and attendance
    await db.kehadiranGuru.deleteMany({});
    await db.jadwal.deleteMany({});
    console.log('Existing schedules deleted');

    // Step 4: Create all schedules using raw SQL
    const jadwalData: Array<{
      id: string;
      hari: string;
      jamKe: number;
      waktuMulai: string;
      waktuSelesai: string;
      kelasId: string;
      guruId: string;
      mapelId: string | null;
    }> = [];
    const seen = new Set<string>();
    
    for (const schedule of schedules) {
      const kelasId = kelasMap[schedule.kelas];
      const guruId = guruMap[schedule.guru];
      
      if (!kelasId || !guruId) {
        continue;
      }
      
      // Create unique key to avoid duplicates
      const key = `${schedule.hari}-${schedule.jamKe}-${kelasId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      
      jadwalData.push({
        id: randomUUID(), // Use cuid format like Prisma
        hari: schedule.hari,
        jamKe: schedule.jamKe,
        waktuMulai: schedule.waktuMulai,
        waktuSelesai: schedule.waktuSelesai,
        kelasId,
        guruId,
        mapelId: null,
      });
    }

    // Use $executeRaw for bulk insert
    let insertedCount = 0;
    const now = new Date().toISOString();
    
    for (const jadwal of jadwalData) {
      try {
        await db.$executeRaw`
          INSERT INTO Jadwal (id, hari, jamKe, waktuMulai, waktuSelesai, kelasId, guruId, mapelId, createdAt, updatedAt)
          VALUES (${jadwal.id}, ${jadwal.hari}, ${jadwal.jamKe}, ${jadwal.waktuMulai}, ${jadwal.waktuSelesai}, ${jadwal.kelasId}, ${jadwal.guruId}, ${jadwal.mapelId}, ${now}, ${now})
        `;
        insertedCount++;
      } catch (e) {
        console.error('Error inserting jadwal:', e);
      }
    }

    console.log(`Import complete: ${insertedCount} schedules created`);

    return NextResponse.json({
      success: true,
      message: 'Import berhasil',
      stats: {
        teachers: Object.keys(guruMap).length,
        classes: Object.keys(kelasMap).length,
        schedules: insertedCount,
      },
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ 
      error: 'Gagal mengimport data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
