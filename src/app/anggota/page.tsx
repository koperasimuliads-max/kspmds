'use client';

import { useState, useEffect } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Anggota } from '@/types';
import * as XLSX from 'xlsx';
import BackButton from '@/components/BackButton';

const parseDate = (dateStr: any): string => {
  if (!dateStr && dateStr !== 0) return '';
  if (typeof dateStr === 'number') {
    const date = new Date((dateStr - 25569) * 86400 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof dateStr !== 'string') return String(dateStr);
  const trimmed = dateStr.trim();
  if (!trimmed) return '';
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) return trimmed;
  if (trimmed.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = trimmed.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  if (trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const parts = trimmed.split('/');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  if (trimmed.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
    const parts = trimmed.split('/');
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }
  return trimmed;
};

const statusPerkawinanOptions = [
  { value: 'belum_kawin', label: 'Belum Kawin' },
  { value: 'kawin', label: 'Kawin' },
  { value: 'cerai', label: 'Cerai' },
  { value: 'janda', label: 'Janda' },
  { value: 'duda', label: 'Duda' },
];

const statusRumahOptions = [
  { value: 'rumah_sendiri', label: 'Rumah sendiri' },
  { value: 'kontrak_sewa', label: 'Kontrak/sewa' },
  { value: 'dinas', label: 'Dinas' },
  { value: 'rumah_orang_tua', label: 'Rumah orang tua' },
  { value: 'menumpang', label: 'Menumpang' },
];

const jenisPembayaranOptions = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'bri_tigabinanga', label: 'BRI Cab. Tigabinanga' },
  { value: 'bri_berastagi', label: 'BRI Cab. Berastagi' },
];

const agamaOptions = ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Budha', 'Konghucu', 'Lainnya'];

const jumlahAnakOptions = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5+' },
];

const pekerjaanOptions = [
  { value: 'belum_bekerja', label: 'Belum/Tidak Bekerja' },
  { value: 'mengurus_rumah_tangga', label: 'Mengurus Rumah Tangga' },
  { value: 'pelajar_mahasiswa', label: 'Pelajar/Mahasiswa' },
  { value: 'pensiunan', label: 'Pensiunan' },
  { value: 'asn', label: 'Aparatur Sipil Negara (ASN)' },
  { value: 'tni', label: 'Tentara Nasional Indonesia (TNI)' },
  { value: 'polri', label: 'Polri' },
  { value: 'karyawan_swasta', label: 'Karyawan Swasta' },
  { value: 'karyawan_bumn', label: 'Karyawan BUMN / BUMD' },
  { value: 'karyawan_honorer', label: 'Karyawan Honorer' },
  { value: 'wiraswasta', label: 'Wiraswasta' },
  { value: 'pedagang', label: 'Pedagang' },
  { value: 'petani_pekebun', label: 'Petani / Pekebun' },
  { value: 'peternak', label: 'Peternak' },
  { value: 'nelayan', label: 'Nelayan' },
  { value: 'buruh_harian', label: 'Buruh Harian Lepas' },
  { value: 'sopir', label: 'Sopir' },
  { value: 'tukang_cukur', label: 'Tukang Cukur' },
  { value: 'tukang_listrik', label: 'Tukang Listrik' },
  { value: 'tukang_kayu', label: 'Tukang Kayu' },
  { value: 'dokter', label: 'Dokter' },
  { value: 'perawat', label: 'Perawat' },
  { value: 'apoteker', label: 'Apoteker' },
  { value: 'guru', label: 'Guru' },
  { value: 'dosen', label: 'Dosen' },
  { value: 'wartawan', label: 'Wartawan' },
  { value: 'seniman', label: 'Seniman' },
  { value: 'artis', label: 'Artis' },
  { value: 'ustadz', label: 'Ustadz / Mubaligh' },
  { value: 'pendeta', label: 'Pendeta' },
  { value: 'imam_masjid', label: 'Imam Masjid' },
  { value: 'biarawati', label: 'Biarawati / Biarawan' },
  { value: 'bhikkhu', label: 'Bhikkhu' },
  { value: 'uskup', label: 'Uskup' },
  { value: 'pandita', label: 'Pandita / Pinandita' },
  { value: 'xueshi', label: 'Xueshi' },
  { value: 'wenshi', label: 'Wenshi' },
  { value: 'jiaosheng', label: 'Jiaosheng' },
  { value: 'lainnya', label: 'Lainnya' },
];

const pendapatanOptions = [
  { value: 'kurang_2jt', label: 'Kurang dari Rp 2.000.000' },
  { value: '2jt_5jt', label: 'Rp 2.000.000 s/d Rp 4.999.999' },
  { value: '5jt_10jt', label: 'Rp 5.000.000 s/d Rp 9.999.999' },
  { value: '10jt_20jt', label: 'Rp 10.000.000 s/d Rp 19.999.999' },
  { value: '20jt_keatas', label: 'Rp 20.000.000 ke atas' },
];

const referensiOptions = [
  { value: 'Samudera Ginting, S.H', label: 'Samudera Ginting, S.H' },
  { value: 'Ahmad Dahlan Surbakti, A.md', label: 'Ahmad Dahlan Surbakti, A.md' },
  { value: 'Carolla Sembiring, S.H., M.Kn', label: 'Carolla Sembiring, S.H., M.Kn' },
  { value: 'Mika Jepani Karosekali, S.Kep Ners', label: 'Mika Jepani Karosekali, S.Kep Ners' },
  { value: 'Juniawan Sebayang, S.P, CHT', label: 'Juniawan Sebayang, S.P, CHT' },
  { value: 'Dustin Farrel Sembiring Pandia', label: 'Dustin Farrel Sembiring Pandia' },
  { value: 'Sayang David Ginting, S.H., S.Pn', label: 'Sayang David Ginting, S.H., S.Pn' },
  { value: 'Sahala Panjaitan, S.P', label: 'Sahala Panjaitan, S.P' },
  { value: 'Marwan Esra Bangun', label: 'Marwan Esra Bangun' },
  { value: 'Ezzra Mazmur Sembiring', label: 'Ezzra Mazmur Sembiring' },
  { value: 'Erni Sembiring', label: 'Erni Sembiring' },
];

export default function AnggotaPage() {
  const { anggota, addAnggota, updateAnggota, deleteAnggota, clearAllAnggota, bulkUpdateTanggalJoin, pinjamans, simpanans, updateSimpanan, addPendapatan, isHydrated } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showTanggalForm, setShowTanggalForm] = useState(false);
  const [tanggalForm, setTanggalForm] = useState({ startNBA: 1, endNBA: 25, tanggal: '2023-11-09' });
  const [filterStatus, setFilterStatus] = useState<'all' | 'aktif' | 'nonaktif'>('all');
  const [filterJenisKelamin, setFilterJenisKelamin] = useState<'all' | 'L' | 'P'>('all');
  const [filterPekerjaan, setFilterPekerjaan] = useState('all');
  const [filterTanggalFrom, setFilterTanggalFrom] = useState('');
  const [filterTanggalTo, setFilterTanggalTo] = useState('');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkFromPekerjaan, setBulkFromPekerjaan] = useState('');
  const [bulkToPekerjaan, setBulkToPekerjaan] = useState('');
  
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  
  const getLabel = (options: {value: string, label: string}[], value: string) => options.find(o => o.value === value)?.label || value;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [viewMode, setViewMode] = useState<'data' | 'tambah'>('data');
  
  const filteredAnggota = anggota.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterJenisKelamin !== 'all' && a.jenisKelamin !== filterJenisKelamin) return false;
    if (filterPekerjaan !== 'all' && a.pekerjaan !== filterPekerjaan) return false;
    if (filterTanggalFrom && a.tanggalJoin) {
      if (new Date(a.tanggalJoin) < new Date(filterTanggalFrom)) return false;
    }
    if (filterTanggalTo && a.tanggalJoin) {
      if (new Date(a.tanggalJoin) > new Date(filterTanggalTo)) return false;
    }
    return true;
  });
  
  const displayAnggota = searchQuery.trim() 
    ? filteredAnggota.filter(a => {
        const query = searchQuery.toLowerCase();
        const namaMatch = a.nama?.toLowerCase().includes(query);
        const nbaMatch = a.nomorNBA?.toLowerCase().includes(query);
        return namaMatch || nbaMatch;
      })
    : filteredAnggota;
    
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-dropdown')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    nomorNBA: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: '',
    tanggalLahir: '',
    agama: '',
    alamat: '',
    alamatDomisili: '',
    statusPerkawinan: 'belum_kawin' as 'belum_kawin' | 'kawin' | 'cerai' | 'janda' | 'duda',
    namaPasangan: '',
    jumlahAnak: '0',
    namaIbuKandung: '',
    namaSaudara: '',
    noHpSaudara: '',
    pekerjaan: '',
    pendapatanPerbulan: '',
    statusRumah: 'rumah_sendiri' as 'rumah_sendiri' | 'kontrak_sewa' | 'dinas' | 'rumah_orang_tua' | 'menumpang',
    namaReferensi: '',
    simpananPokok: 0,
    simpananWajib: 0,
    uangBuku: 0,
    jenisPembayaran: 'tunai' as 'tunai' | 'bri_tigabinanga' | 'bri_berastagi',
    telefon: '',
    tanggalJoin: '2024-01-01',
    status: 'aktif' as 'aktif' | 'nonaktif',
  });

  const [alamatSamaKTP, setAlamatSamaKTP] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      alamatDomisili: alamatSamaKTP ? formData.alamat : formData.alamatDomisili,
      simpananPokok: 100000,
      simpananWajib: 25000,
      uangBuku: 25000,
    };
    if (editingId) {
      updateAnggota(editingId, dataToSubmit);
      setEditingId(null);
    } else {
      addAnggota(dataToSubmit);
    }
    resetForm();
  };

  const handleEdit = (data: Anggota) => {
    setFormData({
      nama: data.nama,
      nik: data.nik,
      nomorNBA: data.nomorNBA || '',
      jenisKelamin: data.jenisKelamin || 'L',
      tempatLahir: data.tempatLahir || '',
      tanggalLahir: data.tanggalLahir || '',
      agama: data.agama || '',
      alamat: data.alamat || '',
      alamatDomisili: data.alamatDomisili || '',
      statusPerkawinan: data.statusPerkawinan || 'belum_kawin',
      namaPasangan: data.namaPasangan || '',
      jumlahAnak: data.jumlahAnak || '0',
      namaIbuKandung: data.namaIbuKandung || '',
      namaSaudara: data.namaSaudara || '',
      noHpSaudara: data.noHpSaudara || '',
      pekerjaan: data.pekerjaan || '',
      pendapatanPerbulan: data.pendapatanPerbulan || '',
      statusRumah: data.statusRumah || 'milik_sendiri',
      namaReferensi: data.namaReferensi || '',
      simpananPokok: data.simpananPokok || 0,
      simpananWajib: data.simpananWajib || 0,
      uangBuku: data.uangBuku || 0,
      jenisPembayaran: data.jenisPembayaran || 'tunai',
      telefon: data.telefon,
      tanggalJoin: data.tanggalJoin,
      status: data.status,
    });
    setAlamatSamaKTP(data.alamat === data.alamatDomisili);
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus anggota ini? Semua data pinjaman dan simpanan juga akan dihapus.')) {
      deleteAnggota(id);
    }
  };

  const handleKeluar = (id: string) => {
    const ag = anggota.find(a => a.id === id);
    if (!ag) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Cek pinjaman aktif
    const pinjamanAktif = pinjamans.filter(p => p.anggotaId === id && p.status === 'aktif');
    const totalPinjamanAktif = pinjamanAktif.reduce((sum, p) => sum + p.jumlah, 0);
    const totalDibayar = pinjamanAktif.reduce((sum, p) => sum + (p.sudahDibayar || 0), 0);
    const sisaPinjaman = totalPinjamanAktif - totalDibayar;
    
    // Get simpanan aktif untuk anggota ini
    const simpananAktif = simpanans.filter(s => s.anggotaId === id && s.status === 'aktif');
    const simpananPokok = simpananAktif.filter(s => s.jenis === 'pokok').reduce((sum, s) => sum + s.jumlah, 0);
    const simpananWajib = simpananAktif.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
    const simpananLain = simpananAktif.filter(s => s.jenis !== 'pokok' && s.jenis !== 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
    const totalSimpanan = simpananPokok + simpananWajib + simpananLain;
    
    const BIAYA_ADMINISTRASI = 50000;
    
    let message = `Yakin anggota "${ag.nama}" keluar/mengundurkan diri?\n\n`;
    message += `📋 RINGKASAN ANGGOTA:\n`;
    message += `- Tanggal Masuk: ${ag.tanggalJoin ? new Date(ag.tanggalJoin).toLocaleDateString('id-ID') : '-'}\n`;
    message += `- Status: ${ag.status}\n\n`;
    
    if (pinjamanAktif.length > 0) {
      message += `⚠️ PINJAMAN AKTIF (${pinjamanAktif.length} akun):\n`;
      message += `- Total Pinjaman: Rp ${totalPinjamanAktif.toLocaleString('id-ID')}\n`;
      message += `- Sudah Dibayar: Rp ${totalDibayar.toLocaleString('id-ID')}\n`;
      message += `- Sisa Pinjaman: Rp ${sisaPinjaman.toLocaleString('id-ID')}\n`;
      message += `⚠️ PINJAMAN HARUS LUNAS TERLEBIH DAHULU!\n\n`;
    } else {
      message += `✅ Tidak ada pinjaman aktif\n\n`;
    }
    
    message += `💰 SIMPANAN YANG DIKEMBALIKAN:\n`;
    message += `- Simpanan Pokok: Rp ${simpananPokok.toLocaleString('id-ID')}\n`;
    message += `- Simpanan Wajib: Rp ${simpananWajib.toLocaleString('id-ID')}\n`;
    message += `- Simpanan Lainnya: Rp ${simpananLain.toLocaleString('id-ID')}\n`;
    message += `- TOTAL: Rp ${totalSimpanan.toLocaleString('id-ID')}\n\n`;
    
    message += `📝 BIAYA ADMINISTRASI:\n`;
    message += `- Biaya Pengunduran Diri: Rp ${BIAYA_ADMINISTRASI.toLocaleString('id-ID')}\n`;
    message += `(akan menjadi pendapatan administrasi)\n\n`;
    
    message += `Catatan: Semua simpanan akan ditandai "ditarik" dan anggota akan berstatus "nonaktif".`;
    
    if (pinjamanAktif.length > 0) {
      alert(`⚠️ GAGAL!\n\nAnggota "${ag.nama}" masih memiliki ${pinjamanAktif.length} pinjaman aktif totaling Rp ${sisaPinjaman.toLocaleString('id-ID')}.\n\nSilakan lunasi pinjaman terlebih dahulu sebelum anggota keluar.`);
      return;
    }
    
    const confirmKeluar = confirm(message);
    
    if (confirmKeluar) {
      // Tandai semua simpanan sebagai ditarik
      simpananAktif.forEach(s => {
        updateSimpanan(s.id, { status: 'ditarik' });
      });
      
      // Update status anggota
      updateAnggota(id, {
        status: 'nonaktif',
        tanggalKeluar: today,
      });
      
      // Tambah pendapatan administrasi pengunduran diri
      addPendapatan({
        jenis: 'administrasi_pengunduran_diri',
        deskripsi: `Biaya administrasi pengunduran diri - ${ag.nama}`,
        jumlah: BIAYA_ADMINISTRASI,
        tanggal: today,
      });
      
      alert(`✅ ANGGOTA KELAR!\n\n"${ag.nama}" telah keluar pada ${new Date(today).toLocaleDateString('id-ID')}.\n\nSimpanan yang dikembalikan: Rp ${totalSimpanan.toLocaleString('id-ID')}\nBiaya Administrasi: Rp ${BIAYA_ADMINISTRASI.toLocaleString('id-ID')}\n(Data simpanan ditandai "ditarik", biaya admin masuk ke pendapatan)`);
    }
  };

  const handleSelectSearch = (id: string) => {
    const ag = anggota.find(a => a.id === id);
    if (ag) {
      handleEdit(ag);
      setSearchQuery('');
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      nik: '',
      nomorNBA: '',
      jenisKelamin: 'L',
      tempatLahir: '',
      tanggalLahir: '',
      agama: '',
      alamat: '',
      alamatDomisili: '',
      statusPerkawinan: 'belum_kawin',
      namaPasangan: '',
      jumlahAnak: '0',
      namaIbuKandung: '',
      namaSaudara: '',
      noHpSaudara: '',
      pekerjaan: '',
      pendapatanPerbulan: '',
      statusRumah: 'rumah_sendiri',
      namaReferensi: '',
      simpananPokok: 0,
      simpananWajib: 0,
      uangBuku: 0,
      jenisPembayaran: 'tunai',
      telefon: '',
      tanggalJoin: '2024-01-01',
      status: 'aktif',
    });
    setAlamatSamaKTP(false);
    setShowForm(false);
    setEditingId(null);
  };

  if (!isHydrated) {
    return (
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Data Anggota</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Data Anggota</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('data')}
            className={`px-4 py-2 rounded font-medium ${viewMode === 'data' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            📋 Data
          </button>
          <button
            onClick={() => { setViewMode('tambah'); setShowForm(true); }}
            className={`px-4 py-2 rounded font-medium ${viewMode === 'tambah' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            ➕ Tambah
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded font-medium bg-orange-500 text-white hover:bg-orange-600"
          >
            🖨️ Cetak
          </button>
        </div>
      </div>

      {viewMode === 'data' ? (
        <>
          <div className="flex gap-2 mb-4 no-print">
            <input
              type="text"
              placeholder="Cari nama atau No. NBA..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="border p-2 rounded"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Keluar</option>
            </select>
            <select
              value={filterJenisKelamin}
              onChange={e => setFilterJenisKelamin(e.target.value as any)}
              className="border p-2 rounded"
            >
              <option value="all">Semua JK</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <select
              value={filterPekerjaan}
              onChange={e => setFilterPekerjaan(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="all">Semua Pekerjaan</option>
              {pekerjaanOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterTanggalFrom}
              onChange={e => setFilterTanggalFrom(e.target.value)}
              className="border p-2 rounded"
              placeholder="Dari tgl"
            />
            <input
              type="date"
              value={filterTanggalTo}
              onChange={e => setFilterTanggalTo(e.target.value)}
              className="border p-2 rounded"
              placeholder="Sampai tgl"
            />
            <button
              onClick={() => setShowImport(!showImport)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              📥 Import
            </button>
            <button
              onClick={() => setShowBulkUpdate(!showBulkUpdate)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              🔄 Ubah Pekerjaan Massal
            </button>
            <button
              onClick={() => {
                const data = anggota.map(a => ({
                  nama: a.nama,
                  nik: a.nik,
                  nomorNBA: a.nomorNBA,
                  jenisKelamin: a.jenisKelamin,
                  tempatLahir: a.tempatLahir,
                  tanggalLahir: a.tanggalLahir,
                  agama: a.agama,
                  alamat: a.alamat,
                  alamatDomisili: a.alamatDomisili,
                  statusPerkawinan: a.statusPerkawinan,
                  namaPasangan: a.namaPasangan,
                  jumlahAnak: a.jumlahAnak,
                  namaIbuKandung: a.namaIbuKandung,
                  namaSaudara: a.namaSaudara,
                  noHpSaudara: a.noHpSaudara,
                  pekerjaan: a.pekerjaan,
                  pendapatanPerbulan: a.pendapatanPerbulan,
                  statusRumah: a.statusRumah,
                  namaReferensi: a.namaReferensi,
                  simpananPokok: a.simpananPokok,
                  simpananWajib: a.simpananWajib,
                  uangBuku: a.uangBuku,
                  jenisPembayaran: a.jenisPembayaran,
                  telefon: a.telefon,
                  tanggalJoin: a.tanggalJoin,
                  status: a.status,
                  tanggalKeluar: a.tanggalKeluar || '',
                }));
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `anggota_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={anggota.length === 0}
            >
              📤 Export
            </button>
          </div>
          {searchQuery && (
            <span className="text-sm text-slate-500">
              Ditemukan: {displayAnggota.length} dari {filteredAnggota.length} anggota
            </span>
          )}

          {showTanggalForm && (
            <div className="bg-white p-4 rounded-lg shadow mb-4 no-print">
              <h2 className="font-semibold mb-3">Update Tanggal Masuk Massal</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="NBA Awal"
              value={tanggalForm.startNBA}
              onChange={e => setTanggalForm({ ...tanggalForm, startNBA: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="NBA Akhir"
              value={tanggalForm.endNBA}
              onChange={e => setTanggalForm({ ...tanggalForm, endNBA: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={tanggalForm.tanggal}
              onChange={e => setTanggalForm({ ...tanggalForm, tanggal: e.target.value })}
              className="border p-2 rounded"
            />
            <button
              onClick={() => {
                bulkUpdateTanggalJoin(tanggalForm.startNBA, tanggalForm.endNBA, tanggalForm.tanggal);
                alert(`Tanggal masuk berhasil diupdate untuk NBA ${tanggalForm.startNBA} - ${tanggalForm.endNBA}`);
                setShowTanggalForm(false);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Update
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Contoh: NBA 1-25 ubah ke tgl 09/11/2023
          </p>
        </div>
      )}

      {showImport && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">Import Data Anggota (Excel/CSV)</h2>
          
          <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
            <h3 className="font-semibold text-blue-800 mb-2">Format Kolom Excel/CSV:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-blue-700">
              <div>nama</div><div>nik</div><div>nomorNBA</div><div>jenisKelamin</div>
              <div>tempatLahir</div><div>tanggalLahir</div><div>agama</div><div>alamat</div>
              <div>alamatDomisili</div><div>statusPerkawinan</div><div>namaPasangan</div><div>jumlahAnak</div>
              <div>namaIbuKandung</div><div>namaSaudara</div><div>noHpSaudara</div><div>pekerjaan</div>
              <div>pendapatanPerbulan</div><div>statusRumah</div><div>namaReferensi</div><div>simpananPokok</div>
              <div>simpananWajib</div><div>uangBuku</div><div>jenisPembayaran</div><div>telepon</div>
              <div>tanggalJoin</div><div>tglMasuk</div><div>tanggalMasuk</div>
            </div>
            <p className="text-blue-600 mt-2 text-xs">Kolom bisa menggunakan huruf besar/kecil campuran (contoh: Nama, nama, NAMA)</p>
            <div className="flex gap-4 mt-2">
              <a href="/contoh_import_anggota.csv" download className="text-blue-700 underline text-xs">📄 Download contoh CSV</a>
              <button 
                onClick={() => {
                  const contohData = [
                    {
                      nama: 'Budi Santoso',
                      nik: '1234567890123456',
                      nomorNBA: '1',
                      jenisKelamin: 'L',
                      tempatLahir: 'Jakarta',
                      tanggalLahir: '15-03-1985',
                      agama: 'Islam',
                      alamat: 'Jl. Merdeka No. 10',
                      alamatDomisili: 'Jl. Merdeka No. 10',
                      statusPerkawinan: 'kawin',
                      namaPasangan: 'Siti Rahayu',
                      jumlahAnak: '2',
                      namaIbuKandung: 'Ratna',
                      namaSaudara: 'Sudrajat',
                      noHpSaudara: '081234567890',
                      pekerjaan: 'karyawan_swasta',
                      pendapatanPerbulan: '5jt_10jt',
                      statusRumah: 'rumah_sendiri',
                      namaReferensi: 'Samudera Ginting S.H',
                      simpananPokok: 100000,
                      simpananWajib: 50000,
                      uangBuku: 25000,
                      jenisPembayaran: 'tunai',
                      telefon: '0812345678',
                      tanggalJoin: '09-11-2023',
                    },
                    {
                      nama: 'Ani Wijaya',
                      nik: '2345678901234567',
                      nomorNBA: '2',
                      jenisKelamin: 'P',
                      tempatLahir: 'Bandung',
                      tanggalLahir: '22-07-1990',
                      agama: 'Islam',
                      alamat: 'Jl. Asia Afrika No. 5',
                      alamatDomisili: 'Jl. Asia Afrika No. 5',
                      statusPerkawinan: 'kawin',
                      namaPasangan: 'Ahmad Fauzi',
                      jumlahAnak: '1',
                      namaIbuKandung: 'Siti Aminah',
                      namaSaudara: 'Tono',
                      noHpSaudara: '081234567891',
                      pekerjaan: 'pns',
                      pendapatanPerbulan: '5jt_10jt',
                      statusRumah: 'rumah_sendiri',
                      namaReferensi: 'Ahmad Dahlan Surbakti A.md',
                      simpananPokok: 100000,
                      simpananWajib: 50000,
                      uangBuku: 25000,
                      jenisPembayaran: 'tunai',
                      telefon: '0812345679',
                      tanggalJoin: '09-11-2023',
                    },
                  ];
                  const ws = XLSX.utils.json_to_sheet(contohData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Anggota');
                  XLSX.writeFile(wb, 'contoh_import_anggota.xlsx');
                }}
                className="text-blue-700 underline text-xs bg-transparent border-none cursor-pointer"
              >
                📊 Download contoh Excel
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-slate-500 mb-2">Upload file Excel (.xlsx, .xls) atau CSV</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                try {
                  const data = await file.arrayBuffer();
                  const workbook = XLSX.read(data);
                  const sheetName = workbook.SheetNames[0];
                  
                  if (file.name.endsWith('.json')) {
                    const text = await file.text();
                    const jsonData = JSON.parse(text);
                    if (Array.isArray(jsonData)) {
                      const confirmImport = confirm(`Ditemukan ${jsonData.length} data dari backup. Lanjutkan import?`);
                      if (!confirmImport) return;
                      let count = 0;
                      jsonData.forEach((row: any) => {
                        if (!row.nama) return;
                        addAnggota({
                          nama: row.nama || '',
                          nik: row.nik || '',
                          nomorNBA: row.nomorNBA || '',
                          jenisKelamin: (row.jenisKelamin || 'L') as 'L' | 'P',
                          tempatLahir: row.tempatLahir || '',
                          tanggalLahir: row.tanggalLahir || '',
                          agama: row.agama || '',
                          alamat: row.alamat || '',
                          alamatDomisili: row.alamatDomisili || '',
                          statusPerkawinan: row.statusPerkawinan || 'belum_kawin',
                          namaPasangan: row.namaPasangan || '',
                          jumlahAnak: String(row.jumlahAnak || '0'),
                          namaIbuKandung: row.namaIbuKandung || '',
                          namaSaudara: row.namaSaudara || '',
                          noHpSaudara: row.noHpSaudara || '',
                          pekerjaan: row.pekerjaan || '',
                          pendapatanPerbulan: row.pendapatanPerbulan || '',
                          statusRumah: row.statusRumah || 'rumah_sendiri',
                          namaReferensi: row.namaReferensi || '',
                          simpananPokok: Number(row.simpananPokok) || 0,
                          simpananWajib: Number(row.simpananWajib) || 0,
                          uangBuku: Number(row.uangBuku) || 0,
                          jenisPembayaran: row.jenisPembayaran || 'tunai',
                          telefon: row.telefon || '',
                          tanggalJoin: row.tanggalJoin || '2024-01-01',
                          status: row.status === 'nonaktif' ? 'nonaktif' : 'aktif',
                        });
                        count++;
                      });
                      alert(`Berhasil import ${count} anggota dari backup`);
                      setShowImport(false);
                      return;
                    }
                  }
                  
                  const worksheet = workbook.Sheets[sheetName];
                  const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
                  
                  if (jsonData.length === 0) {
                    alert('File kosong atau tidak memiliki data!');
                    return;
                  }
                  
                  const firstRow = jsonData[0];
                  const requiredFields = ['nama', 'Nama', 'Nama Lengkap', 'nik', 'NIK'];
                  const hasRequiredField = requiredFields.some(field => firstRow[field] !== undefined);
                  
                  if (!hasRequiredField) {
                    alert('Struktur file tidak sesuai! Kolom "nama" atau "NIK" tidak ditemukan.\n\nKolom yang diharapkan:\n- nama/Nama/Nama Lengkap\n- nik/NIK\n- nomorNBA\n- jenisKelamin\n- tempatLahir\n- tanggalLahir\n- agama\n- alamat\n- alamatDomisili\n- statusPerkawinan\n- namaPasangan\n- jumlahAnak\n- namaIbuKandung\n- namaSaudara\n- noHpSaudara\n- pekerjaan\n- pendapatanPerbulan\n- statusRumah\n- namaReferensi\n- simpananPokok\n- simpananWajib\n- uangBuku\n- jenisPembayaran\n- telefon\n- tanggalJoin');
                    return;
                  }
                  
                  if (jsonData.length > 0) {
                    const confirmImport = confirm(`Ditemukan ${jsonData.length} data. Lanjutkan import?`);
                    if (!confirmImport) return;
                  }
                  
                  let count = 0;
                  jsonData.forEach((row: any) => {
                    if (!row.nama && !row.Nama && !row['Nama Lengkap']) return;
                    addAnggota({
                      nama: row.nama || row.Nama || '',
                      nik: row.nik || row.NIK || '',
                      nomorNBA: row.nomorNBA || row['Nomor NBA'] || row.nomor_nba || '',
                      jenisKelamin: (row.jenisKelamin || row['Jenis Kelamin'] || row.jenis_kelamin || 'L') as 'L' | 'P',
                      tempatLahir: row.tempatLahir || row['Tempat Lahir'] || row.tempat_lahir || row.Tempat || '',
                      tanggalLahir: parseDate(row.tanggalLahir || row['Tanggal Lahir'] || row.tanggal_lahir || row['Tgl Lahir'] || row.tgl_lahir || ''),
                      agama: row.agama || row.Agama || '',
                      alamat: row.alamat || row.Alamat || '',
                      alamatDomisili: row.alamatDomisili || row['Alamat Domisili'] || row.alamat_domisili || '',
                      statusPerkawinan: row.statusPerkawinan || row['Status Perkawinan'] || row.status_perkawinan || 'belum_kawin',
                      namaPasangan: row.namaPasangan || row['Nama Pasangan'] || row.nama_pasangan || '',
                      jumlahAnak: String(row.jumlahAnak || row['Jumlah Anak'] || row.jumlah_anak || '0'),
                      namaIbuKandung: row.namaIbuKandung || row['Nama Ibu Kandung'] || row.nama_ibu_kandung || '',
                      namaSaudara: row.namaSaudara || row['Nama Saudara'] || row.nama_saudara || '',
                      noHpSaudara: row.noHpSaudara || row['No HP Saudara'] || row.no_hp_saudara || '',
                      pekerjaan: row.pekerjaan || row.Pekerjaan || '',
                      pendapatanPerbulan: row.pendapatanPerbulan || row['Pendapatan Perbulan'] || row.pendapatan_perbulan || '',
                      statusRumah: row.statusRumah || row['Status Rumah'] || row.status_rumah || 'rumah_sendiri',
                      namaReferensi: row.namaReferensi || row['Nama Referensi'] || row.nama_referensi || '',
                      simpananPokok: Number(row.simpananPokok || row['Simpanan Pokok'] || row.simpanan_pokok) || 0,
                      simpananWajib: Number(row.simpananWajib || row['Simpanan Wajib'] || row.simpanan_wajib) || 0,
                      uangBuku: Number(row.uangBuku || row['Uang Buku'] || row.uang_buku) || 0,
                      jenisPembayaran: row.jenisPembayaran || row['Jenis Pembayaran'] || row.jenis_pembayaran || 'tunai',
                      telefon: row.telefon || row.Telepon || row.noTelepon || '',
                      tanggalJoin: parseDate(row.tanggalJoin || row['Tanggal Join'] || row.tanggal_join || row['Tgl Masuk'] || row.tgl_masuk || row.tanggalMasuk || row['Tanggal Masuk']) || '2024-01-01',
                      status: 'aktif',
                    });
                    count++;
                  });
                  alert(`Berhasil import ${count} anggota`);
                  setShowImport(false);
                } catch (error) {
                  alert('Gagal import file. Pastikan format file benar.');
                }
              }}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-slate-500 mb-2"> Atau paste data CSV:</p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste data CSV di sini..."
              className="border p-2 rounded w-full h-40 font-mono text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const lines = importText.trim().split('\n');
                  let count = 0;
                  lines.forEach((line, index) => {
                    if (index === 0 && line.toLowerCase().includes('nama')) return;
                    const cols = line.split(',').map(c => c.trim());
                    if (cols.length >= 1 && cols[0]) {
                      addAnggota({
                        nama: cols[0] || '',
                        nik: cols[1] || '',
                        nomorNBA: cols[2] || '',
                        jenisKelamin: (cols[3] as 'L' | 'P') || 'L',
                        tempatLahir: cols[4] || '',
                        tanggalLahir: cols[5] || '',
                        agama: cols[6] || '',
                        alamat: cols[7] || '',
                        alamatDomisili: cols[8] || '',
                        statusPerkawinan: (cols[9] as any) || 'belum_kawin',
                        namaPasangan: cols[10] || '',
                        jumlahAnak: cols[11] || '0',
                        namaIbuKandung: cols[12] || '',
                        namaSaudara: cols[13] || '',
                        noHpSaudara: cols[14] || '',
                        pekerjaan: cols[15] || '',
                        pendapatanPerbulan: cols[16] || '',
                        statusRumah: (cols[17] as any) || 'rumah_sendiri',
                        namaReferensi: cols[18] || '',
                        simpananPokok: Number(cols[19]) || 0,
                        simpananWajib: Number(cols[20]) || 0,
                        uangBuku: Number(cols[21]) || 0,
                        jenisPembayaran: (cols[22] as any) || 'tunai',
                        telefon: cols[23] || '',
                        tanggalJoin: cols[24] || cols[25] || cols[26] || '2024-01-01',
                        status: 'aktif',
                      });
                      count++;
                    }
                  });
                  alert(`Berhasil import ${count} anggota`);
                  setImportText('');
                  setShowImport(false);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Import CSV
              </button>
              <button
                onClick={() => { setImportText(''); setShowImport(false); }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkUpdate && (
        <div className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-purple-500">
          <h2 className="font-semibold mb-3">🔄 Ubah Pekerjaan Massal</h2>
          <p className="text-sm text-slate-500 mb-4">
            Ubah pekerjaan semua anggota dari pekerjaan lama ke pekerjaan baru secara sekaligus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pekerjaan Lama (Dari)</label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(anggota.map(a => a.pekerjaan).filter(Boolean))).map(job => {
                  const count = anggota.filter(a => a.pekerjaan === job).length;
                  const isSelected = bulkFromPekerjaan === job;
                  return (
                    <button
                      key={job}
                      onClick={() => setBulkFromPekerjaan(isSelected ? '' : job)}
                      className={`px-3 py-1 rounded-full text-sm border ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      {getLabel(pekerjaanOptions, job) || job} ({count})
                    </button>
                  );
                })}
              </div>
              {bulkFromPekerjaan && (
                <p className="text-xs text-purple-600 mt-1">Terpilih: {getLabel(pekerjaanOptions, bulkFromPekerjaan)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pekerjaan Baru (Menjadi)</label>
              <select
                value={bulkToPekerjaan}
                onChange={e => setBulkToPekerjaan(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="">Pilih Pekerjaan Baru</option>
                {pekerjaanOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
                onClick={() => {
                  if (!bulkFromPekerjaan || !bulkToPekerjaan) {
                    alert('Mohon pilih pekerjaan lama dan pekerjaan baru!');
                    return;
                  }
                  const count = anggota.filter(a => a.pekerjaan === bulkFromPekerjaan).length;
                  if (count === 0) {
                    alert('Tidak ada anggota dengan pekerjaan tersebut!');
                    return;
                  }
                  if (confirm(`Yakin ingin mengubah ${count} anggota dari "${getLabel(pekerjaanOptions, bulkFromPekerjaan)}" menjadi "${getLabel(pekerjaanOptions, bulkToPekerjaan)}"?`)) {
                    anggota.forEach(a => {
                      if (a.pekerjaan === bulkFromPekerjaan) {
                        updateAnggota(a.id, { pekerjaan: bulkToPekerjaan });
                      }
                    });
                    alert(`Berhasil mengubah ${count} anggota!`);
                    setShowBulkUpdate(false);
                    setBulkFromPekerjaan('');
                    setBulkToPekerjaan('');
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                🔄 Jalankan Perubahan
              </button>
              <button
                onClick={() => {
                  setShowBulkUpdate(false);
                  setBulkFromPekerjaan('');
                  setBulkToPekerjaan('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Batal
              </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Contoh: Ubah semua &quot;Ibu Rumah Tangga&quot; → &quot;Mengurus Rumah Tangga&quot;
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Data Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="border p-2 rounded" required />
                <input type="text" placeholder="NIK" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="border p-2 rounded" required />
                <input type="text" placeholder="Nomor NBA" value={formData.nomorNBA} onChange={e => setFormData({ ...formData, nomorNBA: e.target.value })} className="border p-2 rounded" />
                <select value={formData.jenisKelamin} onChange={e => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })} className="border p-2 rounded">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <input type="text" placeholder="Tempat Lahir" value={formData.tempatLahir} onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })} className="border p-2 rounded" />
                <input type="date" value={formData.tanggalLahir} onChange={e => setFormData({ ...formData, tanggalLahir: e.target.value })} className="border p-2 rounded" />
                <select value={formData.agama} onChange={e => setFormData({ ...formData, agama: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Agama</option>
                  {agamaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={formData.statusPerkawinan} onChange={e => setFormData({ ...formData, statusPerkawinan: e.target.value as any })} className="border p-2 rounded">
                  {statusPerkawinanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {formData.statusPerkawinan !== 'belum_kawin' && (
                  <>
                    <input type="text" placeholder="Nama Pasangan" value={formData.namaPasangan} onChange={e => setFormData({ ...formData, namaPasangan: e.target.value })} className="border p-2 rounded" />
                    <select value={formData.jumlahAnak} onChange={e => setFormData({ ...formData, jumlahAnak: e.target.value })} className="border p-2 rounded">
                      {jumlahAnakOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </>
                )}
                <input type="text" placeholder="Nama Ibu Kandung" value={formData.namaIbuKandung} onChange={e => setFormData({ ...formData, namaIbuKandung: e.target.value })} className="border p-2 rounded" />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Alamat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Alamat (KTP)" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="border p-2 rounded" required />
                {!alamatSamaKTP ? (
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Alamat Domisili" value={formData.alamatDomisili} onChange={e => setFormData({ ...formData, alamatDomisili: e.target.value })} className="border p-2 rounded flex-1" />
                    <button type="button" onClick={() => setAlamatSamaKTP(true)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      Sama dengan KTP
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm text-green-700">✓ Alamat Domisili sama dengan KTP</span>
                    <button type="button" onClick={() => setAlamatSamaKTP(false)} className="text-xs text-red-600 hover:underline ml-auto">
                      Ubah
                    </button>
                  </div>
                )}
                <input type="tel" placeholder="Nomor Telepon" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} className="border p-2 rounded" required />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Kontak Darurat</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Nama Saudara Tidak Serumah" value={formData.namaSaudara} onChange={e => setFormData({ ...formData, namaSaudara: e.target.value })} className="border p-2 rounded" />
                <input type="tel" placeholder="No HP Saudara" value={formData.noHpSaudara} onChange={e => setFormData({ ...formData, noHpSaudara: e.target.value })} className="border p-2 rounded" />
                <select value={formData.namaReferensi} onChange={e => setFormData({ ...formData, namaReferensi: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Referensi</option>
                  {referensiOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Pekerjaan & Pendapatan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={formData.pekerjaan} onChange={e => setFormData({ ...formData, pekerjaan: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Pekerjaan</option>
                  {pekerjaanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={formData.pendapatanPerbulan} onChange={e => setFormData({ ...formData, pendapatanPerbulan: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Pendapatan</option>
                  {pendapatanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={formData.statusRumah} onChange={e => setFormData({ ...formData, statusRumah: e.target.value as any })} className="border p-2 rounded">
                  {statusRumahOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Keanggotaan</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="border p-2 rounded bg-slate-100">
                  <label className="text-xs text-slate-500 block">Simpanan Pokok</label>
                  <span className="font-medium">Rp 100.000</span>
                </div>
                <div className="border p-2 rounded bg-slate-100">
                  <label className="text-xs text-slate-500 block">Simpanan Wajib</label>
                  <span className="font-medium">Rp 50.000</span>
                </div>
                <div className="border p-2 rounded bg-slate-100">
                  <label className="text-xs text-slate-500 block">Uang Buku</label>
                  <span className="font-medium">Rp 25.000</span>
                </div>
                <select value={formData.jenisPembayaran} onChange={e => setFormData({ ...formData, jenisPembayaran: e.target.value as any })} className="border p-2 rounded">
                  {jenisPembayaranOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="date" value={formData.tanggalJoin} onChange={e => setFormData({ ...formData, tanggalJoin: e.target.value })} className="border p-2 rounded" required />
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })} className="border p-2 rounded">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{editingId ? 'Update' : 'Simpan'}</button>
                  <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Batal</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-center p-2 w-12">No</th>
                <th className="text-left p-2">Tanggal Masuk</th>
                <th className="text-left p-2">Nama Anggota</th>
                <th className="text-left p-2">NIK</th>
                <th className="text-left p-2">NBA</th>
                <th className="text-left p-2">JK</th>
                <th className="text-left p-2">TTL</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Tgl Keluar</th>
                <th className="text-left p-2">Pekerjaan</th>
                <th className="text-right p-2">Simpanan Pokok</th>
                <th className="text-right p-2">Simpanan Wajib</th>
                <th className="text-right p-2">Uang Buku</th>
                <th className="text-center p-2 no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayAnggota.length === 0 ? (
                <tr><td colSpan={14} className="text-center p-4 text-slate-500">Belum ada anggota</td></tr>
              ) : (
                displayAnggota.map((a, index) => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 text-center text-slate-500">{index + 1}</td>
                    <td className="p-2">{a.tanggalJoin ? new Date(a.tanggalJoin).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="p-2 font-medium">{a.nama}</td>
                    <td className="p-2">{a.nik}</td>
                    <td className="p-2">{a.nomorNBA || '-'}</td>
                    <td className="p-2">{a.jenisKelamin === 'L' ? 'L' : 'P'}</td>
                    <td className="p-2 text-xs">{a.tempatLahir ? `${a.tempatLahir}, ${a.tanggalLahir ? new Date(a.tanggalLahir).toLocaleDateString('id-ID') : '-'}` : '-'}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span></td>
                    <td className="p-2 text-slate-500">{a.tanggalKeluar ? new Date(a.tanggalKeluar).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="p-2">{a.pekerjaan ? getLabel(pekerjaanOptions, a.pekerjaan) : '-'}</td>
                    <td className="p-2 text-right">{formatRupiah(a.simpananPokok)}</td>
                    <td className="p-2 text-right">{formatRupiah(a.simpananWajib)}</td>
                    <td className="p-2 text-right">{formatRupiah(a.uangBuku)}</td>
                    <td className="p-2 text-center no-print">
                      <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline mr-1">Edit</button>
                      {a.status === 'aktif' && (
                        <button onClick={() => handleKeluar(a.id)} className="text-orange-600 hover:underline mr-1">Keluar</button>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        <>
          {showForm && (
            <div className="bg-white p-4 rounded-lg shadow mb-4 max-h-[70vh] overflow-y-auto">
              <h2 className="font-semibold mb-3">{editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Data Pribadi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="border p-2 rounded" required />
                    <input type="text" placeholder="NIK" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="border p-2 rounded" required />
                    <input type="text" placeholder="Nomor NBA" value={formData.nomorNBA} onChange={e => setFormData({ ...formData, nomorNBA: e.target.value })} className="border p-2 rounded" />
                    <select value={formData.jenisKelamin} onChange={e => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })} className="border p-2 rounded">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <input type="text" placeholder="Tempat Lahir" value={formData.tempatLahir} onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })} className="border p-2 rounded" />
                    <input type="date" value={formData.tanggalLahir} onChange={e => setFormData({ ...formData, tanggalLahir: e.target.value })} className="border p-2 rounded" />
                    <select value={formData.agama} onChange={e => setFormData({ ...formData, agama: e.target.value })} className="border p-2 rounded">
                      <option value="">Pilih Agama</option>
                      {agamaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select value={formData.statusPerkawinan} onChange={e => setFormData({ ...formData, statusPerkawinan: e.target.value as any })} className="border p-2 rounded">
                      {statusPerkawinanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {formData.statusPerkawinan !== 'belum_kawin' && (
                      <>
                        <input type="text" placeholder="Nama Pasangan" value={formData.namaPasangan} onChange={e => setFormData({ ...formData, namaPasangan: e.target.value })} className="border p-2 rounded" />
                        <select value={formData.jumlahAnak} onChange={e => setFormData({ ...formData, jumlahAnak: e.target.value })} className="border p-2 rounded">
                          {jumlahAnakOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </>
                    )}
                    <input type="text" placeholder="Nama Ibu Kandung" value={formData.namaIbuKandung} onChange={e => setFormData({ ...formData, namaIbuKandung: e.target.value })} className="border p-2 rounded" />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Alamat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Alamat (KTP)" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="border p-2 rounded" required />
                    {!alamatSamaKTP ? (
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="Alamat Domisili" value={formData.alamatDomisili} onChange={e => setFormData({ ...formData, alamatDomisili: e.target.value })} className="border p-2 rounded flex-1" />
                        <button type="button" onClick={() => setAlamatSamaKTP(true)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Sama dengan KTP</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-sm text-green-700">✓ Alamat Domisili sama dengan KTP</span>
                        <button type="button" onClick={() => setAlamatSamaKTP(false)} className="text-xs text-red-600 hover:underline ml-auto">Ubah</button>
                      </div>
                    )}
                    <input type="tel" placeholder="Nomor Telepon" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} className="border p-2 rounded" required />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Kontak Darurat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Nama Saudara Tidak Serumah" value={formData.namaSaudara} onChange={e => setFormData({ ...formData, namaSaudara: e.target.value })} className="border p-2 rounded" />
                    <input type="tel" placeholder="No HP Saudara" value={formData.noHpSaudara} onChange={e => setFormData({ ...formData, noHpSaudara: e.target.value })} className="border p-2 rounded" />
                    <select value={formData.namaReferensi} onChange={e => setFormData({ ...formData, namaReferensi: e.target.value })} className="border p-2 rounded">
                      <option value="">Pilih Referensi</option>
                      {referensiOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Pekerjaan & Pendapatan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select value={formData.pekerjaan} onChange={e => setFormData({ ...formData, pekerjaan: e.target.value })} className="border p-2 rounded">
                      <option value="">Pilih Pekerjaan</option>
                      {pekerjaanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={formData.pendapatanPerbulan} onChange={e => setFormData({ ...formData, pendapatanPerbulan: e.target.value })} className="border p-2 rounded">
                      <option value="">Pilih Pendapatan</option>
                      {pendapatanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={formData.statusRumah} onChange={e => setFormData({ ...formData, statusRumah: e.target.value as any })} className="border p-2 rounded">
                      {statusRumahOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Keanggotaan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="border p-2 rounded bg-slate-100">
                      <label className="text-xs text-slate-500 block">Simpanan Pokok</label>
                      <span className="font-medium">Rp 100.000</span>
                    </div>
                    <div className="border p-2 rounded bg-slate-100">
                      <label className="text-xs text-slate-500 block">Simpanan Wajib</label>
                      <span className="font-medium">Rp 25.000</span>
                    </div>
                    <div className="border p-2 rounded bg-slate-100">
                      <label className="text-xs text-slate-500 block">Uang Buku</label>
                      <span className="font-medium">Rp 25.000</span>
                    </div>
                    <select value={formData.jenisPembayaran} onChange={e => setFormData({ ...formData, jenisPembayaran: e.target.value as any })} className="border p-2 rounded">
                      {jenisPembayaranOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="date" value={formData.tanggalJoin} onChange={e => setFormData({ ...formData, tanggalJoin: e.target.value })} className="border p-2 rounded" required />
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })} className="border p-2 rounded">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{editingId ? 'Update' : 'Simpan'}</button>
                      <button type="button" onClick={() => { setViewMode('data'); resetForm(); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Batal</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
          {!showForm && (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-slate-500 mb-4">Klik tombol di atas untuk menambah anggota baru</p>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Tambah Anggota</button>
            </div>
          )}
        </>
      )}
    </>
  );
}