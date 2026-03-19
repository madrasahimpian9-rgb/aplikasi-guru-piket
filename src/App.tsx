import { useState, useEffect, useCallback } from 'react';
import { useEntity } from '@base44/sdk';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

// Types
interface Pengaturan {
  id: string;
  namaSekolah: string;
  alamatSekolah?: string;
  telepon?: string;
  email?: string;
  kepalaSekolah?: string;
  semester: string;
  tahunAjaran: string;
  logo?: string;
}

interface Guru {
  id: string;
  kode: string;
  nama: string;
  gelar?: string;
}

interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  shift: string;
}

interface Siswa {
  id: string;
  nama: string;
  kelasId: string;
  kelas?: Kelas;
}

interface Jadwal {
  id: string;
  hari: string;
  jamKe: number;
  waktuMulai: string;
  waktuSelesai: string;
  kelasId: string;
  mapelId?: string;
  guruId: string;
  kelas?: Kelas;
  guru?: Guru;
}

interface KehadiranGuru {
  id: string;
  tanggal: string;
  jadwalId: string;
  guruId: string;
  status: string;
  keterangan?: string;
}

interface KehadiranSiswa {
  id: string;
  tanggal: string;
  siswaId: string;
  kelasId: string;
  status: string;
  keterangan?: string;
}

interface JadwalPiket {
  id: string;
  hari: string;
  shift: string;
  guruId: string;
  guru?: Guru;
}

interface KehadiranGuruPiket {
  id: string;
  tanggal: string;
  guruId: string;
  shift: string;
  status: string;
  keterangan?: string;
  guru?: Guru;
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_KERJA = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const STATUS_SISWA = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-green-500', textColor: 'text-green-700' },
  { value: 'SAKIT', label: 'Sakit', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  { value: 'IZIN', label: 'Izin', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { value: 'ALFA', label: 'Alfa', color: 'bg-red-500', textColor: 'text-red-700' },
  { value: 'KABUR', label: 'Kabur', color: 'bg-orange-500', textColor: 'text-orange-700' },
];

const STATUS_GURU = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-green-500', textColor: 'text-green-700' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir', color: 'bg-red-500', textColor: 'text-red-700' },
];

const MAX_JAM_PAGI = 9;
const MAX_JAM_SIANG = 8;

// Modal Component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {message}
    </div>
  );
}

// Calendar Component
function CalendarPicker({ selectedDate, onDateSelect }: { selectedDate: Date; onDateSelect: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [isOpen, setIsOpen] = useState(false);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDay = getDay(monthStart);
  const emptyDays = Array(startDay).fill(null);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white border rounded-lg shadow-xl p-4 z-50 min-w-[300px]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">&lt;</button>
            <span className="font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="p-1 text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            {days.map(day => {
              const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isWeekend = getDay(day) === 0;
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    onDateSelect(day);
                    setIsOpen(false);
                  }}
                  disabled={isWeekend}
                  className={`p-2 text-sm rounded ${
                    isSelected ? 'bg-emerald-600 text-white' :
                    isToday ? 'bg-emerald-100 text-emerald-700' :
                    isWeekend ? 'text-gray-300 cursor-not-allowed' :
                    'hover:bg-gray-100'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHari, setSelectedHari] = useState<string>(HARI[new Date().getDay()]);
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [editModal, setEditModal] = useState<{ type: string; data: Record<string, unknown> | null } | null>(null);
  const [addModal, setAddModal] = useState<string | null>(null);

  // Base44 Entity Hooks
  const pengaturanEntity = useEntity<Pengaturan>('Pengaturan');
  const guruEntity = useEntity<Guru>('Guru');
  const kelasEntity = useEntity<Kelas>('Kelas');
  const siswaEntity = useEntity<Siswa>('Siswa');
  const jadwalEntity = useEntity<Jadwal>('Jadwal');
  const kehadiranGuruEntity = useEntity<KehadiranGuru>('KehadiranGuru');
  const kehadiranSiswaEntity = useEntity<KehadiranSiswa>('KehadiranSiswa');
  const jadwalPiketEntity = useEntity<JadwalPiket>('JadwalPiket');
  const kehadiranGuruPiketEntity = useEntity<KehadiranGuruPiket>('KehadiranGuruPiket');

  // Local state for data
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [jadwalPiketList, setJadwalPiketList] = useState<JadwalPiket[]>([]);
  const [kehadiranGuruList, setKehadiranGuruList] = useState<Record<string, string>>({});
  const [keteranganGuru, setKeteranganGuru] = useState<Record<string, string>>({});
  const [kehadiranSiswaList, setKehadiranSiswaList] = useState<Record<string, string>>({});
  const [keteranganSiswa, setKeteranganSiswa] = useState<Record<string, string>>({});
  const [kehadiranGuruPiketList, setKehadiranGuruPiketList] = useState<Record<string, string>>({});

  // Selection states
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<Set<string>>(new Set());
  const [selectedGuruIds, setSelectedGuruIds] = useState<Set<string>>(new Set());

  // Jadwal matrix state
  const [jadwalMatrix, setJadwalMatrix] = useState<Record<string, Record<number, string>>>({});

  // Form states
  const [guruForm, setGuruForm] = useState({ kode: '', nama: '', gelar: '' });
  const [kelasForm, setKelasForm] = useState({ nama: '', tingkat: 7, shift: 'PAGI' });
  const [siswaForm, setSiswaForm] = useState({ nama: '', kelasId: '' });
  const [pengaturanForm, setPengaturanForm] = useState({
    namaSekolah: '', alamatSekolah: '', telepon: '', email: '', kepalaSekolah: '',
    semester: 'Genap', tahunAjaran: '', logo: ''
  });
  const [jadwalPiketForm, setJadwalPiketForm] = useState({ hari: 'Senin', shift: 'PAGI', guruId: '' });

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Update selected hari when date changes
  useEffect(() => {
    const dayOfWeek = selectedDate.getDay();
    const hariName = HARI[dayOfWeek];
    if (hariName !== 'Minggu') {
      setSelectedHari(hariName);
    }
  }, [selectedDate]);

  // Load kehadiran when date changes
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    loadKehadiran(dateStr);
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pengaturanData, guruData, kelasData, siswaData, jadwalData, jadwalPiketData] = await Promise.all([
        pengaturanEntity.list(),
        guruEntity.list(),
        kelasEntity.list(),
        siswaEntity.list(),
        jadwalEntity.list(),
        jadwalPiketEntity.list(),
      ]);

      if (pengaturanData.length > 0) {
        setPengaturan(pengaturanData[0]);
        setPengaturanForm({
          namaSekolah: pengaturanData[0].namaSekolah || '',
          alamatSekolah: pengaturanData[0].alamatSekolah || '',
          telepon: pengaturanData[0].telepon || '',
          email: pengaturanData[0].email || '',
          kepalaSekolah: pengaturanData[0].kepalaSekolah || '',
          semester: pengaturanData[0].semester || 'Genap',
          tahunAjaran: pengaturanData[0].tahunAjaran || '',
          logo: pengaturanData[0].logo || '',
        });
      }
      setGuruList(guruData);
      setKelasList(kelasData);
      setSiswaList(siswaData);
      setJadwalList(jadwalData);
      setJadwalPiketList(jadwalPiketData);

      // Load kehadiran for today
      const today = format(selectedDate, 'yyyy-MM-dd');
      await loadKehadiran(today);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadKehadiran = async (tanggal: string) => {
    try {
      const [kehadiranGuru, kehadiranSiswa, kehadiranGuruPiket] = await Promise.all([
        kehadiranGuruEntity.list({ filter: { tanggal } }),
        kehadiranSiswaEntity.list({ filter: { tanggal } }),
        kehadiranGuruPiketEntity.list({ filter: { tanggal } }),
      ]);

      const guruMap: Record<string, string> = {};
      const guruKetMap: Record<string, string> = {};
      kehadiranGuru.forEach((k) => {
        guruMap[k.jadwalId] = k.status;
        if (k.keterangan) guruKetMap[k.jadwalId] = k.keterangan;
      });
      setKehadiranGuruList(guruMap);
      setKeteranganGuru(guruKetMap);

      const siswaMap: Record<string, string> = {};
      const siswaKetMap: Record<string, string> = {};
      kehadiranSiswa.forEach((k) => {
        siswaMap[k.siswaId] = k.status;
        if (k.keterangan) siswaKetMap[k.siswaId] = k.keterangan;
      });
      setKehadiranSiswaList(siswaMap);
      setKeteranganSiswa(siswaKetMap);

      const guruPiketMap: Record<string, string> = {};
      kehadiranGuruPiket.forEach((k) => {
        const key = `${k.guruId}_${k.shift}`;
        guruPiketMap[key] = k.status;
      });
      setKehadiranGuruPiketList(guruPiketMap);
    } catch (error) {
      console.error('Error loading kehadiran:', error);
    }
  };

  // ================== CRUD OPERATIONS ==================

  // Guru CRUD
  const saveGuru = async (isEdit = false) => {
    if (!guruForm.nama.trim()) {
      showToast('Nama guru harus diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && editModal?.data?.id) {
        await guruEntity.update(editModal.data.id as string, guruForm);
        showToast('Guru berhasil diupdate', 'success');
      } else {
        await guruEntity.create(guruForm);
        showToast('Guru berhasil ditambahkan', 'success');
      }
      setGuruForm({ kode: '', nama: '', gelar: '' });
      setEditModal(null);
      setAddModal(null);
      loadData();
    } catch (error) {
      showToast('Gagal menyimpan guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteGuru = async (id: string) => {
    if (!confirm('Yakin ingin menghapus guru ini?')) return;
    setLoading(true);
    try {
      await guruEntity.delete(id);
      showToast('Guru berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menghapus guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteGuru = async () => {
    if (selectedGuruIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedGuruIds.size} guru terpilih?`)) return;
    setLoading(true);
    try {
      for (const id of selectedGuruIds) {
        await guruEntity.delete(id);
      }
      setSelectedGuruIds(new Set());
      showToast('Guru berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menghapus guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Kelas CRUD
  const saveKelas = async (isEdit = false) => {
    if (!kelasForm.nama.trim()) {
      showToast('Nama kelas harus diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && editModal?.data?.id) {
        await kelasEntity.update(editModal.data.id as string, kelasForm);
        showToast('Kelas berhasil diupdate', 'success');
      } else {
        await kelasEntity.create(kelasForm);
        showToast('Kelas berhasil ditambahkan', 'success');
      }
      setKelasForm({ nama: '', tingkat: 7, shift: 'PAGI' });
      setEditModal(null);
      setAddModal(null);
      loadData();
    } catch (error) {
      showToast('Gagal menyimpan kelas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteKelas = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kelas ini? Semua siswa di kelas ini juga akan terhapus.')) return;
    setLoading(true);
    try {
      // Delete all siswa in kelas first
      const siswaInKelas = siswaList.filter(s => s.kelasId === id);
      for (const siswa of siswaInKelas) {
        await siswaEntity.delete(siswa.id);
      }
      await kelasEntity.delete(id);
      showToast('Kelas berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menghapus kelas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Siswa CRUD
  const saveSiswa = async (isEdit = false) => {
    if (!siswaForm.nama.trim()) {
      showToast('Nama siswa harus diisi', 'error');
      return;
    }
    if (!siswaForm.kelasId) {
      showToast('Pilih kelas untuk siswa', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && editModal?.data?.id) {
        await siswaEntity.update(editModal.data.id as string, siswaForm);
        showToast('Siswa berhasil diupdate', 'success');
      } else {
        await siswaEntity.create(siswaForm);
        showToast('Siswa berhasil ditambahkan', 'success');
      }
      setSiswaForm({ nama: '', kelasId: '' });
      setEditModal(null);
      setAddModal(null);
      loadData();
    } catch (error) {
      showToast('Gagal menyimpan siswa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteSiswa = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    setLoading(true);
    try {
      await siswaEntity.delete(id);
      showToast('Siswa berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menghapus siswa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteSiswa = async () => {
    if (selectedSiswaIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedSiswaIds.size} siswa terpilih?`)) return;
    setLoading(true);
    try {
      for (const id of selectedSiswaIds) {
        await siswaEntity.delete(id);
      }
      setSelectedSiswaIds(new Set());
      showToast('Siswa berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menghapus siswa', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pengaturan
  const savePengaturan = async () => {
    if (!pengaturanForm.namaSekolah.trim()) {
      showToast('Nama sekolah harus diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      if (pengaturan?.id) {
        await pengaturanEntity.update(pengaturan.id, pengaturanForm);
      } else {
        await pengaturanEntity.create(pengaturanForm);
      }
      showToast('Pengaturan berhasil disimpan', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Jadwal Piket CRUD
  const saveJadwalPiket = async (isEdit = false) => {
    if (!jadwalPiketForm.guruId) {
      showToast('Pilih guru untuk jadwal piket', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && editModal?.data?.id) {
        await jadwalPiketEntity.update(editModal.data.id as string, jadwalPiketForm);
        showToast('Jadwal piket berhasil diupdate', 'success');
      } else {
        await jadwalPiketEntity.create(jadwalPiketForm);
        showToast('Jadwal piket berhasil ditambahkan', 'success');
      }
      setJadwalPiketForm({ hari: 'Senin', shift: 'PAGI', guruId: '' });
      setEditModal(null);
      setAddModal(null);
      loadData();
    } catch (error) {
      showToast('Gagal menyimpan jadwal piket', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteJadwalPiket = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jadwal piket ini?')) return;
    setLoading(true);
    try {
      await jadwalPiketEntity.delete(id);
      showToast('Jadwal piket berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      showToast('Gagal menghapus jadwal piket', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ================== KEHADIRAN OPERATIONS ==================

  const saveKehadiranGuru = async () => {
    setLoading(true);
    try {
      const tanggal = format(selectedDate, 'yyyy-MM-dd');
      const jadwalHariIni = jadwalList.filter(j => j.hari === selectedHari);
      
      for (const j of jadwalHariIni) {
        const status = kehadiranGuruList[j.id] || 'HADIR';
        const keterangan = keteranganGuru[j.id] || '';
        
        // Check if already exists
        const existing = await kehadiranGuruEntity.list({ 
          filter: { tanggal, jadwalId: j.id } 
        });
        
        if (existing.length > 0) {
          await kehadiranGuruEntity.update(existing[0].id, { status, keterangan });
        } else {
          await kehadiranGuruEntity.create({
            tanggal, jadwalId: j.id, guruId: j.guruId, status, keterangan
          });
        }
      }
      showToast('Kehadiran guru berhasil disimpan', 'success');
      loadKehadiran(tanggal);
    } catch (error) {
      showToast('Gagal menyimpan kehadiran guru', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveKehadiranSiswa = async () => {
    setLoading(true);
    try {
      const tanggal = format(selectedDate, 'yyyy-MM-dd');
      const siswaKelas = selectedKelas === 'all' 
        ? siswaList 
        : siswaList.filter(s => s.kelasId === selectedKelas);
      
      for (const s of siswaKelas) {
        const status = kehadiranSiswaList[s.id] || 'HADIR';
        const keterangan = keteranganSiswa[s.id] || '';
        
        const existing = await kehadiranSiswaEntity.list({ 
          filter: { tanggal, siswaId: s.id } 
        });
        
        if (existing.length > 0) {
          await kehadiranSiswaEntity.update(existing[0].id, { status, keterangan });
        } else {
          await kehadiranSiswaEntity.create({
            tanggal, siswaId: s.id, kelasId: s.kelasId, status, keterangan
          });
        }
      }
      showToast('Kehadiran siswa berhasil disimpan', 'success');
      loadKehadiran(tanggal);
    } catch (error) {
      showToast('Gagal menyimpan kehadiran siswa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveKehadiranGuruPiket = async (guruId: string, shift: string, status: string) => {
    try {
      const tanggal = format(selectedDate, 'yyyy-MM-dd');
      const existing = await kehadiranGuruPiketEntity.list({ 
        filter: { tanggal, guruId, shift } 
      });
      
      if (existing.length > 0) {
        await kehadiranGuruPiketEntity.update(existing[0].id, { status });
      } else {
        await kehadiranGuruPiketEntity.create({ tanggal, guruId, shift, status });
      }
      
      loadKehadiran(tanggal);
    } catch (error) {
      showToast('Gagal menyimpan kehadiran guru piket', 'error');
    }
  };

  // Bulk set status for siswa
  const bulkSetStatusSiswa = (status: string) => {
    const newKehadiran = { ...kehadiranSiswaList };
    selectedSiswaIds.forEach(id => {
      newKehadiran[id] = status;
    });
    setKehadiranSiswaList(newKehadiran);
    setSelectedSiswaIds(new Set());
  };

  // ================== IMPORT/EXPORT ==================

  const handleImportSiswa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if exists
      const startIdx = lines[0]?.toLowerCase().includes('nama') ? 1 : 0;
      
      let imported = 0;
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const nama = parts[0];
          const kelasNama = parts[1];
          const kelas = kelasList.find(k => k.nama === kelasNama);
          
          if (kelas && nama) {
            await siswaEntity.create({ nama, kelasId: kelas.id });
            imported++;
          }
        }
      }
      
      showToast(`Berhasil import ${imported} siswa`, 'success');
      loadData();
    } catch (error) {
      showToast('Gagal import file', 'error');
    }
    e.target.value = '';
  };

  const exportSiswaToCSV = () => {
    const data = siswaList.map(s => ({
      nama: s.nama,
      kelas: kelasList.find(k => k.id === s.kelasId)?.nama || ''
    }));
    
    const csv = 'Nama,Kelas\n' + data.map(d => `${d.nama},${d.kelas}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Siswa_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data siswa berhasil diexport', 'success');
  };

  const exportGuruToCSV = () => {
    const data = guruList.map(g => ({
      kode: g.kode,
      nama: g.nama,
      gelar: g.gelar || ''
    }));
    
    const csv = 'Kode,Nama,Gelar\n' + data.map(d => `${d.kode},${d.nama},${d.gelar}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Guru_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data guru berhasil diexport', 'success');
  };

  const exportKehadiranSiswa = () => {
    const tanggal = format(selectedDate, 'yyyy-MM-dd');
    const data = siswaList
      .filter(s => selectedKelas === 'all' || s.kelasId === selectedKelas)
      .map(s => ({
        nama: s.nama,
        kelas: kelasList.find(k => k.id === s.kelasId)?.nama || '',
        status: kehadiranSiswaList[s.id] || 'HADIR',
        keterangan: keteranganSiswa[s.id] || ''
      }));
    
    const csv = 'Nama,Kelas,Status,Keterangan\n' + data.map(d => `${d.nama},${d.kelas},${d.status},${d.keterangan}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kehadiran_Siswa_${tanggal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data kehadiran berhasil diexport', 'success');
  };

  // ================== PRINT FUNCTIONS ==================

  const printBeritaAcara = () => {
    const tanggalStr = format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id });
    
    // Get guru piket
    const piketPagi = jadwalPiketList.find(p => p.hari === selectedHari && p.shift === 'PAGI');
    const piketSiang = jadwalPiketList.find(p => p.hari === selectedHari && p.shift === 'SIANG');
    
    // Get absent students
    const siswaTidakHadir = siswaList
      .filter(s => {
        const status = kehadiranSiswaList[s.id];
        return status && status !== 'HADIR';
      })
      .map(s => ({
        nama: s.nama,
        kelas: kelasList.find(k => k.id === s.kelasId)?.nama || '-',
        shift: kelasList.find(k => k.id === s.kelasId)?.shift || '-',
        status: kehadiranSiswaList[s.id],
        keterangan: keteranganSiswa[s.id] || '-'
      }))
      .sort((a, b) => a.kelas.localeCompare(b.kelas));

    // Guru stats by shift
    const getGuruStats = (shift: string) => {
      const jadwalShift = jadwalList.filter(j => j.hari === selectedHari && j.kelas?.shift === shift);
      const guruMap = new Map<string, { guru: Guru; jadwal: Jadwal[] }>();
      
      jadwalShift.forEach(j => {
        if (!guruMap.has(j.guruId)) {
          guruMap.set(j.guruId, { guru: j.guru!, jadwal: [] });
        }
        guruMap.get(j.guruId)!.jadwal.push(j);
      });
      
      return Array.from(guruMap.values()).sort((a, b) => 
        a.guru.nama.localeCompare(b.guru.nama)
      ).map(({ guru, jadwal }) => {
        const totalJam = jadwal.length;
        const jadwalTidakHadir = jadwal.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR');
        const totalTidakHadir = jadwalTidakHadir.length;
        return { guru, totalJam, totalHadir: totalJam - totalTidakHadir, totalTidakHadir };
      });
    };
    
    const guruPagi = getGuruStats('PAGI');
    const guruSiang = getGuruStats('SIANG');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Berita Acara KBM</title>
        <style>
          @page { size: A4 landscape; margin: 0.7cm; }
          body { font-family: Arial, sans-serif; font-size: 9px; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 14px; }
          .header h2 { margin: 5px 0; font-size: 11px; }
          .header h3 { margin: 10px 0; font-size: 12px; text-decoration: underline; }
          .info { margin-bottom: 8px; }
          .piket-info { margin-bottom: 10px; padding: 5px 10px; background: #f5f5f5; border-radius: 4px; display: flex; gap: 30px; }
          .section-title { font-weight: bold; margin: 10px 0 5px; font-size: 10px; }
          .shift-tables { display: flex; gap: 10px; margin-bottom: 10px; }
          .shift-table { flex: 1; }
          .shift-title { font-weight: bold; margin-bottom: 3px; padding: 3px 6px; color: #fff; font-size: 9px; }
          .shift-pagi { background: #b45309; }
          .shift-siang { background: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 2px 4px; text-align: left; font-size: 8px; }
          th { background: #f0f0f0; }
          .center { text-align: center; }
          .hadir { color: #16a34a; font-weight: bold; }
          .tidak-hadir { color: #dc2626; font-weight: bold; }
          .status-sakit { background: #fef3c7; }
          .status-izin { background: #dbeafe; }
          .status-alfa { background: #fee2e2; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 150px; }
          .signature-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${pengaturan?.namaSekolah || 'MTs Da\'arul Ma\'arif Pasawahan'}</h1>
          <h2>Tahun Pelajaran ${pengaturan?.tahunAjaran || '-'} Semester ${pengaturan?.semester || '-'}</h2>
          <h3>BERITA ACARA KEGIATAN BELAJAR MENGAJAR (KBM)</h3>
        </div>
        <div class="info"><p><strong>Hari/Tanggal:</strong> ${tanggalStr}</p></div>
        <div class="piket-info">
          <p><strong>Guru Piket Pagi:</strong> ${piketPagi?.guru ? `${piketPagi.guru.nama} ${piketPagi.guru.gelar || ''}` : '-'}</p>
          <p><strong>Guru Piket Siang:</strong> ${piketSiang?.guru ? `${piketSiang.guru.nama} ${piketSiang.guru.gelar || ''}` : '-'}</p>
        </div>
        <div class="section-title">I. REKAP KEHADIRAN GURU:</div>
        <div class="shift-tables">
          <div class="shift-table">
            <div class="shift-title shift-pagi">SHIFT PAGI (07:00 - 12:30 WIB)</div>
            <table>
              <thead><tr><th class="center">No</th><th>Nama Guru</th><th class="center">Jam</th><th class="center">H</th><th class="center">TH</th></tr></thead>
              <tbody>
                ${guruPagi.map((g, i) => `<tr><td class="center">${i + 1}</td><td>${g.guru.nama} ${g.guru.gelar || ''}</td><td class="center">${g.totalJam}</td><td class="center hadir">${g.totalHadir}</td><td class="center ${g.totalTidakHadir > 0 ? 'tidak-hadir' : ''}">${g.totalTidakHadir}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="shift-table">
            <div class="shift-title shift-siang">SHIFT SIANG (12:40 - 17:00 WIB)</div>
            <table>
              <thead><tr><th class="center">No</th><th>Nama Guru</th><th class="center">Jam</th><th class="center">H</th><th class="center">TH</th></tr></thead>
              <tbody>
                ${guruSiang.map((g, i) => `<tr><td class="center">${i + 1}</td><td>${g.guru.nama} ${g.guru.gelar || ''}</td><td class="center">${g.totalJam}</td><td class="center hadir">${g.totalHadir}</td><td class="center ${g.totalTidakHadir > 0 ? 'tidak-hadir' : ''}">${g.totalTidakHadir}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="section-title">II. DAFTAR SISWA TIDAK HADIR:</div>
        ${siswaTidakHadir.length > 0 ? `
          <table>
            <thead><tr><th class="center">No</th><th>Nama Siswa</th><th class="center">Kelas</th><th class="center">Shift</th><th class="center">Status</th></tr></thead>
            <tbody>
              ${siswaTidakHadir.map((s, i) => `<tr class="${s.status === 'SAKIT' ? 'status-sakit' : s.status === 'IZIN' ? 'status-izin' : 'status-alfa'}"><td class="center">${i + 1}</td><td>${s.nama}</td><td class="center">${s.kelas}</td><td class="center">${s.shift}</td><td class="center"><strong>${s.status}</strong></td></tr>`).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; padding: 10px; background: #d1fae5; border-radius: 4px;"><strong>Semua siswa hadir hari ini</strong></p>'}
        <div class="footer">
          <div class="signature"><p>Mengetahui,</p><p>Kepala Madrasah</p><div class="signature-line">${pengaturan?.kepalaSekolah || '____________________'}</div></div>
          <div class="signature"><p>&nbsp;</p><p>Guru Piket Pagi</p><div class="signature-line">${piketPagi?.guru ? `${piketPagi.guru.nama} ${piketPagi.guru.gelar || ''}` : '____________________'}</div></div>
          <div class="signature"><p>&nbsp;</p><p>Guru Piket Siang</p><div class="signature-line">${piketSiang?.guru ? `${piketSiang.guru.nama} ${piketSiang.guru.gelar || ''}` : '____________________'}</div></div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ================== HELPER FUNCTIONS ==================

  const getDashboardStats = () => {
    const hariIni = HARI[selectedDate.getDay()];
    const jadwalHariIni = jadwalList.filter(j => j.hari === hariIni);
    const guruMengajar = [...new Set(jadwalHariIni.map(j => j.guruId))].length;
    const guruTidakHadir = jadwalHariIni.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR').length;
    const siswaTidakHadir = siswaList.filter(s => {
      const status = kehadiranSiswaList[s.id];
      return status && status !== 'HADIR';
    }).length;
    
    return {
      totalSiswa: siswaList.length,
      totalGuru: guruList.length,
      totalKelas: kelasList.length,
      totalJadwalHariIni: jadwalHariIni.length,
      guruMengajarHariIni: guruMengajar,
      guruHadir: jadwalHariIni.length - guruTidakHadir,
      guruTidakHadir,
      siswaHadir: siswaList.length - siswaTidakHadir,
      siswaTidakHadir,
    };
  };

  const getGuruMengajarHariIni = () => {
    let jadwalHariIni = jadwalList.filter(j => j.hari === selectedHari);
    if (selectedShift) {
      jadwalHariIni = jadwalHariIni.filter(j => j.kelas?.shift === selectedShift);
    }
    const guruIds = [...new Set(jadwalHariIni.map(j => j.guruId))];
    return guruList.filter(g => guruIds.includes(g.id)).sort((a, b) => a.nama.localeCompare(b.nama));
  };

  const getJadwalByGuru = (guruId: string) => {
    let jadwal = jadwalList.filter(j => j.guruId === guruId && j.hari === selectedHari);
    if (selectedShift) {
      jadwal = jadwal.filter(j => j.kelas?.shift === selectedShift);
    }
    return jadwal.sort((a, b) => a.jamKe - b.jamKe);
  };

  const filteredSiswa = siswaList.filter(s => {
    const matchKelas = selectedKelas === 'all' || s.kelasId === selectedKelas;
    const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKelas && matchSearch;
  });

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pengaturan?.logo ? (
                <img src={pengaturan.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              ) : (
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GP</span>
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">Aplikasi Guru Piket</h1>
                <p className="text-xs text-gray-500">{pengaturan?.namaSekolah || 'MTs Da\'arul Ma\'arif'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                {pengaturan?.semester} {pengaturan?.tahunAjaran}
              </span>
              {loading && <span className="text-xs text-gray-400">Loading...</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 min-w-max">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'monitoring', label: 'Monitoring', icon: '📋' },
              { id: 'kehadiranSiswa', label: 'Kehadiran Siswa', icon: '👥' },
              { id: 'kehadiranGuru', label: 'Kehadiran Guru', icon: '👨‍🏫' },
              { id: 'siswa', label: 'Data Siswa', icon: '🎓' },
              { id: 'guru', label: 'Data Guru', icon: '📚' },
              { id: 'jadwal', label: 'Jadwal Piket', icon: '📅' },
              { id: 'laporan', label: 'Laporan', icon: '📈' },
              { id: 'pengaturan', label: 'Pengaturan', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-gray-500">Ringkasan KBM hari ini</p>
              </div>
              <CalendarPicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="text-3xl font-bold text-blue-600">{stats.totalSiswa}</div>
                <div className="text-sm text-gray-500">Total Siswa</div>
              </div>
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">{stats.totalGuru}</div>
                <div className="text-sm text-gray-500">Total Guru</div>
              </div>
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="text-3xl font-bold text-purple-600">{stats.totalKelas}</div>
                <div className="text-sm text-gray-500">Total Kelas</div>
              </div>
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="text-3xl font-bold text-amber-600">{stats.totalJadwalHariIni}</div>
                <div className="text-sm text-gray-500">Jadwal Hari Ini</div>
              </div>
            </div>

            {/* Kehadiran Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Kehadiran Guru</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.guruHadir}</div>
                    <div className="text-sm text-green-700">Hadir</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.guruTidakHadir}</div>
                    <div className="text-sm text-red-700">Tidak Hadir</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Kehadiran Siswa</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.siswaHadir}</div>
                    <div className="text-sm text-green-700">Hadir</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.siswaTidakHadir}</div>
                    <div className="text-sm text-red-700">Tidak Hadir</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guru Piket */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Guru Piket - {HARI[selectedDate.getDay()]}</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shift Pagi */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="font-semibold text-amber-800 mb-2">🌅 Shift Pagi (07:00 - 12:30)</div>
                  {(() => {
                    const piket = jadwalPiketList.find(p => p.hari === HARI[selectedDate.getDay()] && p.shift === 'PAGI');
                    if (!piket?.guru) return <span className="text-gray-500 text-sm">Belum ditentukan</span>;
                    const key = `${piket.guruId}_PAGI`;
                    const status = kehadiranGuruPiketList[key];
                    return (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{piket.guru.nama} {piket.guru.gelar || ''}</span>
                        <select
                          value={status || ''}
                          onChange={(e) => saveKehadiranGuruPiket(piket.guruId, 'PAGI', e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${
                            status === 'HADIR' ? 'bg-green-100 border-green-300' :
                            status === 'TIDAK_HADIR' ? 'bg-red-100 border-red-300' :
                            'bg-gray-100'
                          }`}
                        >
                          <option value="">Pilih</option>
                          <option value="HADIR">Hadir</option>
                          <option value="TIDAK_HADIR">Tidak Hadir</option>
                        </select>
                      </div>
                    );
                  })()}
                </div>
                {/* Shift Siang */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-blue-800 mb-2">🌙 Shift Siang (12:40 - 17:00)</div>
                  {(() => {
                    const piket = jadwalPiketList.find(p => p.hari === HARI[selectedDate.getDay()] && p.shift === 'SIANG');
                    if (!piket?.guru) return <span className="text-gray-500 text-sm">Belum ditentukan</span>;
                    const key = `${piket.guruId}_SIANG`;
                    const status = kehadiranGuruPiketList[key];
                    return (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{piket.guru.nama} {piket.guru.gelar || ''}</span>
                        <select
                          value={status || ''}
                          onChange={(e) => saveKehadiranGuruPiket(piket.guruId, 'SIANG', e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${
                            status === 'HADIR' ? 'bg-green-100 border-green-300' :
                            status === 'TIDAK_HADIR' ? 'bg-red-100 border-red-300' :
                            'bg-gray-100'
                          }`}
                        >
                          <option value="">Pilih</option>
                          <option value="HADIR">Hadir</option>
                          <option value="TIDAK_HADIR">Tidak Hadir</option>
                        </select>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Siswa Tidak Hadir */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Daftar Siswa Tidak Hadir</h3>
              </div>
              <div className="p-4">
                {siswaList.filter(s => {
                  const status = kehadiranSiswaList[s.id];
                  return status && status !== 'HADIR';
                }).length === 0 ? (
                  <div className="text-center text-green-600 py-4 bg-green-50 rounded-lg">
                    ✓ Semua siswa hadir hari ini
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">No</th>
                          <th className="text-left p-2 border">Nama</th>
                          <th className="text-left p-2 border">Kelas</th>
                          <th className="text-left p-2 border">Shift</th>
                          <th className="text-left p-2 border">Status</th>
                          <th className="text-left p-2 border">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {siswaList
                          .filter(s => {
                            const status = kehadiranSiswaList[s.id];
                            return status && status !== 'HADIR';
                          })
                          .map((s, i) => {
                            const kelas = kelasList.find(k => k.id === s.kelasId);
                            const status = kehadiranSiswaList[s.id];
                            const statusInfo = STATUS_SISWA.find(st => st.value === status);
                            return (
                              <tr key={s.id} className={statusInfo?.color.replace('bg-', 'bg-opacity-20 bg-')}>
                                <td className="p-2 border">{i + 1}</td>
                                <td className="p-2 border">{s.nama}</td>
                                <td className="p-2 border">{kelas?.nama || '-'}</td>
                                <td className="p-2 border">{kelas?.shift || '-'}</td>
                                <td className="p-2 border">
                                  <span className={`px-2 py-1 rounded text-xs text-white ${statusInfo?.color}`}>
                                    {statusInfo?.label}
                                  </span>
                                </td>
                                <td className="p-2 border text-xs">{keteranganSiswa[s.id] || '-'}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={printBeritaAcara} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                🖨️ Cetak Berita Acara
              </button>
            </div>
          </div>
        )}

        {/* ==================== MONITORING TAB ==================== */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Monitoring KBM</h2>
                <p className="text-gray-500">Kehadiran guru mengajar per jam</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Semua Shift</option>
                  <option value="PAGI">Shift Pagi</option>
                  <option value="SIANG">Shift Siang</option>
                </select>
                <button onClick={saveKehadiranGuru} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                  💾 Simpan
                </button>
              </div>
            </div>

            {/* Monitoring Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 border sticky left-0 bg-gray-50">No</th>
                      <th className="text-left p-2 border sticky left-8 bg-gray-50 min-w-[150px]">Nama Guru</th>
                      {Array.from({ length: 9 }, (_, i) => i + 1).map(jam => (
                        <th key={jam} className="text-center p-2 border min-w-[60px]">Jam {jam}</th>
                      ))}
                      <th className="text-center p-2 border">H</th>
                      <th className="text-center p-2 border">TH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getGuruMengajarHariIni().map((guru, idx) => {
                      const jadwalGuru = getJadwalByGuru(guru.id);
                      const maxJam = selectedShift === 'PAGI' ? MAX_JAM_PAGI : selectedShift === 'SIANG' ? MAX_JAM_SIANG : MAX_JAM_PAGI;
                      const totalHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] !== 'TIDAK_HADIR').length;
                      const totalTidakHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR').length;
                      
                      return (
                        <tr key={guru.id} className="hover:bg-gray-50">
                          <td className="p-2 border sticky left-0 bg-white">{idx + 1}</td>
                          <td className="p-2 border sticky left-8 bg-white font-medium whitespace-nowrap">{guru.nama} {guru.gelar || ''}</td>
                          {Array.from({ length: maxJam }, (_, i) => {
                            const jam = i + 1;
                            const jadwal = jadwalGuru.find(j => j.jamKe === jam);
                            if (!jadwal) return <td key={jam} className="p-1 border bg-gray-100 text-center text-gray-400">-</td>;
                            
                            const tidakHadir = kehadiranGuruList[jadwal.id] === 'TIDAK_HADIR';
                            const kelasNama = jadwal.kelas?.nama || '-';
                            
                            return (
                              <td key={jam} className={`p-1 border text-center ${tidakHadir ? 'bg-red-100' : 'bg-green-100'}`}>
                                <select
                                  value={kehadiranGuruList[jadwal.id] || 'HADIR'}
                                  onChange={(e) => {
                                    setKehadiranGuruList(prev => ({ ...prev, [jadwal.id]: e.target.value }));
                                  }}
                                  className="w-full text-xs bg-transparent border-0 cursor-pointer"
                                >
                                  <option value="HADIR">{kelasNama}</option>
                                  <option value="TIDAK_HADIR">❌ {kelasNama}</option>
                                </select>
                              </td>
                            );
                          })}
                          <td className="p-2 border text-center font-bold text-green-600">{totalHadir}</td>
                          <td className="p-2 border text-center font-bold text-red-600">{totalTidakHadir}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== KEHADIRAN SISWA TAB ==================== */}
        {activeTab === 'kehadiranSiswa' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Kehadiran Siswa</h2>
                <p className="text-gray-500">Input kehadiran siswa per kelas</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarPicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Semua Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama} ({k.shift})</option>
                  ))}
                </select>
                <button onClick={saveKehadiranSiswa} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                  💾 Simpan
                </button>
                <button onClick={exportKehadiranSiswa} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  📥 Export
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedSiswaIds.size > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm">{selectedSiswaIds.size} siswa dipilih</span>
                {STATUS_SISWA.map(s => (
                  <button
                    key={s.value}
                    onClick={() => bulkSetStatusSiswa(s.value)}
                    className={`px-2 py-1 rounded text-xs text-white ${s.color}`}
                  >
                    Set {s.label}
                  </button>
                ))}
                <button onClick={() => setSelectedSiswaIds(new Set())} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800">
                  Batal
                </button>
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Cari siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 border rounded-lg px-3 py-2 text-sm"
            />

            {/* Siswa Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedSiswaIds.size === filteredSiswa.length && filteredSiswa.length > 0}
                          onChange={() => {
                            if (selectedSiswaIds.size === filteredSiswa.length) {
                              setSelectedSiswaIds(new Set());
                            } else {
                              setSelectedSiswaIds(new Set(filteredSiswa.map(s => s.id)));
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2 border">No</th>
                      <th className="text-left p-2 border">Nama</th>
                      <th className="text-left p-2 border">Kelas</th>
                      <th className="text-left p-2 border">Shift</th>
                      <th className="text-left p-2 border">Status</th>
                      <th className="text-left p-2 border">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSiswa.map((siswa, i) => {
                      const kelas = kelasList.find(k => k.id === siswa.kelasId);
                      const status = kehadiranSiswaList[siswa.id] || 'HADIR';
                      const statusInfo = STATUS_SISWA.find(s => s.value === status);
                      
                      return (
                        <tr key={siswa.id} className="hover:bg-gray-50">
                          <td className="p-2 border text-center">
                            <input
                              type="checkbox"
                              checked={selectedSiswaIds.has(siswa.id)}
                              onChange={() => {
                                const newSet = new Set(selectedSiswaIds);
                                if (newSet.has(siswa.id)) newSet.delete(siswa.id);
                                else newSet.add(siswa.id);
                                setSelectedSiswaIds(newSet);
                              }}
                            />
                          </td>
                          <td className="p-2 border">{i + 1}</td>
                          <td className="p-2 border font-medium">{siswa.nama}</td>
                          <td className="p-2 border">{kelas?.nama || '-'}</td>
                          <td className="p-2 border">
                            <span className={`text-xs px-2 py-1 rounded ${kelas?.shift === 'PAGI' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {kelas?.shift || '-'}
                            </span>
                          </td>
                          <td className="p-1 border">
                            <select
                              value={status}
                              onChange={(e) => setKehadiranSiswaList(prev => ({ ...prev, [siswa.id]: e.target.value }))}
                              className={`w-full text-xs px-2 py-1 rounded border ${
                                status === 'HADIR' ? 'bg-green-50 border-green-200' :
                                status === 'SAKIT' ? 'bg-yellow-50 border-yellow-200' :
                                status === 'IZIN' ? 'bg-blue-50 border-blue-200' :
                                status === 'ALFA' ? 'bg-red-50 border-red-200' :
                                'bg-orange-50 border-orange-200'
                              }`}
                            >
                              {STATUS_SISWA.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border">
                            <input
                              type="text"
                              placeholder="Keterangan..."
                              value={keteranganSiswa[siswa.id] || ''}
                              onChange={(e) => setKeteranganSiswa(prev => ({ ...prev, [siswa.id]: e.target.value }))}
                              className="w-full text-xs px-2 py-1 border rounded"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== KEHADIRAN GURU TAB ==================== */}
        {activeTab === 'kehadiranGuru' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Kehadiran Guru</h2>
                <p className="text-gray-500">Input kehadiran guru piket</p>
              </div>
              <CalendarPicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shift Pagi */}
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-amber-50">
                  <h3 className="font-semibold text-amber-800">🌅 Shift Pagi (07:00 - 12:30)</h3>
                </div>
                <div className="p-4 space-y-3">
                  {HARI_KERJA.map(hari => {
                    const piket = jadwalPiketList.find(p => p.hari === hari && p.shift === 'PAGI');
                    if (!piket?.guru) return null;
                    const key = `${piket.guruId}_PAGI`;
                    const status = kehadiranGuruPiketList[key];
                    
                    return (
                      <div key={`pagi-${hari}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-xs text-gray-500">{hari}</span>
                          <div className="font-medium">{piket.guru.nama} {piket.guru.gelar || ''}</div>
                        </div>
                        <select
                          value={status || ''}
                          onChange={(e) => saveKehadiranGuruPiket(piket.guruId, 'PAGI', e.target.value)}
                          className={`text-sm px-3 py-1 rounded border ${
                            status === 'HADIR' ? 'bg-green-100 border-green-300 text-green-700' :
                            status === 'TIDAK_HADIR' ? 'bg-red-100 border-red-300 text-red-700' :
                            'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Pilih Status</option>
                          <option value="HADIR">✓ Hadir</option>
                          <option value="TIDAK_HADIR">✗ Tidak Hadir</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shift Siang */}
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-blue-50">
                  <h3 className="font-semibold text-blue-800">🌙 Shift Siang (12:40 - 17:00)</h3>
                </div>
                <div className="p-4 space-y-3">
                  {HARI_KERJA.map(hari => {
                    const piket = jadwalPiketList.find(p => p.hari === hari && p.shift === 'SIANG');
                    if (!piket?.guru) return null;
                    const key = `${piket.guruId}_SIANG`;
                    const status = kehadiranGuruPiketList[key];
                    
                    return (
                      <div key={`siang-${hari}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-xs text-gray-500">{hari}</span>
                          <div className="font-medium">{piket.guru.nama} {piket.guru.gelar || ''}</div>
                        </div>
                        <select
                          value={status || ''}
                          onChange={(e) => saveKehadiranGuruPiket(piket.guruId, 'SIANG', e.target.value)}
                          className={`text-sm px-3 py-1 rounded border ${
                            status === 'HADIR' ? 'bg-green-100 border-green-300 text-green-700' :
                            status === 'TIDAK_HADIR' ? 'bg-red-100 border-red-300 text-red-700' :
                            'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Pilih Status</option>
                          <option value="HADIR">✓ Hadir</option>
                          <option value="TIDAK_HADIR">✗ Tidak Hadir</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DATA SISWA TAB ==================== */}
        {activeTab === 'siswa' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Data Siswa</h2>
                <p className="text-gray-500">Manajemen data siswa</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setAddModal('siswa')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                  ➕ Tambah Siswa
                </button>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer">
                  📥 Import CSV
                  <input type="file" accept=".csv,.txt" onChange={handleImportSiswa} className="hidden" />
                </label>
                <button onClick={exportSiswaToCSV} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">
                  📤 Export CSV
                </button>
                {selectedSiswaIds.size > 0 && (
                  <button onClick={bulkDeleteSiswa} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    🗑️ Hapus ({selectedSiswaIds.size})
                  </button>
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.shift})</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="🔍 Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-64"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <div className="text-2xl font-bold text-gray-900">{siswaList.length}</div>
                <div className="text-sm text-gray-500">Total Siswa</div>
              </div>
              {kelasList.map(kelas => (
                <div key={kelas.id} className="bg-white rounded-lg border p-4">
                  <div className="text-2xl font-bold text-gray-900">{siswaList.filter(s => s.kelasId === kelas.id).length}</div>
                  <div className="text-sm text-gray-500">{kelas.nama}</div>
                </div>
              )).slice(0, 3)}
            </div>

            {/* Siswa Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedSiswaIds.size === filteredSiswa.length && filteredSiswa.length > 0}
                          onChange={() => {
                            if (selectedSiswaIds.size === filteredSiswa.length) setSelectedSiswaIds(new Set());
                            else setSelectedSiswaIds(new Set(filteredSiswa.map(s => s.id)));
                          }}
                        />
                      </th>
                      <th className="text-left p-2 border">No</th>
                      <th className="text-left p-2 border">Nama</th>
                      <th className="text-left p-2 border">Kelas</th>
                      <th className="text-center p-2 border">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSiswa.map((siswa, i) => (
                      <tr key={siswa.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-center">
                          <input
                            type="checkbox"
                            checked={selectedSiswaIds.has(siswa.id)}
                            onChange={() => {
                              const newSet = new Set(selectedSiswaIds);
                              if (newSet.has(siswa.id)) newSet.delete(siswa.id);
                              else newSet.add(siswa.id);
                              setSelectedSiswaIds(newSet);
                            }}
                          />
                        </td>
                        <td className="p-2 border">{i + 1}</td>
                        <td className="p-2 border font-medium">{siswa.nama}</td>
                        <td className="p-2 border">{kelasList.find(k => k.id === siswa.kelasId)?.nama || '-'}</td>
                        <td className="p-2 border text-center">
                          <button
                            onClick={() => {
                              setSiswaForm({ nama: siswa.nama, kelasId: siswa.kelasId });
                              setEditModal({ type: 'siswa', data: siswa });
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >✏️</button>
                          <button onClick={() => deleteSiswa(siswa.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DATA GURU TAB ==================== */}
        {activeTab === 'guru' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Data Guru</h2>
                <p className="text-gray-500">Manajemen data guru</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAddModal('guru')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                  ➕ Tambah Guru
                </button>
                <button onClick={exportGuruToCSV} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">
                  📤 Export CSV
                </button>
                {selectedGuruIds.size > 0 && (
                  <button onClick={bulkDeleteGuru} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    🗑️ Hapus ({selectedGuruIds.size})
                  </button>
                )}
              </div>
            </div>

            {/* Guru Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedGuruIds.size === guruList.length && guruList.length > 0}
                          onChange={() => {
                            if (selectedGuruIds.size === guruList.length) setSelectedGuruIds(new Set());
                            else setSelectedGuruIds(new Set(guruList.map(g => g.id)));
                          }}
                        />
                      </th>
                      <th className="text-left p-2 border">No</th>
                      <th className="text-left p-2 border">Kode</th>
                      <th className="text-left p-2 border">Nama</th>
                      <th className="text-left p-2 border">Gelar</th>
                      <th className="text-center p-2 border">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guruList.map((guru, i) => (
                      <tr key={guru.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-center">
                          <input
                            type="checkbox"
                            checked={selectedGuruIds.has(guru.id)}
                            onChange={() => {
                              const newSet = new Set(selectedGuruIds);
                              if (newSet.has(guru.id)) newSet.delete(guru.id);
                              else newSet.add(guru.id);
                              setSelectedGuruIds(newSet);
                            }}
                          />
                        </td>
                        <td className="p-2 border">{i + 1}</td>
                        <td className="p-2 border">{guru.kode}</td>
                        <td className="p-2 border font-medium">{guru.nama}</td>
                        <td className="p-2 border">{guru.gelar || '-'}</td>
                        <td className="p-2 border text-center">
                          <button
                            onClick={() => {
                              setGuruForm({ kode: guru.kode, nama: guru.nama, gelar: guru.gelar || '' });
                              setEditModal({ type: 'guru', data: guru });
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >✏️</button>
                          <button onClick={() => deleteGuru(guru.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== JADWAL PIKET TAB ==================== */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Jadwal Piket</h2>
                <p className="text-gray-500">Jadwal guru piket per hari</p>
              </div>
              <button onClick={() => setAddModal('jadwalPiket')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                ➕ Tambah Jadwal
              </button>
            </div>

            {/* Jadwal Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 border">Hari</th>
                    <th className="text-left p-2 border">Shift</th>
                    <th className="text-left p-2 border">Guru Piket</th>
                    <th className="text-center p-2 border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {HARI_KERJA.map(hari => (
                    ['PAGI', 'SIANG'].map(shift => {
                      const piket = jadwalPiketList.find(p => p.hari === hari && p.shift === shift);
                      return (
                        <tr key={`${hari}-${shift}`} className="hover:bg-gray-50">
                          <td className="p-2 border font-medium">{hari}</td>
                          <td className="p-2 border">
                            <span className={`px-2 py-1 rounded text-xs ${shift === 'PAGI' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {shift}
                            </span>
                          </td>
                          <td className="p-2 border">
                            {piket?.guru ? `${piket.guru.nama} ${piket.guru.gelar || ''}` : <span className="text-gray-400 italic">Belum ditentukan</span>}
                          </td>
                          <td className="p-2 border text-center">
                            {piket && (
                              <>
                                <button
                                  onClick={() => {
                                    setJadwalPiketForm({ hari: piket.hari, shift: piket.shift, guruId: piket.guruId });
                                    setEditModal({ type: 'jadwalPiket', data: piket });
                                  }}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                >✏️</button>
                                <button onClick={() => deleteJadwalPiket(piket.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== LAPORAN TAB ==================== */}
        {activeTab === 'laporan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Laporan</h2>
                <p className="text-gray-500">Rekap kehadiran bulanan</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  {BULAN.map((b, i) => (
                    <option key={i} value={i + 1}>{b}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg border p-4">
                <div className="text-2xl font-bold text-green-600">{stats.siswaHadir}</div>
                <div className="text-sm text-green-700">Siswa Hadir</div>
              </div>
              <div className="bg-yellow-50 rounded-lg border p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {siswaList.filter(s => kehadiranSiswaList[s.id] === 'SAKIT').length}
                </div>
                <div className="text-sm text-yellow-700">Siswa Sakit</div>
              </div>
              <div className="bg-blue-50 rounded-lg border p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {siswaList.filter(s => kehadiranSiswaList[s.id] === 'IZIN').length}
                </div>
                <div className="text-sm text-blue-700">Siswa Izin</div>
              </div>
              <div className="bg-red-50 rounded-lg border p-4">
                <div className="text-2xl font-bold text-red-600">
                  {siswaList.filter(s => ['ALFA', 'KABUR'].includes(kehadiranSiswaList[s.id])).length}
                </div>
                <div className="text-sm text-red-700">Siswa Alfa/Kabur</div>
              </div>
            </div>

            {/* Per Kelas */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Rekap Per Kelas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border">Kelas</th>
                      <th className="text-left p-2 border">Shift</th>
                      <th className="text-center p-2 border">Total Siswa</th>
                      <th className="text-center p-2 border">Tidak Hadir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelasList.map(kelas => {
                      const siswaKelas = siswaList.filter(s => s.kelasId === kelas.id);
                      const tidakHadir = siswaKelas.filter(s => {
                        const status = kehadiranSiswaList[s.id];
                        return status && status !== 'HADIR';
                      }).length;
                      
                      return (
                        <tr key={kelas.id} className="hover:bg-gray-50">
                          <td className="p-2 border font-medium">{kelas.nama}</td>
                          <td className="p-2 border">
                            <span className={`px-2 py-1 rounded text-xs ${kelas.shift === 'PAGI' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {kelas.shift}
                            </span>
                          </td>
                          <td className="p-2 border text-center">{siswaKelas.length}</td>
                          <td className="p-2 border text-center">
                            <span className={tidakHadir > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {tidakHadir}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PENGATURAN TAB ==================== */}
        {activeTab === 'pengaturan' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pengaturan</h2>

            <div className="bg-white rounded-lg border shadow-sm p-6 max-w-2xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Sekolah *</label>
                  <input
                    type="text"
                    value={pengaturanForm.namaSekolah}
                    onChange={(e) => setPengaturanForm({ ...pengaturanForm, namaSekolah: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="MTs Da'arul Ma'arif Pasawahan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alamat Sekolah</label>
                  <input
                    type="text"
                    value={pengaturanForm.alamatSekolah}
                    onChange={(e) => setPengaturanForm({ ...pengaturanForm, alamatSekolah: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Kp. Pasawahan, Kec. Maleber, Kab. Kuningan"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telepon</label>
                    <input
                      type="text"
                      value={pengaturanForm.telepon}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, telepon: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={pengaturanForm.email}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, email: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kepala Sekolah</label>
                  <input
                    type="text"
                    value={pengaturanForm.kepalaSekolah}
                    onChange={(e) => setPengaturanForm({ ...pengaturanForm, kepalaSekolah: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="KH. M. Sulaeman"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester</label>
                    <select
                      value={pengaturanForm.semester}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, semester: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
                    <input
                      type="text"
                      value={pengaturanForm.tahunAjaran}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, tahunAjaran: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="2024/2025"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo (Base64)</label>
                  <textarea
                    value={pengaturanForm.logo}
                    onChange={(e) => setPengaturanForm({ ...pengaturanForm, logo: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-20 text-xs"
                    placeholder="data:image/png;base64,..."
                  />
                </div>
                <button onClick={savePengaturan} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700">
                  💾 Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          Aplikasi Guru Piket © 2025 - {pengaturan?.namaSekolah || 'MTs Da\'arul Ma\'arif Pasawahan'}
        </div>
      </footer>

      {/* ==================== MODALS ==================== */}

      {/* Add/Edit Guru Modal */}
      <Modal
        isOpen={addModal === 'guru' || editModal?.type === 'guru'}
        onClose={() => { setAddModal(null); setEditModal(null); setGuruForm({ kode: '', nama: '', gelar: '' }); }}
        title={editModal?.type === 'guru' ? 'Edit Guru' : 'Tambah Guru'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kode Guru</label>
            <input
              type="text"
              value={guruForm.kode}
              onChange={(e) => setGuruForm({ ...guruForm, kode: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="G001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
            <input
              type="text"
              value={guruForm.nama}
              onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nama guru"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gelar</label>
            <input
              type="text"
              value={guruForm.gelar}
              onChange={(e) => setGuruForm({ ...guruForm, gelar: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="S.Pd, M.Pd"
            />
          </div>
          <button onClick={() => saveGuru(editModal?.type === 'guru')} className="w-full bg-emerald-600 text-white py-2 rounded-lg">
            💾 Simpan
          </button>
        </div>
      </Modal>

      {/* Add/Edit Siswa Modal */}
      <Modal
        isOpen={addModal === 'siswa' || editModal?.type === 'siswa'}
        onClose={() => { setAddModal(null); setEditModal(null); setSiswaForm({ nama: '', kelasId: '' }); }}
        title={editModal?.type === 'siswa' ? 'Edit Siswa' : 'Tambah Siswa'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
            <input
              type="text"
              value={siswaForm.nama}
              onChange={(e) => setSiswaForm({ ...siswaForm, nama: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nama siswa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kelas *</label>
            <select
              value={siswaForm.kelasId}
              onChange={(e) => setSiswaForm({ ...siswaForm, kelasId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Pilih Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama} ({k.shift})</option>
              ))}
            </select>
          </div>
          <button onClick={() => saveSiswa(editModal?.type === 'siswa')} className="w-full bg-emerald-600 text-white py-2 rounded-lg">
            💾 Simpan
          </button>
        </div>
      </Modal>

      {/* Add/Edit Jadwal Piket Modal */}
      <Modal
        isOpen={addModal === 'jadwalPiket' || editModal?.type === 'jadwalPiket'}
        onClose={() => { setAddModal(null); setEditModal(null); setJadwalPiketForm({ hari: 'Senin', shift: 'PAGI', guruId: '' }); }}
        title={editModal?.type === 'jadwalPiket' ? 'Edit Jadwal Piket' : 'Tambah Jadwal Piket'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hari</label>
            <select
              value={jadwalPiketForm.hari}
              onChange={(e) => setJadwalPiketForm({ ...jadwalPiketForm, hari: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              {HARI_KERJA.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shift</label>
            <select
              value={jadwalPiketForm.shift}
              onChange={(e) => setJadwalPiketForm({ ...jadwalPiketForm, shift: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="PAGI">Pagi (07:00 - 12:30)</option>
              <option value="SIANG">Siang (12:40 - 17:00)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Guru Piket *</label>
            <select
              value={jadwalPiketForm.guruId}
              onChange={(e) => setJadwalPiketForm({ ...jadwalPiketForm, guruId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Pilih Guru</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>{g.nama} {g.gelar || ''}</option>
              ))}
            </select>
          </div>
          <button onClick={() => saveJadwalPiket(editModal?.type === 'jadwalPiket')} className="w-full bg-emerald-600 text-white py-2 rounded-lg">
            💾 Simpan
          </button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
