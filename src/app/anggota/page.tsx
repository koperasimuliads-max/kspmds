'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Anggota } from '@/types';
import * as XLSX from 'xlsx';

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
  { value: 'pns', label: 'PNS' },
  { value: 'tni_polri', label: 'TNI/Polri' },
  { value: 'karyawan_swasta', label: 'Karyawan Swasta' },
  { value: 'karyawan_negeri', label: 'Karyawan Negeri' },
  { value: 'wiraswasta', label: 'Wiraswasta' },
  { value: 'petani', label: 'Petani' },
  { value: 'nelayan', label: 'Nelayan' },
  { value: 'pedagang', label: 'Pedagang' },
  { value: 'tukang', label: 'Tukang' },
  { value: 'sopir', label: 'Sopir' },
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
  const { anggota, addAnggota, updateAnggota, deleteAnggota, clearAllAnggota, bulkUpdateTanggalJoin } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showTanggalForm, setShowTanggalForm] = useState(false);
  const [tanggalForm, setTanggalForm] = useState({ startNBA: 1, endNBA: 25, tanggal: '2023-11-09' });
  
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  
  const getLabel = (options: {value: string, label: string}[], value: string) => options.find(o => o.value === value)?.label || value;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAnggota(editingId, formData);
      setEditingId(null);
    } else {
      addAnggota(formData);
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
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus anggota ini? Semua data pinjaman dan simpanan juga akan dihapus.')) {
      deleteAnggota(id);
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
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Data Anggota</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm(`Hapus SEMUA ${anggota.length} anggota? Semua data pinjaman dan simpanan juga akan dihapus.`)) {
                clearAllAnggota();
                alert('Semua data anggota telah dihapus. Silakan Import ulang.');
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Hapus Semua ({anggota.length})
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            {showImport ? 'Tutup' : '+ Import CSV'}
          </button>
          <button
            onClick={() => setShowTanggalForm(!showTanggalForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            {showTanggalForm ? 'Tutup' : 'Update Tgl Masuk'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Tutup Form' : '+ Tambah Anggota'}
          </button>
        </div>
      </div>

      {showTanggalForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
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
            <a href="/contoh_import_anggota.csv" download className="inline-block mt-2 text-blue-700 underline text-xs">Download contoh CSV (format: dd-mm-yyyy)</a>
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
                <input type="text" placeholder="Nama Pasangan" value={formData.namaPasangan} onChange={e => setFormData({ ...formData, namaPasangan: e.target.value })} className="border p-2 rounded" />
                <select value={formData.jumlahAnak} onChange={e => setFormData({ ...formData, jumlahAnak: e.target.value })} className="border p-2 rounded">
                  {jumlahAnakOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="text" placeholder="Nama Ibu Kandung" value={formData.namaIbuKandung} onChange={e => setFormData({ ...formData, namaIbuKandung: e.target.value })} className="border p-2 rounded" />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Alamat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Alamat (KTP)" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="border p-2 rounded" required />
                <input type="text" placeholder="Alamat Domisili" value={formData.alamatDomisili} onChange={e => setFormData({ ...formData, alamatDomisili: e.target.value })} className="border p-2 rounded" />
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
                <input type="number" placeholder="Simpanan Pokok" value={formData.simpananPokok || ''} onChange={e => setFormData({ ...formData, simpananPokok: Number(e.target.value) })} className="border p-2 rounded" />
                <input type="number" placeholder="Simpanan Wajib" value={formData.simpananWajib || ''} onChange={e => setFormData({ ...formData, simpananWajib: Number(e.target.value) })} className="border p-2 rounded" />
                <input type="number" placeholder="Uang Buku" value={formData.uangBuku || ''} onChange={e => setFormData({ ...formData, uangBuku: Number(e.target.value) })} className="border p-2 rounded" />
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
                <th className="text-left p-2">Tanggal Masuk</th>
                <th className="text-left p-2">Nama</th>
                <th className="text-left p-2">NIK</th>
                <th className="text-left p-2">NBA</th>
                <th className="text-left p-2">JK</th>
                <th className="text-left p-2">TTL</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Pekerjaan</th>
                <th className="text-right p-2">Simpanan Pokok</th>
                <th className="text-right p-2">Simpanan Wajib</th>
                <th className="text-right p-2">Uang Buku</th>
                <th className="text-center p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {anggota.length === 0 ? (
                <tr><td colSpan={12} className="text-center p-4 text-slate-500">Belum ada anggota</td></tr>
              ) : (
                anggota.map(a => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{a.tanggalJoin ? new Date(a.tanggalJoin).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="p-2 font-medium">{a.nama}</td>
                    <td className="p-2">{a.nik}</td>
                    <td className="p-2">{a.nomorNBA || '-'}</td>
                    <td className="p-2">{a.jenisKelamin === 'L' ? 'L' : 'P'}</td>
                    <td className="p-2 text-xs">{a.tempatLahir ? `${a.tempatLahir}, ${a.tanggalLahir ? new Date(a.tanggalLahir).toLocaleDateString('id-ID') : '-'}` : '-'}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span></td>
                    <td className="p-2">{a.pekerjaan ? getLabel(pekerjaanOptions, a.pekerjaan) : '-'}</td>
                    <td className="p-2 text-right">{formatRupiah(a.simpananPokok)}</td>
                    <td className="p-2 text-right">{formatRupiah(a.simpananWajib)}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>{formatRupiah(a.uangBuku)}</span>
                        <button 
                          onClick={() => {
                            const newUangBuku = prompt(`Ubah Uang Buku untuk ${a.nama}:`, String(a.uangBuku || 0));
                            if (newUangBuku !== null) {
                              updateAnggota(a.id, { uangBuku: Number(newUangBuku) || 0 });
                            }
                          }}
                          className="text-xs text-blue-600 hover:underline ml-1"
                          title="Klik untuk ubah"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}