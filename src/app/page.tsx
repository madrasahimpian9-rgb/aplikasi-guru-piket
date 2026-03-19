'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  BarChart3, 
  Users, 
  UserCog, 
  Settings, 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Printer,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  BookOpen,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Search,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';

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
}

interface Guru {
  id: string;
  kode: string;
  nama: string;
  gelar?: string;
  jadwal?: Jadwal[];
}

interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
}

interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  shift: string;
  _count?: { siswa: number };
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
  mapelId: string;
  guruId: string;
  kelas?: Kelas;
  mapel?: MataPelajaran;
  guru?: Guru;
}

interface KehadiranGuru {
  id: string;
  tanggal: string;
  jadwalId: string;
  guruId: string;
  status: string;
  keterangan?: string;
  jadwal?: Jadwal;
  guru?: Guru;
}

interface KehadiranSiswa {
  id: string;
  tanggal: string;
  siswaId: string;
  kelasId: string;
  status: string;
  keterangan?: string;
  siswa?: Siswa;
  kelas?: Kelas;
}

interface DashboardData {
  tanggal: string;
  hari: string;
  jadwalHariIni: Jadwal[];
  kehadiranGuru: KehadiranGuru[];
  kehadiranSiswa: KehadiranSiswa[];
  ketidakhadiranPerKelas: Array<{
    kelasId: string;
    kelas: string;
    shift: string;
    totalSiswa: number;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    kabur: number;
    belumInput: number;
  }>;
  summary: {
    totalSiswa: number;
    totalGuru: number;
    totalKelas: number;
    totalJadwalHariIni: number;
    guruMengajarHariIni: number;
    guruHadir: number;
    guruTidakHadir: number;
    siswaHadir: number;
    siswaSakit: number;
    siswaIzin: number;
    siswaAlfa: number;
    siswaKabur: number;
  };
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const STATUS_SISWA = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-green-500' },
  { value: 'SAKIT', label: 'Sakit', color: 'bg-yellow-500' },
  { value: 'IZIN', label: 'Izin', color: 'bg-blue-500' },
  { value: 'ALFA', label: 'Alfa', color: 'bg-red-500' },
  { value: 'KABUR', label: 'Kabur', color: 'bg-orange-500' },
];

const STATUS_GURU = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-green-500' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir', color: 'bg-red-500' },
];

export default function Home() {
  // State
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedHari, setSelectedHari] = useState<string>('Senin');
  const [selectedShift, setSelectedShift] = useState<string>('');
  
  // Form states
  const [guruForm, setGuruForm] = useState({ kode: '', nama: '', gelar: '' });
  const [kelasForm, setKelasForm] = useState({ nama: '', tingkat: 7, shift: 'PAGI' });
  const [siswaForm, setSiswaForm] = useState({ nama: '', kelasId: '' });
  const [jadwalForm, setJadwalForm] = useState({
    hari: 'Senin',
    jamKe: 1,
    waktuMulai: '07:00',
    waktuSelesai: '07:30',
    kelasId: '',
    guruId: '',
  });
  const [pengaturanForm, setPengaturanForm] = useState({
    namaSekolah: '',
    alamatSekolah: '',
    telepon: '',
    email: '',
    kepalaSekolah: '',
    semester: 'Genap',
    tahunAjaran: '',
  });

  // Dialog states
  const [editGuruOpen, setEditGuruOpen] = useState(false);
  const [editKelasOpen, setEditKelasOpen] = useState(false);
  const [editSiswaOpen, setEditSiswaOpen] = useState(false);
  const [editJadwalOpen, setEditJadwalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);

  // Jadwal matrix state - for the new format
  const [jadwalMatrix, setJadwalMatrix] = useState<Record<string, Record<number, string>>>({}); // { guruId: { jamKe: kelasId } }
  const [selectedShiftJadwal, setSelectedShiftJadwal] = useState<string>('PAGI');

  // Kehadiran states
  const [kehadiranGuruList, setKehadiranGuruList] = useState<Record<string, string>>({});
  const [kehadiranSiswaList, setKehadiranSiswaList] = useState<Record<string, string>>({});
  const [keteranganGuru, setKeteranganGuru] = useState<Record<string, string>>({});
  const [keteranganSiswa, setKeteranganSiswa] = useState<Record<string, string>>({});

  // Laporan states
  const [laporanBulan, setLaporanBulan] = useState(new Date().getMonth() + 1);
  const [laporanTahun, setLaporanTahun] = useState(new Date().getFullYear());
  const [laporanTipe, setLaporanTipe] = useState<'guru' | 'siswa'>('guru');
  const [laporanData, setLaporanData] = useState<unknown[]>([]);

  // Search states
  const [searchSiswa, setSearchSiswa] = useState('');

  // Checkbox/Selection states
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<Set<string>>(new Set());
  const [selectedGuruIds, setSelectedGuruIds] = useState<Set<string>>(new Set());

  // Helper functions for selection
  const toggleSelectAllSiswa = (filteredSiswa: Siswa[]) => {
    if (selectedSiswaIds.size === filteredSiswa.length) {
      setSelectedSiswaIds(new Set());
    } else {
      setSelectedSiswaIds(new Set(filteredSiswa.map(s => s.id)));
    }
  };

  const toggleSiswaSelection = (siswaId: string) => {
    const newSet = new Set(selectedSiswaIds);
    if (newSet.has(siswaId)) {
      newSet.delete(siswaId);
    } else {
      newSet.add(siswaId);
    }
    setSelectedSiswaIds(newSet);
  };

  const bulkSetStatusSiswa = (status: string) => {
    const newKehadiran = { ...kehadiranSiswaList };
    selectedSiswaIds.forEach(id => {
      newKehadiran[id] = status;
    });
    setKehadiranSiswaList(newKehadiran);
    setSelectedSiswaIds(new Set());
  };

  const toggleSelectAllGuru = () => {
    if (selectedGuruIds.size === guruList.length) {
      setSelectedGuruIds(new Set());
    } else {
      setSelectedGuruIds(new Set(guruList.map(g => g.id)));
    }
  };

  const toggleGuruSelection = (guruId: string) => {
    const newSet = new Set(selectedGuruIds);
    if (newSet.has(guruId)) {
      newSet.delete(guruId);
    } else {
      newSet.add(guruId);
    }
    setSelectedGuruIds(newSet);
  };

  const bulkDeleteSiswa = async () => {
    if (selectedSiswaIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedSiswaIds.size} siswa terpilih?`)) return;
    
    try {
      let successCount = 0;
      for (const id of selectedSiswaIds) {
        const res = await fetch(`/api/siswa?id=${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      }
      await fetchSiswa(selectedKelas && selectedKelas !== 'all' ? selectedKelas : undefined);
      setSelectedSiswaIds(new Set());
      alert(`${successCount} siswa berhasil dihapus!`);
    } catch (error) {
      alert('Gagal menghapus siswa!');
    }
  };

  const bulkDeleteGuru = async () => {
    if (selectedGuruIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedGuruIds.size} guru terpilih?`)) return;
    
    try {
      let successCount = 0;
      for (const id of selectedGuruIds) {
        const res = await fetch(`/api/guru?id=${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      }
      await fetchGuru();
      setSelectedGuruIds(new Set());
      alert(`${successCount} guru berhasil dihapus!`);
    } catch (error) {
      alert('Gagal menghapus guru!');
    }
  };

  // Fetch functions
  const fetchPengaturan = async () => {
    try {
      const res = await fetch('/api/pengaturan');
      const data = await res.json();
      setPengaturan(data);
      setPengaturanForm({
        namaSekolah: data.namaSekolah || '',
        alamatSekolah: data.alamatSekolah || '',
        telepon: data.telepon || '',
        email: data.email || '',
        kepalaSekolah: data.kepalaSekolah || '',
        semester: data.semester || 'Genap',
        tahunAjaran: data.tahunAjaran || '',
      });
    } catch (error) {
      console.error('Error fetching pengaturan:', error);
    }
  };

  const fetchGuru = async () => {
    try {
      const res = await fetch('/api/guru');
      const data = await res.json();
      setGuruList(data);
    } catch (error) {
      console.error('Error fetching guru:', error);
    }
  };

  const fetchKelas = async () => {
    try {
      const res = await fetch('/api/kelas');
      const data = await res.json();
      setKelasList(data);
    } catch (error) {
      console.error('Error fetching kelas:', error);
    }
  };

  const fetchSiswa = async (kelasId?: string) => {
    try {
      const url = kelasId ? `/api/siswa?kelasId=${kelasId}` : '/api/siswa';
      const res = await fetch(url);
      const data = await res.json();
      setSiswaList(data);
    } catch (error) {
      console.error('Error fetching siswa:', error);
    }
  };

  const fetchJadwal = async (hari?: string, kelasId?: string) => {
    try {
      const params = new URLSearchParams();
      if (hari) params.append('hari', hari);
      if (kelasId) params.append('kelasId', kelasId);
      const res = await fetch(`/api/jadwal?${params.toString()}`);
      const data = await res.json();
      setJadwalList(data);
      return data;
    } catch (error) {
      console.error('Error fetching jadwal:', error);
      return [];
    }
  };

  const fetchDashboard = async (tanggal?: string) => {
    try {
      setLoading(true);
      const dateStr = tanggal || format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/dashboard?tanggal=${dateStr}`);
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKehadiranGuru = async (tanggal: string) => {
    try {
      const res = await fetch(`/api/kehadiran/guru?tanggal=${tanggal}`);
      const data = await res.json();
      const map: Record<string, string> = {};
      const ketMap: Record<string, string> = {};
      data.forEach((k: KehadiranGuru) => {
        map[k.jadwalId] = k.status;
        if (k.keterangan) ketMap[k.jadwalId] = k.keterangan;
      });
      setKehadiranGuruList(map);
      setKeteranganGuru(ketMap);
    } catch (error) {
      console.error('Error fetching kehadiran guru:', error);
    }
  };

  const fetchKehadiranSiswa = async (tanggal: string, kelasId?: string) => {
    try {
      const params = new URLSearchParams({ tanggal });
      if (kelasId) params.append('kelasId', kelasId);
      const res = await fetch(`/api/kehadiran/siswa?${params.toString()}`);
      const data = await res.json();
      const map: Record<string, string> = {};
      const ketMap: Record<string, string> = {};
      data.forEach((k: KehadiranSiswa) => {
        map[k.siswaId] = k.status;
        if (k.keterangan) ketMap[k.siswaId] = k.keterangan;
      });
      setKehadiranSiswaList(map);
      setKeteranganSiswa(ketMap);
    } catch (error) {
      console.error('Error fetching kehadiran siswa:', error);
    }
  };

  // Load jadwal matrix from jadwalList
  const loadJadwalMatrix = useCallback(() => {
    const matrix: Record<string, Record<number, string>> = {};
    
    // Initialize matrix for all teachers
    guruList.forEach(guru => {
      matrix[guru.id] = {};
    });
    
    // Fill matrix with existing jadwal data
    jadwalList.forEach(j => {
      if (j.hari === selectedHari && j.kelas?.shift === selectedShiftJadwal) {
        if (!matrix[j.guruId]) {
          matrix[j.guruId] = {};
        }
        matrix[j.guruId][j.jamKe] = j.kelasId;
      }
    });
    
    setJadwalMatrix(matrix);
  }, [jadwalList, selectedHari, selectedShiftJadwal, guruList]);

  // Load matrix when jadwal data changes
  useEffect(() => {
    if (guruList.length > 0 && jadwalList.length >= 0) {
      loadJadwalMatrix();
    }
  }, [jadwalList, selectedHari, selectedShiftJadwal, guruList, loadJadwalMatrix]);

  // Save jadwal matrix
  const saveJadwalMatrix = async () => {
    try {
      setLoading(true);
      
      // Build jadwal data from matrix
      const jadwalData: Array<{
        hari: string;
        jamKe: number;
        guruId: string;
        kelasId: string;
        waktuMulai: string;
        waktuSelesai: string;
      }> = [];
      
      // Time slots based on shift (9 jam per shift)
      const waktuPagi = [
        { jam: 1, mulai: '06:30', selesai: '07:10' },
        { jam: 2, mulai: '07:10', selesai: '07:50' },
        { jam: 3, mulai: '07:50', selesai: '08:30' },
        { jam: 4, mulai: '08:30', selesai: '09:10' },
        { jam: 5, mulai: '09:25', selesai: '10:05' },
        { jam: 6, mulai: '10:05', selesai: '10:45' },
        { jam: 7, mulai: '10:45', selesai: '11:25' },
        { jam: 8, mulai: '11:25', selesai: '12:05' },
        { jam: 9, mulai: '12:05', selesai: '12:45' },
      ];
      
      const waktuSiang = [
        { jam: 1, mulai: '12:40', selesai: '13:15' },
        { jam: 2, mulai: '13:15', selesai: '13:50' },
        { jam: 3, mulai: '13:50', selesai: '14:25' },
        { jam: 4, mulai: '14:25', selesai: '15:00' },
        { jam: 5, mulai: '15:15', selesai: '15:50' },
        { jam: 6, mulai: '15:50', selesai: '16:25' },
        { jam: 7, mulai: '16:25', selesai: '16:55' },
        { jam: 8, mulai: '16:55', selesai: '17:25' },
        { jam: 9, mulai: '17:25', selesai: '18:00' },
      ];
      
      const waktuSlots = selectedShiftJadwal === 'PAGI' ? waktuPagi : waktuSiang;
      
      Object.entries(jadwalMatrix).forEach(([guruId, jams]) => {
        Object.entries(jams).forEach(([jamKe, kelasId]) => {
          if (kelasId && kelasId !== '') {
            const jam = parseInt(jamKe);
            const waktu = waktuSlots.find(w => w.jam === jam) || waktuSlots[0];
            jadwalData.push({
              hari: selectedHari,
              jamKe: jam,
              guruId,
              kelasId,
              waktuMulai: waktu.mulai,
              waktuSelesai: waktu.selesai,
            });
          }
        });
      });
      
      // Send to API
      const res = await fetch('/api/jadwal/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hari: selectedHari,
          shift: selectedShiftJadwal,
          jadwalData,
        }),
      });
      
      if (res.ok) {
        alert('Jadwal berhasil disimpan!');
        await fetchJadwal();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menyimpan jadwal');
      }
    } catch (error) {
      console.error('Error saving jadwal matrix:', error);
      alert(error instanceof Error ? error.message : 'Gagal menyimpan jadwal!');
    } finally {
      setLoading(false);
    }
  };

  // Update single cell in matrix
  const updateJadwalCell = (guruId: string, jamKe: number, kelasId: string) => {
    setJadwalMatrix(prev => {
      const newJams = { ...prev[guruId] };
      if (kelasId === 'kosong') {
        delete newJams[jamKe]; // Remove the key if "kosong" is selected
      } else {
        newJams[jamKe] = kelasId;
      }
      return {
        ...prev,
        [guruId]: newJams,
      };
    });
  };

  // Add new guru row to matrix
  const addGuruToMatrix = (guruId: string) => {
    setJadwalMatrix(prev => ({
      ...prev,
      [guruId]: prev[guruId] || {},
    }));
  };

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/laporan?bulan=${laporanBulan}&tahun=${laporanTahun}&tipe=${laporanTipe}`);
      const data = await res.json();
      setLaporanData(data.data);
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    setMounted(true);
    fetchPengaturan();
    fetchGuru();
    fetchKelas();
    fetchSiswa();
    fetchJadwal();
    fetchDashboard();
  }, []);

  // Update dashboard when date changes
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    fetchDashboard(dateStr);
    fetchKehadiranGuru(dateStr);
    if (selectedKelas && selectedKelas !== 'all') {
      fetchKehadiranSiswa(dateStr, selectedKelas);
    } else {
      fetchKehadiranSiswa(dateStr);
    }
  }, [selectedDate, selectedKelas]);

  // Update jadwal when hari changes
  useEffect(() => {
    fetchJadwal(selectedHari);
  }, [selectedHari]);

  // CRUD functions
  const savePengaturan = async () => {
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pengaturanForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPengaturan(data);
        alert('Pengaturan berhasil disimpan!');
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving pengaturan:', error);
      alert(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan!');
    }
  };

  const saveGuru = async (isEdit = false) => {
    try {
      const url = '/api/guru';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...guruForm, id: (editItem as Guru)?.id } : guruForm;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await fetchGuru();
      setGuruForm({ kode: '', nama: '', gelar: '' });
      setEditGuruOpen(false);
      setEditItem(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan guru!');
    }
  };

  const deleteGuru = async (id: string) => {
    if (!confirm('Yakin ingin menghapus guru ini?')) return;
    try {
      const res = await fetch(`/api/guru?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Guru berhasil dihapus!');
        await fetchGuru();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menghapus guru');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus guru!');
    }
  };

  const saveKelas = async (isEdit = false) => {
    try {
      const url = '/api/kelas';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...kelasForm, id: (editItem as Kelas)?.id } : kelasForm;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await fetchKelas();
      setKelasForm({ nama: '', tingkat: 7, shift: 'PAGI' });
      setEditKelasOpen(false);
      setEditItem(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan kelas!');
    }
  };

  const deleteKelas = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kelas ini? Semua siswa di kelas ini juga akan terhapus.')) return;
    try {
      const res = await fetch(`/api/kelas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Kelas berhasil dihapus!');
        await fetchKelas();
        await fetchSiswa();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menghapus kelas');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus kelas!');
    }
  };

  const saveSiswa = async (isEdit = false) => {
    try {
      const url = '/api/siswa';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...siswaForm, id: (editItem as Siswa)?.id } : siswaForm;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await fetchSiswa(selectedKelas);
      setSiswaForm({ nama: '', kelasId: '' });
      setEditSiswaOpen(false);
      setEditItem(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan siswa!');
    }
  };

  const deleteSiswa = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    try {
      const res = await fetch(`/api/siswa?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Siswa berhasil dihapus!');
        await fetchSiswa(selectedKelas && selectedKelas !== 'all' ? selectedKelas : undefined);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menghapus siswa');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus siswa!');
    }
  };

  const saveJadwal = async (isEdit = false) => {
    try {
      const url = '/api/jadwal';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...jadwalForm, id: (editItem as Jadwal)?.id } : jadwalForm;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await fetchJadwal(selectedHari);
      setJadwalForm({
        hari: 'Senin',
        jamKe: 1,
        waktuMulai: '07:00',
        waktuSelesai: '07:30',
        kelasId: '',
        mapelId: '',
        guruId: '',
      });
      setEditJadwalOpen(false);
      setEditItem(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan jadwal!');
    }
  };

  const deleteJadwal = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      const res = await fetch(`/api/jadwal?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Jadwal berhasil dihapus!');
        await fetchJadwal(selectedHari);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menghapus jadwal');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus jadwal!');
    }
  };

  // Upload handlers - XLSX
  const handleUploadSiswa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      if (jsonData.length === 0) {
        alert('File XLSX kosong!');
        return;
      }

      // Skip header if exists (check if first row contains 'nama' or 'kelas')
      const startIdx = jsonData[0]?.[0]?.toString().toLowerCase().includes('nama') ? 1 : 0;
      
      const siswaData = [];
      for (let i = startIdx; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length >= 2 && row[0] && row[1]) {
          const nama = row[0].toString().trim();
          const kelasNama = row[1].toString().trim();
          const kelas = kelasList.find(k => k.nama === kelasNama);
          if (kelas && nama) {
            siswaData.push({ nama, kelasId: kelas.id });
          }
        }
      }

      if (siswaData.length === 0) {
        alert('Tidak ada data siswa yang valid. Format kolom: Nama, Kelas');
        return;
      }

      const res = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siswaData),
      });
      
      if (res.ok) {
        alert(`Berhasil mengimport ${siswaData.length} siswa dari file XLSX!`);
        await fetchSiswa();
      } else {
        throw new Error('Gagal mengimport data siswa');
      }
    } catch (error) {
      console.error('Error reading XLSX:', error);
      alert(error instanceof Error ? error.message : 'Gagal membaca file XLSX!');
    }
    
    e.target.value = '';
  };

  // Upload Guru from XLSX
  const handleUploadGuru = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      if (jsonData.length === 0) {
        alert('File XLSX kosong!');
        return;
      }

      // Skip header if exists
      const startIdx = jsonData[0]?.[0]?.toString().toLowerCase().includes('kode') ? 1 : 0;
      
      const guruData = [];
      for (let i = startIdx; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length >= 2 && row[0] && row[1]) {
          const kode = row[0]?.toString().trim() || '';
          const nama = row[1]?.toString().trim() || '';
          const gelar = row[2]?.toString().trim() || '';
          if (nama) {
            guruData.push({ kode, nama, gelar });
          }
        }
      }

      if (guruData.length === 0) {
        alert('Tidak ada data guru yang valid. Format kolom: Kode, Nama, Gelar');
        return;
      }

      const res = await fetch('/api/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guruData),
      });
      
      if (res.ok) {
        alert(`Berhasil mengimport ${guruData.length} guru dari file XLSX!`);
        await fetchGuru();
      } else {
        throw new Error('Gagal mengimport data guru');
      }
    } catch (error) {
      console.error('Error reading XLSX:', error);
      alert(error instanceof Error ? error.message : 'Gagal membaca file XLSX!');
    }
    
    e.target.value = '';
  };

  // Export functions
  const exportSiswaToXLSX = () => {
    const data = siswaList.map((s, idx) => ({
      'No': idx + 1,
      'Nama Siswa': s.nama,
      'Kelas': s.kelas?.nama || kelasList.find(k => k.id === s.kelasId)?.nama || '-',
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    
    // Auto-fit columns
    const colWidths = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama
      { wch: 10 },  // Kelas
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `Data_Siswa_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportGuruToXLSX = () => {
    const data = guruList.map((g, idx) => ({
      'No': idx + 1,
      'Kode': g.kode,
      'Nama Guru': g.nama,
      'Gelar': g.gelar || '-',
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
    
    const colWidths = [
      { wch: 5 },   // No
      { wch: 10 },  // Kode
      { wch: 30 },  // Nama
      { wch: 15 },  // Gelar
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `Data_Guru_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportKehadiranSiswaToXLSX = () => {
    const tanggalStr = format(selectedDate, 'yyyy-MM-dd');
    const data = siswaList
      .filter(s => selectedKelas === 'all' || s.kelasId === selectedKelas)
      .map((s, idx) => ({
        'No': idx + 1,
        'Nama Siswa': s.nama,
        'Kelas': s.kelas?.nama || kelasList.find(k => k.id === s.kelasId)?.nama || '-',
        'Status': kehadiranSiswaList[s.id] || 'HADIR',
        'Keterangan': keteranganSiswa[s.id] || '-',
      }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran Siswa');
    
    const colWidths = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama
      { wch: 10 },  // Kelas
      { wch: 12 },  // Status
      { wch: 20 },  // Keterangan
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `Kehadiran_Siswa_${tanggalStr}.xlsx`);
  };

  const exportMonitoringToXLSX = () => {
    const tanggalStr = format(selectedDate, 'yyyy-MM-dd');
    const guruMengajar = getGuruMengajarHariIni();
    
    const data = guruMengajar.map((guru, idx) => {
      const jadwalGuru = getJadwalByGuru(guru.id);
      const totalHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] !== 'TIDAK_HADIR').length;
      const totalTidakHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR').length;
      
      const row: Record<string, string | number> = {
        'No': idx + 1,
        'Nama Guru': `${guru.nama} ${guru.gelar || ''}`,
      };
      
      // Add columns for each jam (1-10)
      for (let jam = 1; jam <= 10; jam++) {
        const jadwal = jadwalGuru.find(j => j.jamKe === jam);
        row[`Jam ${jam}`] = jadwal 
          ? `${jadwal.kelas?.nama || '-'}${kehadiranGuruList[jadwal.id] === 'TIDAK_HADIR' ? ' (TH)' : ''}`
          : '-';
      }
      
      row['H'] = totalHadir;
      row['TH'] = totalTidakHadir;
      
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monitoring KBM');
    
    const colWidths = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama Guru
      ...Array(10).fill({ wch: 10 }), // Jam 1-10
      { wch: 5 },   // H
      { wch: 5 },   // TH
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `Monitoring_KBM_${selectedHari}_${tanggalStr}.xlsx`);
  };

  const downloadTemplateSiswa = () => {
    const data = [
      { 'Nama': 'Contoh Nama Siswa 1', 'Kelas': '7A' },
      { 'Nama': 'Contoh Nama Siswa 2', 'Kelas': '7B' },
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    
    const colWidths = [{ wch: 30 }, { wch: 10 }];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  };

  const downloadTemplateGuru = () => {
    const data = [
      { 'Kode': 'G001', 'Nama': 'Contoh Nama Guru 1', 'Gelar': 'S.Pd' },
      { 'Kode': 'G002', 'Nama': 'Contoh Nama Guru 2', 'Gelar': 'M.Pd' },
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
    
    const colWidths = [{ wch: 10 }, { wch: 30 }, { wch: 15 }];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, 'Template_Import_Guru.xlsx');
  };

  // Save kehadiran
  const saveKehadiranGuru = async () => {
    try {
      const tanggal = format(selectedDate, 'yyyy-MM-dd');
      const jadwalHariIni = await fetchJadwal(dashboardData?.hari || 'Senin');
      
      const kehadiranData = jadwalHariIni.map(j => ({
        tanggal,
        jadwalId: j.id,
        guruId: j.guruId,
        status: kehadiranGuruList[j.id] || 'HADIR',
        keterangan: keteranganGuru[j.id] || '',
      }));

      const res = await fetch('/api/kehadiran/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kehadiranData),
      });

      if (res.ok) {
        alert('Kehadiran guru berhasil disimpan!');
        fetchDashboard(tanggal);
        fetchKehadiranGuru(tanggal);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menyimpan kehadiran guru');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan kehadiran guru!');
    }
  };

  const saveKehadiranSiswa = async () => {
    try {
      const tanggal = format(selectedDate, 'yyyy-MM-dd');
      // If 'all' is selected, save all students; otherwise save only selected class
      const siswaKelas = selectedKelas === 'all' 
        ? siswaList 
        : siswaList.filter(s => s.kelasId === selectedKelas);
      
      if (siswaKelas.length === 0) {
        alert('Tidak ada siswa untuk disimpan!');
        return;
      }
      
      const kehadiranData = siswaKelas.map(s => ({
        tanggal,
        siswaId: s.id,
        kelasId: s.kelasId,
        status: kehadiranSiswaList[s.id] || 'HADIR',
        keterangan: keteranganSiswa[s.id] || '',
      }));

      const res = await fetch('/api/kehadiran/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kehadiranData),
      });

      if (res.ok) {
        alert('Kehadiran siswa berhasil disimpan!');
        fetchDashboard(tanggal);
        fetchKehadiranSiswa(tanggal, selectedKelas === 'all' ? undefined : selectedKelas);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menyimpan kehadiran siswa');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan kehadiran siswa!');
    }
  };

  // Print berita acara
  const printBeritaAcara = () => {
    const tanggalStr = format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id });
    const jadwalHariIni = jadwalList.filter(j => j.hari === dashboardData?.hari);
    const guruHadir = jadwalHariIni.filter(j => kehadiranGuruList[j.id] !== 'TIDAK_HADIR');
    const guruTidakHadir = jadwalHariIni.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Berita Acara KBM</title>
        <style>
          @page { size: A4 landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 16px; }
          .header h2 { margin: 5px 0; font-size: 14px; font-weight: normal; }
          .info { margin-bottom: 15px; }
          .info p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 5px; text-align: left; }
          th { background: #f0f0f0; }
          .section-title { font-weight: bold; margin: 15px 0 10px; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BERITA ACARA KEGIATAN BELAJAR MENGAJAR (KBM)</h1>
          <h2>${pengaturan?.namaSekolah || 'Madrasah Tsanawiyah'}</h2>
          <h2>Tahun Pelajaran ${pengaturan?.tahunAjaran || '-'} Semester ${pengaturan?.semester || '-'}</h2>
        </div>
        
        <div class="info">
          <p><strong>Hari/Tanggal:</strong> ${tanggalStr}</p>
        </div>
        
        <div class="section-title">I. GURU YANG MENGAJAR HARI INI:</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Jam</th>
              <th>Kelas</th>
              <th>Mata Pelajaran</th>
              <th>Nama Guru</th>
              <th>Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${jadwalHariIni.map((j, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${j.waktuMulai} - ${j.waktuSelesai}</td>
                <td>${j.kelas?.nama || '-'}</td>
                <td>${j.mapel?.nama || '-'}</td>
                <td>${j.guru?.nama}${j.guru?.gelar ? ', ' + j.guru.gelar : ''}</td>
                <td>${kehadiranGuruList[j.id] === 'TIDAK_HADIR' ? 'Tidak Hadir' : 'Hadir'}</td>
                <td>${keteranganGuru[j.id] || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${guruTidakHadir.length > 0 ? `
          <div class="section-title">II. GURU YANG BERHALANGAN HADIR:</div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Guru</th>
                <th>Mata Pelajaran</th>
                <th>Kelas</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              ${guruTidakHadir.map((j, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${j.guru?.nama}${j.guru?.gelar ? ', ' + j.guru.gelar : ''}</td>
                  <td>${j.mapel?.nama || '-'}</td>
                  <td>${j.kelas?.nama || '-'}</td>
                  <td>${keteranganGuru[j.id] || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        <div class="section-title">III. KETIDAKHADIRAN SISWA:</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Kelas</th>
              <th>Sakit</th>
              <th>Izin</th>
              <th>Alfa</th>
              <th>Kabur</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${dashboardData?.ketidakhadiranPerKelas.map((k, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${k.kelas}</td>
                <td>${k.sakit}</td>
                <td>${k.izin}</td>
                <td>${k.alfa}</td>
                <td>${k.kabur}</td>
                <td>${k.sakit + k.izin + k.alfa + k.kabur}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="footer">
          <div class="signature">
            <p>Mengetahui,</p>
            <p>Kepala Madrasah</p>
            <div class="signature-line">${pengaturan?.kepalaSekolah || '____________________'}</div>
          </div>
          <div class="signature">
            <p>&nbsp;</p>
            <p>Guru Piket</p>
            <div class="signature-line">____________________</div>
          </div>
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

  // Get unique jam ke for monitoring
  const getUniqueJamKe = () => {
    const jamSet = new Set<number>();
    jadwalList.forEach(j => jamSet.add(j.jamKe));
    return Array.from(jamSet).sort((a, b) => a - b);
  };

  // Group jadwal by kelas for monitoring
  const groupJadwalByKelas = () => {
    const grouped: Record<string, Record<number, Jadwal>> = {};
    jadwalList.forEach(j => {
      if (!grouped[j.kelasId]) {
        grouped[j.kelasId] = {};
      }
      grouped[j.kelasId][j.jamKe] = j;
    });
    return grouped;
  };

  // Get guru yang mengajar hari ini
  const getGuruMengajarHariIni = () => {
    const jadwalHariIni = jadwalList.filter(j => j.hari === selectedHari);
    const guruIds = [...new Set(jadwalHariIni.map(j => j.guruId))];
    
    return guruList.filter(g => guruIds.includes(g.id)).sort((a, b) => a.nama.localeCompare(b.nama));
  };

  // Get jadwal by guru
  const getJadwalByGuru = (guruId: string) => {
    return jadwalList.filter(j => j.guruId === guruId && j.hari === selectedHari).sort((a, b) => a.jamKe - b.jamKe);
  };

  // Print monitoring
  const printMonitoring = () => {
    const tanggalStr = format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id });
    const guruMengajar = getGuruMengajarHariIni();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Hadir Jam Tatap Muka</title>
        <style>
          @page { size: A4 landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 14px; font-weight: bold; }
          .header h2 { margin: 5px 0; font-size: 13px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 4px; text-align: center; }
          th { background: #f0f0f0; font-weight: bold; }
          td.nama { text-align: left; font-weight: bold; }
          .hadir { background: #d4edda; }
          .tidak-hadir { background: #f8d7da; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 180px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DAFTAR HADIR JAM TATAP MUKA PNS, GTY, GTT</h1>
          <h2>${pengaturan?.namaSekolah || 'MTs Da\'arul Ma\'arif Pasawahan'}</h2>
          <p>Tahun Pelajaran ${pengaturan?.tahunAjaran || '2025/2026'} Semester ${pengaturan?.semester || 'Genap'}</p>
          <p>Hari: <strong>${selectedHari}</strong>, Tanggal: <strong>${tanggalStr}</strong></p>
          <p>Shift: <strong>${selectedShift || 'Semua'}</strong></p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 180px;">Nama Guru</th>
              ${Array.from({ length: 10 }, (_, i) => `<th>Jam ${i + 1}</th>`).join('')}
              <th>H</th>
              <th>TH</th>
            </tr>
          </thead>
          <tbody>
            ${guruMengajar.map((guru, idx) => {
              const jadwalGuru = getJadwalByGuru(guru.id);
              const totalHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] !== 'TIDAK_HADIR').length;
              const totalTidakHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR').length;
              
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="nama">${guru.nama} ${guru.gelar || ''}</td>
                  ${Array.from({ length: 10 }, (_, i) => {
                    const jam = i + 1;
                    const jadwal = jadwalGuru.find(j => j.jamKe === jam);
                    if (!jadwal) return '<td>-</td>';
                    const tidakHadir = kehadiranGuruList[jadwal.id] === 'TIDAK_HADIR';
                    const kelasNama = jadwal.kelas?.nama || '-';
                    return `<td class="${tidakHadir ? 'tidak-hadir' : 'hadir'}"><strong>${kelasNama}</strong></td>`;
                  }).join('')}
                  <td><strong>${totalHadir}</strong></td>
                  <td><strong>${totalTidakHadir}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div class="signature">
            <p>Mengetahui,</p>
            <p>Kepala Madrasah</p>
            <div class="signature-line">${pengaturan?.kepalaSekolah || '____________________'}</div>
          </div>
          <div class="signature">
            <p>&nbsp;</p>
            <p>Guru Piket</p>
            <div class="signature-line">____________________</div>
          </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Aplikasi Guru Piket</h1>
                <p className="text-xs text-gray-500">{pengaturan?.namaSekolah || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {pengaturan?.semester} {pengaturan?.tahunAjaran}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <ClipboardList className="w-4 h-4" />
              <span>Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="beritaacara" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <FileText className="w-4 h-4" />
              <span>Berita Acara</span>
            </TabsTrigger>
            <TabsTrigger value="laporan" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <BarChart3 className="w-4 h-4" />
              <span>Laporan</span>
            </TabsTrigger>
            <TabsTrigger value="guru" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Jadwal Mengajar</span>
            </TabsTrigger>
            <TabsTrigger value="siswa" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <Users className="w-4 h-4" />
              <span>Siswa & Kelas</span>
            </TabsTrigger>
            <TabsTrigger value="pengaturan" className="flex flex-col items-center gap-1 py-2 px-2 text-xs">
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-gray-500">Ringkasan KBM hari ini</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {mounted ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : 'Loading...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Siswa</p>
                      <p className="text-xl font-bold">{dashboardData?.summary.totalSiswa || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <UserCog className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Guru</p>
                      <p className="text-xl font-bold">{dashboardData?.summary.totalGuru || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Kelas</p>
                      <p className="text-xl font-bold">{dashboardData?.summary.totalKelas || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Jadwal Hari Ini</p>
                      <p className="text-xl font-bold">{dashboardData?.summary.totalJadwalHariIni || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Guru Hadir</p>
                      <p className="text-xl font-bold">{dashboardData?.summary.guruHadir || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Guru Tidak Hadir</p>
                      <p className="text-xl font-bold">{dashboardData?.summary.guruTidakHadir || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Jadwal Hari Ini */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Jadwal KBM - {dashboardData?.hari}
                </CardTitle>
                <CardDescription>
                  {mounted ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id }) : 'Loading...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jam</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Guru</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData?.jadwalHariIni.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell className="text-xs">
                            {j.waktuMulai} - {j.waktuSelesai}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{j.kelas?.nama}</Badge>
                          </TableCell>
                          <TableCell>{j.guru?.nama} {j.guru?.gelar}</TableCell>
                          <TableCell>
                            {kehadiranGuruList[j.id] === 'TIDAK_HADIR' ? (
                              <Badge variant="destructive">Tidak Hadir</Badge>
                            ) : kehadiranGuruList[j.id] ? (
                              <Badge variant="default" className="bg-green-600">Hadir</Badge>
                            ) : (
                              <Badge variant="secondary">Belum Absen</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!dashboardData?.jadwalHariIni || dashboardData.jadwalHariIni.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500">
                            Tidak ada jadwal hari ini
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Ketidakhadiran Siswa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Ketidakhadiran Siswa Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Alfa</TableHead>
                      <TableHead className="text-center">Kabur</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.ketidakhadiranPerKelas.map((k) => (
                      <TableRow key={k.kelasId}>
                        <TableCell className="font-medium">{k.kelas}</TableCell>
                        <TableCell>
                          <Badge variant={k.shift === 'PAGI' ? 'default' : 'secondary'}>
                            {k.shift}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {k.sakit > 0 && <Badge variant="outline" className="bg-yellow-50">{k.sakit}</Badge>}
                          {k.sakit === 0 && '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {k.izin > 0 && <Badge variant="outline" className="bg-blue-50">{k.izin}</Badge>}
                          {k.izin === 0 && '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {k.alfa > 0 && <Badge variant="outline" className="bg-red-50">{k.alfa}</Badge>}
                          {k.alfa === 0 && '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {k.kabur > 0 && <Badge variant="outline" className="bg-orange-50">{k.kabur}</Badge>}
                          {k.kabur === 0 && '-'}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {k.sakit + k.izin + k.alfa + k.kabur}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!dashboardData?.ketidakhadiranPerKelas || dashboardData.ketidakhadiranPerKelas.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          Belum ada data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring KBM Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Monitoring KBM</h2>
                <p className="text-gray-500">Daftar Hadir Jam Tatap Muka PNS, GTY, GTT</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedHari} onValueChange={setSelectedHari}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI.slice(1).map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedShift || 'all'} onValueChange={(v) => setSelectedShift(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Shift</SelectItem>
                    <SelectItem value="PAGI">Pagi</SelectItem>
                    <SelectItem value="SIANG">Siang</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {mounted ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : 'Loading...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={saveKehadiranGuru} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan
                </Button>
                <Button variant="outline" onClick={exportMonitoringToXLSX} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export XLSX
                </Button>
                <Button variant="outline" onClick={printMonitoring} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>

            {/* Header Format like the image */}
            <Card>
              <CardHeader className="text-center border-b">
                <CardTitle className="text-lg">DAFTAR HADIR JAM TATAP MUKA PNS, GTY, GTT</CardTitle>
                <div className="space-y-1 text-sm">
                  <p className="font-bold">{pengaturan?.namaSekolah || 'MTs Da\'arul Ma\'arif Pasawahan'}</p>
                  <p>Tahun Pelajaran {pengaturan?.tahunAjaran || '2025/2026'} Semester {pengaturan?.semester || 'Genap'}</p>
                  <p>Hari: <strong>{selectedHari}</strong>, Tanggal: <strong>{mounted ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : ''}</strong></p>
                  <p>Shift: <strong>{selectedShift || 'Semua'}</strong></p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-auto">
                  <div className="overflow-x-auto">
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="border text-center w-12">No</TableHead>
                          <TableHead className="border text-center min-w-40">Nama Guru</TableHead>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(jam => (
                            <TableHead key={jam} className="border text-center w-16">Jam {jam}</TableHead>
                          ))}
                          <TableHead className="border text-center w-16">H</TableHead>
                          <TableHead className="border text-center w-16">TH</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getGuruMengajarHariIni().map((guru, idx) => {
                          const jadwalGuru = getJadwalByGuru(guru.id);
                          const totalHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] !== 'TIDAK_HADIR').length;
                          const totalTidakHadir = jadwalGuru.filter(j => kehadiranGuruList[j.id] === 'TIDAK_HADIR').length;
                          
                          return (
                            <TableRow key={guru.id} className="hover:bg-gray-50">
                              <TableCell className="border text-center">{idx + 1}</TableCell>
                              <TableCell className="border font-medium">{guru.nama} {guru.gelar}</TableCell>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(jam => {
                                const jadwal = jadwalGuru.find(j => j.jamKe === jam);
                                if (!jadwal) {
                                  return <TableCell key={jam} className="border text-center bg-gray-50 text-gray-400">-</TableCell>;
                                }
                                const tidakHadir = kehadiranGuruList[jadwal.id] === 'TIDAK_HADIR';
                                return (
                                  <TableCell 
                                    key={jam} 
                                    className={`border text-center cursor-pointer font-bold text-xs ${tidakHadir ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-700'}`}
                                    onClick={() => {
                                      setKehadiranGuruList(prev => ({
                                        ...prev,
                                        [jadwal.id]: prev[jadwal.id] === 'TIDAK_HADIR' ? 'HADIR' : 'TIDAK_HADIR'
                                      }));
                                    }}
                                    title={`${jadwal.mapel?.nama} - ${jadwal.kelas?.nama}`}
                                  >
                                    {jadwal.kelas?.nama}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="border text-center font-bold text-green-600">{totalHadir}</TableCell>
                              <TableCell className="border text-center font-bold text-red-600">{totalTidakHadir}</TableCell>
                            </TableRow>
                          );
                        })}
                        {getGuruMengajarHariIni().length === 0 && (
                          <TableRow>
                            <TableCell colSpan={14} className="border text-center text-gray-500 py-8">
                              Tidak ada jadwal mengajar pada hari {selectedHari}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Keterangan Guru Tidak Hadir */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Keterangan Guru Tidak Hadir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(kehadiranGuruList)
                    .filter(([_, status]) => status === 'TIDAK_HADIR')
                    .map(([jadwalId, _]) => {
                      const jadwal = jadwalList.find(j => j.id === jadwalId);
                      if (!jadwal) return null;
                      return (
                        <div key={jadwalId} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex-1">
                            <span className="font-medium">{jadwal.guru?.nama} {jadwal.guru?.gelar}</span>
                            <div className="text-sm text-gray-600">
                              Jam {jadwal.jamKe} | Kelas {jadwal.kelas?.nama}
                            </div>
                          </div>
                          <Input
                            placeholder="Alasan tidak hadir..."
                            className="w-64"
                            value={keteranganGuru[jadwalId] || ''}
                            onChange={(e) => setKeteranganGuru(prev => ({ ...prev, [jadwalId]: e.target.value }))}
                          />
                        </div>
                      );
                    })}
                  {Object.values(kehadiranGuruList).filter(s => s === 'TIDAK_HADIR').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>Semua guru hadir mengajar hari ini</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legenda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Keterangan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-6 bg-green-50 border rounded flex items-center justify-center font-bold text-green-700 text-xs">7A</div>
                    <span>Guru Hadir Mengajar di Kelas 7A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-6 bg-red-100 border rounded flex items-center justify-center font-bold text-red-600 text-xs">8B</div>
                    <span>Guru Tidak Hadir (Kelas 8B)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-6 bg-gray-50 border rounded flex items-center justify-center text-gray-400">-</div>
                    <span>Tidak Ada Jadwal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">H</span>
                    <span>= Total Hadir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">TH</span>
                    <span>= Total Tidak Hadir</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">* Klik pada sel kelas untuk menandai guru tidak hadir. Sel menampilkan nama kelas yang diajar.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Berita Acara Tab */}
          <TabsContent value="beritaacara" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Berita Acara</h2>
                <p className="text-gray-500">Input kehadiran siswa dan cetak berita acara</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportKehadiranSiswaToXLSX} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Kehadiran
                </Button>
                <Button onClick={printBeritaAcara} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print A4 Landscape
                </Button>
              </div>
            </div>

            {/* Jadwal Guru Berdasarkan Shift */}
            <div className="space-y-4">
              {/* Shift PAGI */}
              <Card>
                <CardHeader className="bg-amber-50 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Clock className="w-5 h-5" />
                      SHIFT PAGI
                    </CardTitle>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      06:30 - 12:00 WIB
                    </Badge>
                  </div>
                  <CardDescription>
                    Kelas 9A, 9B, 9C, 9D
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-72">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="border">Jam</TableHead>
                          <TableHead className="border">Guru</TableHead>
                          <TableHead className="border">Kelas</TableHead>
                          <TableHead className="border">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData?.jadwalHariIni
                          .filter((j) => j.kelas?.shift === 'PAGI')
                          .sort((a, b) => a.jamKe - b.jamKe)
                          .map((j) => (
                            <TableRow key={j.id}>
                              <TableCell className="border text-xs">{j.waktuMulai}-{j.waktuSelesai}</TableCell>
                              <TableCell className="border">{j.guru?.nama}</TableCell>
                              <TableCell className="border"><Badge variant="outline">{j.kelas?.nama}</Badge></TableCell>
                              <TableCell className="border">
                                {kehadiranGuruList[j.id] === 'TIDAK_HADIR' ? (
                                  <Badge variant="destructive">Tidak Hadir</Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-600">Hadir</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {dashboardData?.jadwalHariIni.filter((j) => j.kelas?.shift === 'PAGI').length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="border text-center text-gray-500 py-8">
                              Tidak ada jadwal shift pagi
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Shift SIANG */}
              <Card>
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Clock className="w-5 h-5" />
                      SHIFT SIANG
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      12:40 - 17:00 WIB
                    </Badge>
                  </div>
                  <CardDescription>
                    Kelas 7A, 7B, 7C, 7D, 8A, 8B, 8C, 8D
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-72">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="border">Jam</TableHead>
                          <TableHead className="border">Guru</TableHead>
                          <TableHead className="border">Kelas</TableHead>
                          <TableHead className="border">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData?.jadwalHariIni
                          .filter((j) => j.kelas?.shift === 'SIANG')
                          .sort((a, b) => a.jamKe - b.jamKe)
                          .map((j) => (
                            <TableRow key={j.id}>
                              <TableCell className="border text-xs">{j.waktuMulai}-{j.waktuSelesai}</TableCell>
                              <TableCell className="border">{j.guru?.nama}</TableCell>
                              <TableCell className="border"><Badge variant="outline">{j.kelas?.nama}</Badge></TableCell>
                              <TableCell className="border">
                                {kehadiranGuruList[j.id] === 'TIDAK_HADIR' ? (
                                  <Badge variant="destructive">Tidak Hadir</Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-600">Hadir</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {dashboardData?.jadwalHariIni.filter((j) => j.kelas?.shift === 'SIANG').length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="border text-center text-gray-500 py-8">
                              Tidak ada jadwal shift siang
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Guru Berhalangan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Guru Berhalangan Hadir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tidak Hadir Shift Pagi */}
                    <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                      <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Shift Pagi
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(kehadiranGuruList)
                          .filter(([jadwalId, status]) => {
                            const jadwal = dashboardData?.jadwalHariIni.find(j => j.id === jadwalId);
                            return status === 'TIDAK_HADIR' && jadwal?.kelas?.shift === 'PAGI';
                          })
                          .map(([jadwalId, _]) => {
                            const jadwal = dashboardData?.jadwalHariIni.find(j => j.id === jadwalId);
                            if (!jadwal) return null;
                            return (
                              <div key={jadwalId} className="p-2 border rounded bg-white border-amber-200">
                                <div className="font-medium text-sm">{jadwal.guru?.nama} {jadwal.guru?.gelar}</div>
                                <div className="text-xs text-gray-600">
                                  Kelas {jadwal.kelas?.nama} | Jam {jadwal.jamKe}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <strong>Alasan:</strong> {keteranganGuru[jadwalId] || '-'}
                                </div>
                              </div>
                            );
                          })}
                        {Object.entries(kehadiranGuruList).filter(([jadwalId, status]) => {
                          const jadwal = dashboardData?.jadwalHariIni.find(j => j.id === jadwalId);
                          return status === 'TIDAK_HADIR' && jadwal?.kelas?.shift === 'PAGI';
                        }).length === 0 && (
                          <div className="text-center text-gray-500 py-4 text-sm">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-green-500" />
                            <p>Semua guru hadir</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tidak Hadir Shift Siang */}
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Shift Siang
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(kehadiranGuruList)
                          .filter(([jadwalId, status]) => {
                            const jadwal = dashboardData?.jadwalHariIni.find(j => j.id === jadwalId);
                            return status === 'TIDAK_HADIR' && jadwal?.kelas?.shift === 'SIANG';
                          })
                          .map(([jadwalId, _]) => {
                            const jadwal = dashboardData?.jadwalHariIni.find(j => j.id === jadwalId);
                            if (!jadwal) return null;
                            return (
                              <div key={jadwalId} className="p-2 border rounded bg-white border-blue-200">
                                <div className="font-medium text-sm">{jadwal.guru?.nama} {jadwal.guru?.gelar}</div>
                                <div className="text-xs text-gray-600">
                                  Kelas {jadwal.kelas?.nama} | Jam {jadwal.jamKe}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <strong>Alasan:</strong> {keteranganGuru[jadwalId] || '-'}
                                </div>
                              </div>
                            );
                          })}
                        {Object.entries(kehadiranGuruList).filter(([jadwalId, status]) => {
                          const jadwal = dashboardData?.jadwalHariIni.find(j => j.id === jadwalId);
                          return status === 'TIDAK_HADIR' && jadwal?.kelas?.shift === 'SIANG';
                        }).length === 0 && (
                          <div className="text-center text-gray-500 py-4 text-sm">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-green-500" />
                            <p>Semua guru hadir</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Input Ketidakhadiran Siswa */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Input Ketidakhadiran Siswa</CardTitle>
                    <CardDescription>Pilih kelas dan input ketidakhadiran siswa</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Cari nama siswa..."
                        className="pl-10 w-56"
                        value={searchSiswa}
                        onChange={(e) => setSearchSiswa(e.target.value)}
                      />
                    </div>
                    <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Pilih Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {kelasList.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.nama} ({k.shift})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={saveKehadiranSiswa} className="gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Simpan
                    </Button>
                  </div>
                </div>
                {/* Bulk Actions */}
                {selectedSiswaIds.size > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedSiswaIds.size} siswa dipilih
                      </span>
                      <div className="flex gap-1">
                        {STATUS_SISWA.map((status) => (
                          <Button
                            key={status.value}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => bulkSetStatusSiswa(status.value)}
                          >
                            Set {status.label}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSiswaIds(new Set())}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={(() => {
                              const filteredSiswa = siswaList.filter(s => {
                                const matchSearch = s.nama.toLowerCase().includes(searchSiswa.toLowerCase());
                                const matchKelas = selectedKelas && selectedKelas !== 'all' ? s.kelasId === selectedKelas : true;
                                return matchSearch && matchKelas;
                              });
                              return filteredSiswa.length > 0 && selectedSiswaIds.size === filteredSiswa.length;
                            })()}
                            onCheckedChange={() => {
                              const filteredSiswa = siswaList.filter(s => {
                                const matchSearch = s.nama.toLowerCase().includes(searchSiswa.toLowerCase());
                                const matchKelas = selectedKelas && selectedKelas !== 'all' ? s.kelasId === selectedKelas : true;
                                return matchSearch && matchKelas;
                              });
                              toggleSelectAllSiswa(filteredSiswa);
                            }}
                          />
                        </TableHead>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {siswaList
                        .filter(s => {
                          const matchSearch = s.nama.toLowerCase().includes(searchSiswa.toLowerCase());
                          const matchKelas = selectedKelas && selectedKelas !== 'all' ? s.kelasId === selectedKelas : true;
                          return matchSearch && matchKelas;
                        })
                        .map((siswa, idx) => (
                          <TableRow key={siswa.id} className={selectedSiswaIds.has(siswa.id) ? 'bg-blue-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={selectedSiswaIds.has(siswa.id)}
                                onCheckedChange={() => toggleSiswaSelection(siswa.id)}
                              />
                            </TableCell>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{siswa.nama}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {siswa.kelas?.nama || kelasList.find(k => k.id === siswa.kelasId)?.nama || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {STATUS_SISWA.map((status) => (
                                  <Button
                                    key={status.value}
                                    variant={kehadiranSiswaList[siswa.id] === status.value ? 'default' : 'outline'}
                                    size="sm"
                                    className={`text-xs px-2 ${kehadiranSiswaList[siswa.id] === status.value ? status.color + ' text-white' : ''}`}
                                    onClick={() => setKehadiranSiswaList(prev => ({
                                      ...prev,
                                      [siswa.id]: status.value
                                    }))}
                                  >
                                    {status.label}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Keterangan..."
                                className="w-40"
                                value={keteranganSiswa[siswa.id] || ''}
                                onChange={(e) => setKeteranganSiswa(prev => ({
                                  ...prev,
                                  [siswa.id]: e.target.value
                                }))}
                                disabled={kehadiranSiswaList[siswa.id] === 'HADIR'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      {siswaList.filter(s => {
                        const matchSearch = s.nama.toLowerCase().includes(searchSiswa.toLowerCase());
                        const matchKelas = selectedKelas && selectedKelas !== 'all' ? s.kelasId === selectedKelas : true;
                        return matchSearch && matchKelas;
                      }).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            <Users className="w-12 h-12 mx-auto mb-2" />
                            <p>{searchSiswa ? 'Siswa tidak ditemukan' : 'Pilih kelas atau ketik nama siswa untuk mencari'}</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Laporan Bulanan Tab */}
          <TabsContent value="laporan" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Laporan Bulanan</h2>
                <p className="text-gray-500">Rekap kehadiran guru dan siswa</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(laporanBulan)} onValueChange={(v) => setLaporanBulan(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BULAN.map((b, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(laporanTahun)} onValueChange={(v) => setLaporanTahun(Number(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={laporanTipe} onValueChange={(v) => setLaporanTipe(v as 'guru' | 'siswa')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guru">Kehadiran Guru</SelectItem>
                    <SelectItem value="siswa">Kehadiran Siswa</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchLaporan} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Tampilkan
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Rekap {laporanTipe === 'guru' ? 'Kehadiran Guru' : 'Kehadiran Siswa'} - {BULAN[laporanBulan - 1]} {laporanTahun}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {laporanTipe === 'guru' ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama Guru</TableHead>
                          <TableHead className="text-center">Total Jam</TableHead>
                          <TableHead className="text-center">Hadir</TableHead>
                          <TableHead className="text-center">Tidak Hadir</TableHead>
                          <TableHead className="text-center">Persentase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(laporanData as Array<{ guru: Guru; totalJam: number; hadir: number; tidakHadir: number; persentase: string }>).map((item, idx) => (
                          <TableRow key={item.guru?.id || idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{item.guru?.kode}</TableCell>
                            <TableCell>{item.guru?.nama} {item.guru?.gelar}</TableCell>
                            <TableCell className="text-center">{item.totalJam}</TableCell>
                            <TableCell className="text-center text-green-600 font-medium">{item.hadir}</TableCell>
                            <TableCell className="text-center text-red-600 font-medium">{item.tidakHadir}</TableCell>
                            <TableCell className="text-center font-bold">{item.persentase}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead className="text-center">Hadir</TableHead>
                          <TableHead className="text-center">Sakit</TableHead>
                          <TableHead className="text-center">Izin</TableHead>
                          <TableHead className="text-center">Alfa</TableHead>
                          <TableHead className="text-center">Kabur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(laporanData as Array<{ siswa: Siswa; kelas: Kelas; hadir: number; sakit: number; izin: number; alfa: number; kabur: number }>).map((item, idx) => (
                          <TableRow key={item.siswa?.id || idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{item.siswa?.nama}</TableCell>
                            <TableCell><Badge variant="outline">{item.kelas?.nama}</Badge></TableCell>
                            <TableCell className="text-center text-green-600">{item.hadir}</TableCell>
                            <TableCell className="text-center text-yellow-600">{item.sakit}</TableCell>
                            <TableCell className="text-center text-blue-600">{item.izin}</TableCell>
                            <TableCell className="text-center text-red-600">{item.alfa}</TableCell>
                            <TableCell className="text-center text-orange-600">{item.kabur}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guru & Mapel Tab */}
          <TabsContent value="guru" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Kelola Jadwal Pelajaran</h2>
                <p className="text-gray-500">Atur jadwal mengajar guru per shift dan hari</p>
              </div>
            </div>

            {/* Daftar Guru & Mapel - Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Daftar Guru */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Daftar Guru</CardTitle>
                    <Dialog open={editGuruOpen} onOpenChange={(open) => {
                      setEditGuruOpen(open);
                      if (!open) {
                        setGuruForm({ kode: '', nama: '', gelar: '' });
                        setEditItem(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 px-2">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editItem ? 'Edit Guru' : 'Tambah Guru Baru'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Kode Guru</Label>
                            <Input
                              value={guruForm.kode}
                              onChange={(e) => setGuruForm({ ...guruForm, kode: e.target.value })}
                              placeholder="Contoh: A"
                            />
                          </div>
                          <div>
                            <Label>Nama Guru</Label>
                            <Input
                              value={guruForm.nama}
                              onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
                              placeholder="Nama lengkap"
                            />
                          </div>
                          <div>
                            <Label>Gelar</Label>
                            <Input
                              value={guruForm.gelar}
                              onChange={(e) => setGuruForm({ ...guruForm, gelar: e.target.value })}
                              placeholder="S.Pd, M.Pd, dll"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => saveGuru(!!editItem)}>
                            {editItem ? 'Update' : 'Simpan'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Label className="flex items-center gap-1 cursor-pointer bg-primary text-primary-foreground px-2 py-1 rounded text-xs hover:bg-primary/90 transition-colors">
                      <Upload className="w-3 h-3" />
                      Import
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleUploadGuru}
                      />
                    </Label>
                    <Button variant="outline" size="sm" onClick={exportGuruToXLSX} className="h-6 px-2 text-xs gap-1">
                      <Download className="w-3 h-3" />
                      Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={downloadTemplateGuru} className="h-6 px-2 text-xs gap-1">
                      <FileSpreadsheet className="w-3 h-3" />
                      Template
                    </Button>
                    {selectedGuruIds.size > 0 && (
                      <>
                        <Badge variant="destructive" className="text-xs">
                          {selectedGuruIds.size} dipilih
                        </Badge>
                        <Button variant="destructive" size="sm" onClick={bulkDeleteGuru} className="h-6 px-2 text-xs gap-1">
                          <Trash2 className="w-3 h-3" />
                          Hapus
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedGuruIds(new Set())} className="h-6 px-2 text-xs">
                          Batal
                        </Button>
                      </>
                    )}
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {/* Select All */}
                      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded text-xs font-medium">
                        <Checkbox
                          checked={guruList.length > 0 && selectedGuruIds.size === guruList.length}
                          onCheckedChange={toggleSelectAllGuru}
                        />
                        <span>Pilih Semua ({guruList.length} guru)</span>
                      </div>
                      {guruList.map((guru) => (
                        <div key={guru.id} className={`flex items-center justify-between p-1.5 border rounded text-sm ${selectedGuruIds.has(guru.id) ? 'bg-red-50 border-red-200' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedGuruIds.has(guru.id)}
                              onCheckedChange={() => toggleGuruSelection(guru.id)}
                            />
                            <div>
                              <span className="font-medium">{guru.nama}</span>
                              {guru.gelar && <span className="text-xs text-gray-500">, {guru.gelar}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditItem(guru);
                                setGuruForm({ kode: guru.kode, nama: guru.nama, gelar: guru.gelar || '' });
                                setEditGuruOpen(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteGuru(guru.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Tambah Guru ke Jadwal */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Tambah Baris Guru</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-3">
                    <Select onValueChange={(guruId) => {
                      if (guruId && !jadwalMatrix[guruId]) {
                        addGuruToMatrix(guruId);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih guru..." />
                      </SelectTrigger>
                      <SelectContent>
                        {guruList
                          .filter(g => !jadwalMatrix[g.id])
                          .map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.nama} {g.gelar}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Pilih guru untuk menambahkan baris baru ke jadwal
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Jadwal Matrix */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Input Jadwal Mengajar</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Hari:</Label>
                      <Select value={selectedHari} onValueChange={setSelectedHari}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HARI.slice(1).map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Shift:</Label>
                      <Select value={selectedShiftJadwal} onValueChange={setSelectedShiftJadwal}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAGI">Pagi</SelectItem>
                          <SelectItem value="SIANG">Siang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={saveJadwalMatrix} disabled={loading} className="gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Simpan Jadwal
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {selectedShiftJadwal === 'PAGI' ? 'Jam: 06:30 - 12:00 WIB (Kelas 9A-9D)' : 'Jam: 12:40 - 17:00 WIB (Kelas 7A-7D, 8A-8D)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-auto">
                  <div className="overflow-x-auto">
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="border text-center w-12 sticky left-0 bg-gray-100">No</TableHead>
                          <TableHead className="border min-w-48 sticky left-12 bg-gray-100">Nama Guru</TableHead>
                          <TableHead className="border text-center w-20">Jam 1</TableHead>
                          <TableHead className="border text-center w-20">Jam 2</TableHead>
                          <TableHead className="border text-center w-20">Jam 3</TableHead>
                          <TableHead className="border text-center w-20">Jam 4</TableHead>
                          <TableHead className="border text-center w-20">Jam 5</TableHead>
                          <TableHead className="border text-center w-20">Jam 6</TableHead>
                          <TableHead className="border text-center w-20">Jam 7</TableHead>
                          <TableHead className="border text-center w-20">Jam 8</TableHead>
                          <TableHead className="border text-center w-20">Jam 9</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(jadwalMatrix).length > 0 ? (
                          Object.entries(jadwalMatrix).map(([guruId, jams], idx) => {
                            const guru = guruList.find(g => g.id === guruId);
                            if (!guru) return null;
                            
                            // Filter kelas by selected shift
                            const kelasOptions = kelasList.filter(k => k.shift === selectedShiftJadwal);
                            
                            return (
                              <TableRow key={guruId} className="hover:bg-gray-50">
                                <TableCell className="border text-center sticky left-0 bg-white">{idx + 1}</TableCell>
                                <TableCell className="border font-medium sticky left-12 bg-white">
                                  {guru.nama} {guru.gelar}
                                </TableCell>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(jam => (
                                  <TableCell key={jam} className="border p-1">
                                    <Select
                                      value={jams[jam] || 'kosong'}
                                      onValueChange={(kelasId) => updateJadwalCell(guruId, jam, kelasId)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="-" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="kosong">- (Kosong)</SelectItem>
                                        {kelasOptions.map((k) => (
                                          <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={11} className="border text-center text-gray-500 py-8">
                              Belum ada guru di jadwal. Tambahkan guru dari panel di atas.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Jadwal Tersimpan */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle>Jadwal Tersimpan</CardTitle>
                <CardDescription>
                  Daftar jadwal yang sudah tersimpan untuk filter ini
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border">No</TableHead>
                        <TableHead className="border">Guru</TableHead>
                        <TableHead className="border">Jam Ke</TableHead>
                        <TableHead className="border">Kelas</TableHead>
                        <TableHead className="border">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jadwalList
                        .filter(j => j.hari === selectedHari && j.kelas?.shift === selectedShiftJadwal)
                        .sort((a, b) => {
                          if (a.guru?.nama && b.guru?.nama) {
                            return a.guru.nama.localeCompare(b.guru.nama);
                          }
                          return a.jamKe - b.jamKe;
                        })
                        .map((jadwal, idx) => (
                          <TableRow key={jadwal.id}>
                            <TableCell className="border">{idx + 1}</TableCell>
                            <TableCell className="border">{jadwal.guru?.nama}</TableCell>
                            <TableCell className="border text-center">Jam {jadwal.jamKe}</TableCell>
                            <TableCell className="border">
                              <Badge variant="outline">{jadwal.kelas?.nama}</Badge>
                            </TableCell>
                            <TableCell className="border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => deleteJadwal(jadwal.id)}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {jadwalList.filter(j => j.hari === selectedHari && j.kelas?.shift === selectedShiftJadwal).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="border text-center text-gray-500 py-4">
                            Belum ada jadwal tersimpan untuk filter ini
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Siswa & Kelas Tab */}
          <TabsContent value="siswa" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Siswa & Kelas</h2>
                <p className="text-gray-500">Kelola data siswa dan kelas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Daftar Kelas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Daftar Kelas</CardTitle>
                    <Dialog open={editKelasOpen} onOpenChange={(open) => {
                      setEditKelasOpen(open);
                      if (!open) {
                        setKelasForm({ nama: '', tingkat: 7, shift: 'PAGI' });
                        setEditItem(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                          <Plus className="w-4 h-4" />
                          Tambah
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editItem ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Nama Kelas</Label>
                            <Input
                              value={kelasForm.nama}
                              onChange={(e) => setKelasForm({ ...kelasForm, nama: e.target.value })}
                              placeholder="Contoh: 7A"
                            />
                          </div>
                          <div>
                            <Label>Tingkat</Label>
                            <Select value={String(kelasForm.tingkat)} onValueChange={(v) => setKelasForm({ ...kelasForm, tingkat: Number(v) })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7">Kelas 7</SelectItem>
                                <SelectItem value="8">Kelas 8</SelectItem>
                                <SelectItem value="9">Kelas 9</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Shift</Label>
                            <Select value={kelasForm.shift} onValueChange={(v) => setKelasForm({ ...kelasForm, shift: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PAGI">Pagi</SelectItem>
                                <SelectItem value="SIANG">Siang</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => saveKelas(!!editItem)}>
                            {editItem ? 'Update' : 'Simpan'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {kelasList.map((kelas) => (
                        <div key={kelas.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div>
                            <div className="font-medium">{kelas.nama}</div>
                            <div className="text-xs text-gray-500">
                              {kelas.shift} - {kelas._count?.siswa || 0} siswa
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditItem(kelas);
                                setKelasForm({
                                  nama: kelas.nama,
                                  tingkat: kelas.tingkat,
                                  shift: kelas.shift,
                                });
                                setEditKelasOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteKelas(kelas.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Daftar Siswa */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Daftar Siswa</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={selectedKelas || 'all'} onValueChange={(v) => {
                        const newValue = v === 'all' ? '' : v;
                        setSelectedKelas(newValue);
                        fetchSiswa(newValue);
                      }}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Semua Kelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kelas</SelectItem>
                          {kelasList.map((k) => (
                            <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={editSiswaOpen} onOpenChange={(open) => {
                        setEditSiswaOpen(open);
                        if (!open) {
                          setSiswaForm({ nama: '', kelasId: '' });
                          setEditItem(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1">
                            <Plus className="w-4 h-4" />
                            Tambah
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editItem ? 'Edit Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Nama Siswa</Label>
                              <Input
                                value={siswaForm.nama}
                                onChange={(e) => setSiswaForm({ ...siswaForm, nama: e.target.value })}
                                placeholder="Nama lengkap"
                              />
                            </div>
                            <div>
                              <Label>Kelas</Label>
                              <Select value={siswaForm.kelasId} onValueChange={(v) => setSiswaForm({ ...siswaForm, kelasId: v })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                  {kelasList.map((k) => (
                                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => saveSiswa(!!editItem)}>
                              {editItem ? 'Update' : 'Simpan'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4" />
                        Import XLSX
                        <Input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={handleUploadSiswa}
                        />
                      </Label>
                      <Button variant="outline" size="sm" onClick={downloadTemplateSiswa} className="gap-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        Template
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={exportSiswaToXLSX} className="gap-1">
                        <Download className="w-4 h-4" />
                        Export XLSX
                      </Button>
                    </div>
                    {selectedSiswaIds.size > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="gap-1">
                          {selectedSiswaIds.size} dipilih
                        </Badge>
                        <Button variant="destructive" size="sm" onClick={bulkDeleteSiswa} className="gap-1">
                          <Trash2 className="w-4 h-4" />
                          Hapus Terpilih
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSiswaIds(new Set())}>
                          Batal
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Format: Kolom A = Nama, Kolom B = Kelas</p>
                  </div>
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={siswaList.length > 0 && selectedSiswaIds.size === siswaList.length}
                              onCheckedChange={() => toggleSelectAllSiswa(siswaList)}
                            />
                          </TableHead>
                          <TableHead>No</TableHead>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {siswaList.map((siswa, idx) => (
                          <TableRow key={siswa.id} className={selectedSiswaIds.has(siswa.id) ? 'bg-red-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={selectedSiswaIds.has(siswa.id)}
                                onCheckedChange={() => toggleSiswaSelection(siswa.id)}
                              />
                            </TableCell>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{siswa.nama}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{siswa.kelas?.nama}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditItem(siswa);
                                    setSiswaForm({ nama: siswa.nama, kelasId: siswa.kelasId });
                                    setEditSiswaOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteSiswa(siswa.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pengaturan Tab */}
          <TabsContent value="pengaturan" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Pengaturan</h2>
                <p className="text-gray-500">Konfigurasi identitas sekolah dan periode aktif</p>
              </div>
              <Button onClick={savePengaturan} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Simpan Pengaturan
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Identitas Sekolah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Sekolah</Label>
                    <Input
                      value={pengaturanForm.namaSekolah}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, namaSekolah: e.target.value })}
                      placeholder="Nama sekolah"
                    />
                  </div>
                  <div>
                    <Label>Kepala Sekolah</Label>
                    <Input
                      value={pengaturanForm.kepalaSekolah}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, kepalaSekolah: e.target.value })}
                      placeholder="Nama kepala sekolah"
                    />
                  </div>
                  <div>
                    <Label>Alamat Sekolah</Label>
                    <Input
                      value={pengaturanForm.alamatSekolah}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, alamatSekolah: e.target.value })}
                      placeholder="Alamat lengkap"
                    />
                  </div>
                  <div>
                    <Label>Telepon</Label>
                    <Input
                      value={pengaturanForm.telepon}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, telepon: e.target.value })}
                      placeholder="Nomor telepon"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={pengaturanForm.email}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, email: e.target.value })}
                      placeholder="Email sekolah"
                    />
                  </div>
                  <div></div>
                  <div>
                    <Label>Semester Aktif</Label>
                    <Select value={pengaturanForm.semester} onValueChange={(v) => setPengaturanForm({ ...pengaturanForm, semester: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ganjil">Ganjil</SelectItem>
                        <SelectItem value="Genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tahun Ajaran</Label>
                    <Input
                      value={pengaturanForm.tahunAjaran}
                      onChange={(e) => setPengaturanForm({ ...pengaturanForm, tahunAjaran: e.target.value })}
                      placeholder="Contoh: 2025/2026"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Aplikasi Guru Piket - {pengaturan?.namaSekolah || 'MTs Da\'arul Ma\'arif Pasawahan'}</p>
        </div>
      </footer>
    </div>
  );
}
