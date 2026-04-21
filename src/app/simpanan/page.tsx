'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Simpanan } from '@/types';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatRupiahInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return parseInt(numbers).toLocaleString('id-ID');
}

function parseRupiah(value: string): number {
  return parseInt(value.replace(/\D/g, '')) || 0;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID');
  } catch {
    return '-';
  }
}

const jenisSimpananOptions = [
  { value: 'pokok', label: 'SP - Simpanan Pokok', bunga: 0 },
  { value: 'wajib', label: 'SW - Simpanan Wajib', bunga: 0 },
  { value: 'sibuhar', label: 'SBH - Simpanan Bunga Harian (3%)', bunga: 3, tenor: 12 },
  { value: 'simapan', label: 'Simapan - Masa Depan (5%)', bunga: 5, tenor: 12, tenorMax: 120 },
  { value: 'sihat', label: 'Sihat - Hari Tua (6%)', bunga: 6, tenor: 12, tenorMax: 180 },
  { value: 'sihar', label: 'Sihar - Hari Raya', bunga: 0, tenor: 12 },
];

export default function SimpananPage() {
  const { anggota, simpanans, addSimpanan, updateSimpanan, deleteSimpanan, deleteAllSimpananByJenis, fixSimpananTanggal, addTransaksi } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterJenis, setFilterJenis] = useState('all');
  const [jumlahDisplay, setJumlahDisplay] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    anggotaId: '',
    jumlah: 0,
    jenis: 'wajib' as 'wajib' | 'pokok' | 'sibuhar' | 'simapan' | 'sihat' | 'sihar',
    tanggalSimpan: '2024-01-01',
    status: 'aktif' as 'aktif' | 'ditarik' | 'aktif_auto',
    jenisPembayaran: 'tunai' as 'tunai' | 'bri_tigabinanga' | 'bri_berastagi' | 'penarikan',
    tenor: 12,
    premi: 100000,
    bunga: 0,
  });

  const jenisPembayaranOptions = [
    { value: 'tunai', label: 'Tunai' },
    { value: 'bri_tigabinanga', label: 'Transfer BRI Cab. Tigabinanga' },
    { value: 'bri_berastagi', label: 'BRI Cab. Berastagi' },
    { value: 'penarikan', label: 'Penarikan' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importJenis, setImportJenis] = useState<string>('wajib');
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPageAnggota, setCurrentPageAnggota] = useState(1);
  const [searchAnggota, setSearchAnggota] = useState('');
  const [searchSimpanan, setSearchSimpanan] = useState('');

  const currentYear = new Date().getFullYear();
  const startYear = 2023;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();

  const yearlySummary = years.map(year => {
    const simpananPokok = simpanans.filter(s => s.jenis === 'pokok' && s.status !== 'ditarik' && new Date(s.tanggalSimpan).getFullYear() === year).reduce((sum, s) => sum + s.jumlah, 0);
    const simpananWajib = simpanans.filter(s => s.jenis === 'wajib' && s.status !== 'ditarik' && new Date(s.tanggalSimpan).getFullYear() === year).reduce((sum, s) => sum + s.jumlah, 0);
    const simpananSibuhar = simpanans.filter(s => s.jenis === 'sibuhar' && s.status !== 'ditarik' && new Date(s.tanggalSimpan).getFullYear() === year).reduce((sum, s) => sum + s.jumlah, 0);
    const simpananSimapan = simpanans.filter(s => s.jenis === 'simapan' && s.status !== 'ditarik' && new Date(s.tanggalSimpan).getFullYear() === year).reduce((sum, s) => sum + s.jumlah, 0);
    const simpananSihat = simpanans.filter(s => s.jenis === 'sihat' && s.status !== 'ditarik' && new Date(s.tanggalSimpan).getFullYear() === year).reduce((sum, s) => sum + s.jumlah, 0);
    const simpananSihar = simpanans.filter(s => s.jenis === 'sihar' && s.status !== 'ditarik' && new Date(s.tanggalSimpan).getFullYear() === year).reduce((sum, s) => sum + s.jumlah, 0);
    return {
      year,
      pokok: simpananPokok,
      wajib: simpananWajib,
      sibuhar: simpananSibuhar,
      simapan: simpananSimapan,
      sihat: simpananSihat,
      sihar: simpananSihar,
      total: simpananPokok + simpananWajib + simpananSibuhar + simpananSimapan + simpananSihat + simpananSihar
    };
  });

  const grandTotal = yearlySummary.reduce((acc, y) => ({
    tahun: 'Total',
    pokok: acc.pokok + y.pokok,
    wajib: acc.wajib + y.wajib,
    sibuhar: acc.sibuhar + y.sibuhar,
    simapan: acc.simapan + y.simapan,
    sihat: acc.sihat + y.sihat,
    sihar: acc.sihar + y.sihar,
    total: acc.total + y.total
  }), { tahun: 'Total', pokok: 0, wajib: 0, sibuhar: 0, simapan: 0, sihat: 0, sihar: 0, total: 0 });

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    
    // Handle Excel serial date (numbers like 45306)
    if (/^\d+$/.test(trimmed)) {
      const serial = parseInt(trimmed, 10);
      if (serial > 25569 && serial < 50000) { // Excel dates from 1970-2035
        const excelDate = new Date((serial - 25569) * 86400 * 1000);
        const year = excelDate.getFullYear();
        const month = String(excelDate.getMonth() + 1).padStart(2, '0');
        const day = String(excelDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    // Format: yyyy-mm-dd
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) return trimmed;
    
    // Format: dd-mm-yyyy
    if (trimmed.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const parts = trimmed.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Format: dd/mm/yyyy
    if (trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = trimmed.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Format: yyyy/mm/dd
    if (trimmed.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      const parts = trimmed.split('/');
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    
    // Try parsing as regular date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  };

const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      let errorCount = 0;
      const errors: string[] = [];
      const validData: {
        noNBA: string;
        nama: string;
        anggotaId: string;
        jenis: 'pokok' | 'wajib' | 'sibuhar' | 'simapan' | 'sihat' | 'sihar';
        jumlah: number;
        tanggalSimpan: string;
        status: 'aktif' | 'ditarik' | 'aktif_auto';
        jenisPembayaran: 'tunai' | 'bri_tigabinanga' | 'bri_berastagi' | 'penarikan';
      }[] = [];

      json.forEach((row, index) => {
        const rowNum = index + 2;
        
        // Get NBA - handle various column name formats
        const noNBA = String(
          row['No. NBA'] || 
          row['noNBA'] || 
          row['NBA'] || 
          row['No NBA'] || 
          row['No.'] || 
          row['no'] || 
          ''
        ).trim();
        
        // Get Nama Anggota - handle various column name formats
        const nama = String(
          row['Nama Anggota'] || 
          row['nama'] || 
          row['Nama'] || 
          row['Nama Lengkap'] || 
          row['nama_lengkap'] || 
          ''
        ).trim();
        
        const jumlah = Number(row['Nilai Simpanan'] || row['Jumlah Transaksi'] || row['jumlah'] || row['Jumlah'] || 0);
        const tanggalStr = String(row['Tanggal Transaksi'] || row['Tanggal'] || row['tanggal'] || '').trim();
        
        const statusRaw = String(row['Status'] || row['status'] || '').toLowerCase();
        let status: 'aktif' | 'ditarik' | 'aktif_auto' = 'aktif';
        if (statusRaw.includes('ditarik')) {
          status = 'ditarik';
        } else if (statusRaw.includes('auto')) {
          status = 'aktif_auto';
        }

        const jenisBayarRaw = String(row['Jenis Pembayaran'] || row['JenisTransaksi'] || row['jenis_pembayaran'] || '').toLowerCase();
        let jenisPembayaran: 'tunai' | 'bri_tigabinanga' | 'bri_berastagi' | 'penarikan' = 'tunai';
        if (jenisBayarRaw.includes('tigabinanga')) {
          jenisPembayaran = 'bri_tigabinanga';
        } else if (jenisBayarRaw.includes('berastagi')) {
          jenisPembayaran = 'bri_berastagi';
        } else if (jenisBayarRaw.includes('penarikan')) {
          jenisPembayaran = 'penarikan';
        }

        if (!noNBA && !nama) {
          errorCount++;
          errors.push(`[Baris ${rowNum}] NBA dan Nama kosong`);
          return;
        }

        const ag = anggota.find(a => 
          (noNBA && a.nomorNBA === noNBA) || 
          (nama && a.nama.toLowerCase() === nama.toLowerCase())
        );

        if (!ag) {
          errorCount++;
          errors.push(`[Baris ${rowNum}] NBA: "${noNBA}" / Nama: "${nama}" - Anggota tidak ditemukan di database`);
          return;
        }

        const tanggal = parseDate(tanggalStr);
        if (!tanggal) {
          errorCount++;
          errors.push(`[Baris ${rowNum}] NBA: "${noNBA}" / Nama: "${nama}" - Tanggal tidak valid: "${tanggalStr}" (gunakan format dd-mm-yyyy)`);
          return;
        }

        if (jumlah <= 0 || isNaN(jumlah)) {
          errorCount++;
          errors.push(`[Baris ${rowNum}] NBA: "${noNBA}" / Nama: "${nama}" - Jumlah tidak valid: "${jumlah}"`);
          return;
        }

        validData.push({
          noNBA,
          nama,
          anggotaId: ag.id,
          jenis: importJenis as 'pokok' | 'wajib' | 'sibuhar' | 'simapan' | 'sihat' | 'sihar',
          jumlah: jumlah,
          tanggalSimpan: tanggal,
          status: status,
          jenisPembayaran: jenisPembayaran,
        });
      });

      if (errorCount > 0) {
        alert(`⚠️ Gagal import! Ada ${errorCount} data bermasalah:\n\n${errors.slice(0, 15).join('\n')}${errors.length > 15 ? '\n\n...dan ' + (errors.length - 15) + ' error lagi' : ''}\n\nMohon perbaiki data di Excel terlebih dahulu, lalu import ulang.`);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      for (const data of validData) {
        addSimpanan({
          anggotaId: data.anggotaId,
          jenis: data.jenis,
          jumlah: data.jumlah,
          tanggalSimpan: data.tanggalSimpan,
          status: data.status,
          jenisPembayaran: data.jenisPembayaran,
        });
      }

      const jenisLabel = jenisSimpananOptions.find(j => j.value === importJenis)?.label || importJenis;
      alert(`Berhasil import ${validData.length} data ${jenisLabel}!`);
      setShowImportModal(false);
    } catch (err) {
      alert('Gagal import: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const hasWrongDate = simpanans.some(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      if (!ag || !ag.tanggalJoin) return false;
      // Only fix if date is clearly invalid (default 2024-01-01) AND should match join date
      const isDefaultDate = s.tanggalSimpan === '2024-01-01' || s.tanggalSimpan.startsWith('2024-01-01');
      return isDefaultDate && (s.jenis === 'pokok' || s.jenis === 'wajib');
    });
    if (hasWrongDate) {
      fixSimpananTanggal();
    }
  }, [anggota, simpanans, fixSimpananTanggal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSimpanan(editingId, formData);
      setEditingId(null);
    } else {
      addSimpanan(formData);
      
      const ag = anggota.find(a => a.id === formData.anggotaId);
      addTransaksi({
        jenis: 'simpanan',
        anggotaId: formData.anggotaId,
        referensiId: '',
        jumlah: formData.jumlah,
        tanggal: formData.tanggalSimpan,
        deskripsi: `${formData.jenis} dari ${ag?.nama || '-'}`,
      });
    }
    resetForm();
  };

  const handleEdit = (data: Simpanan) => {
    setFormData({
      anggotaId: data.anggotaId,
      jumlah: data.jumlah,
      jenis: data.jenis,
      tanggalSimpan: data.tanggalSimpan,
      status: data.status,
      jenisPembayaran: data.jenisPembayaran || 'tunai',
      tenor: data.tenor || 12,
      premi: data.premi || 100000,
      bunga: data.bunga || 0,
    });
    setJumlahDisplay(formatRupiahInput(String(data.jumlah)));
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus simpanan ini?')) {
      deleteSimpanan(id);
    }
  };

  const resetForm = () => {
    setFormData({
      anggotaId: '',
      jumlah: 0,
      jenis: 'wajib',
      tanggalSimpan: '2024-01-01',
      status: 'aktif',
      jenisPembayaran: 'tunai',
      tenor: 12,
      premi: 100000,
      bunga: 0,
    });
    setJumlahDisplay('');
    setShowForm(false);
    setEditingId(null);
  };

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');
  const filteredSimpanans = filterJenis === 'all' ? simpanans : simpanans.filter(s => s.jenis === filterJenis);
  
  const simpananWithAnggota = useMemo(() => {
    if (!searchSimpanan.trim()) return filteredSimpanans;
    const query = searchSimpanan.toLowerCase();
    return filteredSimpanans.filter(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      return ag?.nama.toLowerCase().includes(query) || ag?.nomorNBA?.toLowerCase().includes(query);
    });
  }, [filteredSimpanans, searchSimpanan, anggota]);
  
  const sortedSimpanans = [...simpananWithAnggota].sort((a, b) => new Date(b.tanggalSimpan).getTime() - new Date(a.tanggalSimpan).getTime());

  const simpananByAnggota = useMemo(() => {
    return anggotaAktif.map(ag => {
      const sims = simpanans.filter(s => s.anggotaId === ag.id && s.status !== 'ditarik');
      
      // Hitung jumlah per jenis dengan mengurangi penarikan
      const hitungJenis = (jenis: string) => {
        const simJenis = sims.filter(s => s.jenis === jenis);
        const setoran = simJenis.filter(s => s.jenisPembayaran !== 'penarikan').reduce((sum, s) => sum + s.jumlah, 0);
        const penarikan = simJenis.filter(s => s.jenisPembayaran === 'penarikan').reduce((sum, s) => sum + s.jumlah, 0);
        return Math.max(0, setoran - penarikan);
      };
      
      return {
        anggota: ag,
        simpanans: sims,
        pokok: hitungJenis('pokok'),
        wajib: hitungJenis('wajib'),
        sibuhar: hitungJenis('sibuhar'),
        simapan: hitungJenis('simapan'),
        sihat: hitungJenis('sihat'),
        sihar: hitungJenis('sihar'),
        total: hitungJenis('pokok') + hitungJenis('wajib') + hitungJenis('sibuhar') + hitungJenis('simapan') + hitungJenis('sihat') + hitungJenis('sihar'),
      };
    }).filter(a => a.total > 0);
  }, [anggotaAktif, simpanans]);

  const filteredSimpananByAnggota = useMemo(() => {
    if (!searchAnggota.trim()) return simpananByAnggota;
    const query = searchAnggota.toLowerCase();
    return simpananByAnggota.filter(item =>
      item.anggota.nama.toLowerCase().includes(query) ||
      item.anggota.nomorNBA?.toLowerCase().includes(query)
    );
  }, [simpananByAnggota, searchAnggota]);

  const grandTotalByAnggota = useMemo(() => ({
    pokok: filteredSimpananByAnggota.reduce((sum, a) => sum + a.pokok, 0),
    wajib: filteredSimpananByAnggota.reduce((sum, a) => sum + a.wajib, 0),
    sibuhar: filteredSimpananByAnggota.reduce((sum, a) => sum + a.sibuhar, 0),
    simapan: filteredSimpananByAnggota.reduce((sum, a) => sum + a.simapan, 0),
    sihat: filteredSimpananByAnggota.reduce((sum, a) => sum + a.sihat, 0),
    sihar: filteredSimpananByAnggota.reduce((sum, a) => sum + a.sihar, 0),
    total: filteredSimpananByAnggota.reduce((sum, a) => sum + a.total, 0),
  }), [filteredSimpananByAnggota]);

  const simpananByanggotaPage = useMemo(() => {
    const start = (currentPageAnggota - 1) * itemsPerPage;
    return filteredSimpananByAnggota.slice(start, start + itemsPerPage);
  }, [filteredSimpananByAnggota, currentPageAnggota]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Data Simpanan</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📥 Import Excel
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Tutup Form' : '+ Tambah Simpanan'}
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="font-semibold text-lg mb-4">Import Data Simpanan</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pilih Jenis Simpanan</label>
              <select
                value={importJenis}
                onChange={e => setImportJenis(e.target.value)}
                className="border p-2 rounded w-full"
              >
                {jenisSimpananOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                {importJenis === 'sibuhar' ? 'Format Kolom Excel Simpanan Bunga Harian:' : 'Format Kolom Excel:'}
              </p>
              <ul className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2 rounded">
                {importJenis === 'sibuhar' ? (
                  <>
                    <li>- NBA (atau noNBA)</li>
                    <li>- Nama Anggota (atau nama)</li>
                    <li>- Tanggal Transaksi (atau Tanggal)</li>
                    <li>- Jenis Pembayaran (opsional: Tunai, BRI Tigabinanga, BRI Berastagi)</li>
                    <li>- Jumlah Transaksi (atau Jumlah)</li>
                  </>
                ) : (
                  <>
                    <li>- No. NBA (atau noNBA)</li>
                    <li>- Nama Anggota (atau nama)</li>
                    <li>- Nilai Simpanan (atau Jumlah)</li>
                    <li>- Tanggal Transaksi (atau Tanggal)</li>
                    <li>- Status (opsional: aktif, ditarik, aktif_auto)</li>
                  </>
                )}
              </ul>
            </div>
            <a 
              href={importJenis === 'sibuhar' ? '/template_sibuhar.xlsx' : '/template_simpanan.xlsx'}
              download 
              className="text-blue-600 text-sm hover:underline mb-4 inline-block"
            >
              Download Template Excel
            </a>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              className="border p-2 rounded w-full mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterJenis('all')}
            className={`px-3 py-2 rounded text-sm ${filterJenis === 'all' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            Semua ({simpanans.length})
          </button>
          {jenisSimpananOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterJenis(opt.value)}
              className={`px-3 py-2 rounded text-sm ${filterJenis === opt.value ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              {opt.label.split(' ')[0]} ({simpanans.filter(s => s.jenis === opt.value).length})
            </button>
          ))}
          <button
            onClick={() => {
              if (confirm('Samakan tanggal simpanan pokok & wajib dengan tanggal masuk anggota?')) {
                fixSimpananTanggal();
                alert('Tanggal simpanan telah diperbaiki!');
              }
            }}
            className="px-3 py-2 rounded text-sm bg-yellow-500 text-white hover:bg-yellow-600"
          >
            🔧 Perbaiki Tanggal
          </button>
          <button
            onClick={() => {
              const count = simpanans.filter(s => s.jenis === 'sibuhar').length;
              if (confirm(`Hapus semua ${count} data Simpanan Bunga Harian?`)) {
                deleteAllSimpananByJenis('sibuhar');
                alert(`${count} data Simpanan Bunga Harian telah dihapus!`);
              }
            }}
            className="px-3 py-2 rounded text-sm bg-red-500 text-white hover:bg-red-600"
          >
            🗑️ Hapus SBH
          </button>
          <input
            type="text"
            placeholder="Cari NBA atau Nama..."
            value={searchSimpanan}
            onChange={e => {
              setSearchSimpanan(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded text-sm w-48 ml-auto"
          />
        </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Simpanan' : 'Tambah Simpanan Baru'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={formData.anggotaId}
              onChange={e => setFormData({ ...formData, anggotaId: e.target.value })}
              className="border p-2 rounded"
              required
            >
              <option value="">Pilih Anggota</option>
              {anggotaAktif.map(a => (
                <option key={a.id} value={a.id}>{a.nama}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Jumlah (contoh: 500.000)"
              value={jumlahDisplay}
              onChange={e => {
                const num = parseRupiah(e.target.value);
                setJumlahDisplay(formatRupiahInput(e.target.value));
                setFormData({ ...formData, jumlah: num });
              }}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.jenis}
              onChange={e => {
                const opt = jenisSimpananOptions.find(o => o.value === e.target.value);
                setFormData({ ...formData, jenis: e.target.value as typeof formData.jenis, bunga: opt?.bunga || 0, tenor: opt?.tenor || 12 });
              }}
              className="border p-2 rounded"
            >
              {jenisSimpananOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.tanggalSimpan}
              onChange={e => setFormData({ ...formData, tanggalSimpan: e.target.value })}
              className="border p-2 rounded"
            />
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
              className="border p-2 rounded"
            >
              <option value="aktif">Aktif</option>
              <option value="aktif_auto">Aktif Auto</option>
              <option value="ditarik">Ditarik</option>
            </select>
            <select
              value={formData.jenisPembayaran}
              onChange={e => setFormData({ ...formData, jenisPembayaran: e.target.value as typeof formData.jenisPembayaran })}
              className="border p-2 rounded"
            >
              {jenisPembayaranOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {simpananByAnggota.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg">Rekapitulasi Simpanan per Anggota</h2>
            <input
              type="text"
              placeholder="Cari NBA atau Nama Anggota..."
              value={searchAnggota}
              onChange={e => {
                setSearchAnggota(e.target.value);
                setCurrentPageAnggota(1);
              }}
              className="border p-2 rounded text-sm w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-center p-3 border-b min-w-[40px]">No</th>
                  <th className="text-center p-3 border-b min-w-[80px]">NBA</th>
                  <th className="text-left p-3 border-b min-w-[150px]">Nama Anggota</th>
                  <th className="text-right p-3 border-b min-w-[120px]">Pokok</th>
                  <th className="text-right p-3 border-b min-w-[120px]">Wajib</th>
                  <th className="text-right p-3 border-b min-w-[120px]">SBH</th>
                  <th className="text-right p-3 border-b min-w-[120px]">Simapan</th>
                  <th className="text-right p-3 border-b min-w-[120px]">Sihat</th>
                  <th className="text-right p-3 border-b min-w-[120px]">Sihar</th>
                  <th className="text-right p-3 border-b min-w-[140px] bg-green-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSimpananByAnggota.length === 0 ? (
                  <tr>
<td colSpan={11} className="text-center p-4 text-slate-500">Belum ada simpanan</td>
                  </tr>
                ) : (
                  simpananByanggotaPage.map((item, index) => {
                    const globalIndex = (currentPageAnggota - 1) * itemsPerPage + index;
                    return (
                      <tr key={item.anggota.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-500">{globalIndex + 1}</td>
                        <td className="p-3 text-center font-medium">{item.anggota.nomorNBA}</td>
                        <td className="p-3 font-medium">{item.anggota.nama}</td>
                        <td className="p-3 text-right">{item.pokok > 0 ? formatRupiah(item.pokok) : '-'}</td>
                        <td className="p-3 text-right">{item.wajib > 0 ? formatRupiah(item.wajib) : '-'}</td>
                        <td className="p-3 text-right">{item.sibuhar > 0 ? formatRupiah(item.sibuhar) : '-'}</td>
                        <td className="p-3 text-right">{item.simapan > 0 ? formatRupiah(item.simapan) : '-'}</td>
                        <td className="p-3 text-right">{item.sihat > 0 ? formatRupiah(item.sihat) : '-'}</td>
                        <td className="p-3 text-right">{item.sihar > 0 ? formatRupiah(item.sihar) : '-'}</td>
                        <td className="p-3 text-right font-semibold bg-green-50">{formatRupiah(item.total)}</td>
                      </tr>
                    );
                  })
                )}
                {filteredSimpananByAnggota.length > 0 && (
                  <tr className="bg-green-100 font-bold">
                    <td className="p-3 text-center" colSpan={3}>TOTAL</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.pokok)}</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.wajib)}</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.sibuhar)}</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.simapan)}</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.sihat)}</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.sihar)}</td>
                    <td className="p-3 text-right">{formatRupiah(grandTotalByAnggota.total)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredSimpananByAnggota.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 p-4 border-t">
              <button
                onClick={() => setCurrentPageAnggota(p => Math.max(1, p - 1))}
                disabled={currentPageAnggota === 1}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                &lt;
              </button>
              <span className="text-sm text-slate-600">
                Halaman {currentPageAnggota} dari {Math.ceil(filteredSimpananByAnggota.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPageAnggota(p => Math.min(Math.ceil(filteredSimpananByAnggota.length / itemsPerPage), p + 1))}
                disabled={currentPageAnggota >= Math.ceil(filteredSimpananByAnggota.length / itemsPerPage)}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-center p-3 w-12">No</th>
              <th className="text-center p-3 w-16">NBA</th>
              <th className="text-left p-3">Tanggal</th>
              <th className="text-left p-3">Nama Anggota</th>
              <th className="text-left p-3">Jenis Simpanan</th>
              <th className="text-right p-3">Jumlah</th>
              {filterJenis === 'all' || filterJenis === 'sibuhar' || filterJenis === 'simapan' || filterJenis === 'sihat' || filterJenis === 'sihar' ? (
                <>
                  <th className="text-right p-3">Bunga</th>
                  <th className="text-right p-3">Tenor</th>
                </>
              ) : null}
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Jenis Transaksi</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredSimpanans.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4 text-slate-500">Belum ada simpanan</td>
              </tr>
            ) : (
              sortedSimpanans
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((s, index) => {
                  const ag = anggota.find(a => a.id === s.anggotaId);
                  const showBungaTenor = s.jenis === 'sibuhar' || s.jenis === 'simapan' || s.jenis === 'sihat' || s.jenis === 'sihar';
                  const pageIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
<tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-500">{pageIndex}</td>
                      <td className="p-3 text-center">{ag?.nomorNBA || '-'}</td>
                      <td className="p-3">{formatDate(s.tanggalSimpan)}</td>
                      <td className="p-3 font-medium">{ag?.nama || '-'}</td>
                    <td className="p-3 capitalize">{s.jenis}</td>
                    <td className="p-3 text-right">{formatRupiah(s.jumlah)}</td>
                    {showBungaTenor ? (
                      <>
                        <td className="p-3 text-right">{s.bunga || 0}%</td>
                        <td className="p-3 text-right">{s.tenor || '-'} bln</td>
                      </>
                    ) : (
                      filterJenis === 'all' ? (
                        <>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">-</td>
                        </>
                      ) : null
                    )}
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.status === 'aktif' ? 'bg-green-100 text-green-800' : s.status === 'aktif_auto' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{jenisPembayaranOptions.find(o => o.value === s.jenisPembayaran)?.label || '-'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {sortedSimpanans.length > itemsPerPage && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-sm text-slate-600">
              Halaman {currentPage} dari {Math.ceil(sortedSimpanans.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedSimpanans.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(sortedSimpanans.length / itemsPerPage)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}