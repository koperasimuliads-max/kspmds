'use client';

import { useState, useRef } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Pinjaman } from '@/types';
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

function hitungKolektibilitas(hariTerlambat: number): 'lancar' | 'kurang_lancar' | 'diragukan' | 'macet' {
  if (hariTerlambat <= 90) return 'lancar';
  if (hariTerlambat <= 120) return 'kurang_lancar';
  if (hariTerlambat <= 180) return 'diragukan';
  return 'macet';
}

function hitungKategoriKesehatan(npl: number): { nilai: number; kategori: string } {
  if (npl < 5) return { nilai: 1, kategori: 'Sehat' };
  if (npl <= 10) return { nilai: 2, kategori: 'Cukup Sehat' };
  if (npl <= 15) return { nilai: 3, kategori: 'Kurang Sehat' };
  return { nilai: 4, kategori: 'Tidak Sehat' };
}

export default function PinjamanPage() {
  const { anggota, pinjamans, addPinjaman, updatePinjaman, deletePinjaman, addTransaksi } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [showBayar, setShowBayar] = useState<string | null>(null);
  const [showHitung, setShowHitung] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    anggotaId: '',
    jumlah: 0,
    bunga: 12,
    tenor: 12,
    tanggalPinjaman: '2024-01-01',
    status: 'aktif' as 'aktif' | 'lunas' | 'macet',
    cicilanPerBulan: 0,
    totalPembayaran: 0,
    sudahDibayar: 0,
    hariTerlambat: 0,
    kolektibilitas: 'lancar' as 'lancar' | 'kurang_lancar' | 'diragukan' | 'macet',
    kategoriKesehatan: 'sehat' as 'sehat' | 'cukup_sehat' | 'kurang_sehat' | 'tidak_sehat',
    tipePinjaman: 'flat' as 'flat' | 'musiman',
  });
  const [jumlahBayar, setJumlahBayar] = useState(0);
  const [hariTerlambatInput, setHariTerlambatInput] = useState(0);
  const [jumlahDisplay, setJumlahDisplay] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const hitungCicilan = (jumlah: number, bunga: number, tenor: number, tipe: string) => {
    if (tipe === 'musiman') {
      const bungaPerBulan = bunga / 100;
      return Math.round(jumlah * bungaPerBulan);
    }
    const bungaPerBulan = bunga / 100 / 12;
    const cicilan = (jumlah * bungaPerBulan * Math.pow(1 + bungaPerBulan, tenor)) / (Math.pow(1 + bungaPerBulan, tenor) - 1);
    return Math.round(cicilan);
  };

  const hitungNPL = () => {
    const totalPinjamanAktif = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
    const totalPinjamanBermasalah = pinjamans.filter(p => p.status === 'aktif' && (p.kolektibilitas === 'kurang_lancar' || p.kolektibilitas === 'diragukan' || p.kolektibilitas === 'macet')).reduce((sum, p) => sum + p.jumlah, 0);
    if (totalPinjamanAktif === 0) return 0;
    return (totalPinjamanBermasalah / totalPinjamanAktif) * 100;
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

      let count = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of json) {
        const noNBA = String(row['No. NBA'] || row['noNBA'] || '').trim();
        const nama = String(row['Nama Anggota'] || row['nama'] || '').trim();
        const jumlah = Number(row['Sisa Pokok'] || row['outstanding_principal'] || row['Jumlah'] || row['jumlah'] || 0);
        
        const jenisPinjaman = String(row['Jenis Pinjaman'] || row['loan_type'] || row['Jenis'] || '').toLowerCase();
        let tipePinjaman: 'flat' | 'musiman' = 'flat';
        if (jenisPinjaman.includes('musiman')) {
          tipePinjaman = 'musiman';
        } else if (jenisPinjaman.includes('flat')) {
          tipePinjaman = 'flat';
        }

        const bunga = Number(row['Bunga (%)'] || row['interest_rate'] || row['Bunga'] || 12);

        if (!noNBA && !nama) continue;

        const ag = anggota.find(a => 
          (noNBA && a.nomorNBA === noNBA) || 
          (nama && a.nama.toLowerCase() === nama.toLowerCase())
        );

        if (!ag) {
          errorCount++;
          errors.push(`Tidak ditemukan: ${nama || noNBA}`);
          continue;
        }

        const tanggalPinjaman = '2025-12-31';
        const tenor = 12;
        const cicilan = hitungCicilan(jumlah, bunga, tenor, tipePinjaman);

        addPinjaman({
          anggotaId: ag.id,
          jumlah: jumlah,
          bunga: bunga,
          tenor: tenor,
          tanggalPinjaman: tanggalPinjaman,
          status: 'aktif',
          cicilanPerBulan: cicilan,
          totalPembayaran: tipePinjaman === 'musiman' ? cicilan * tenor : cicilan * tenor,
          sudahDibayar: 0,
          hariTerlambat: 0,
          kolektibilitas: 'lancar',
          kategoriKesehatan: 'sehat',
          tipePinjaman: tipePinjaman,
          isSaldoAwal: true,
        });
        count++;
      }

      if (errorCount > 0) {
        alert(`Berhasil import: ${count}\nGagal: ${errorCount}\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
      } else {
        alert(`Berhasil import ${count} data pinjaman!`);
      }
      setShowImportModal(false);
    } catch (err) {
      alert('Gagal import: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cicilan = hitungCicilan(formData.jumlah, formData.bunga, formData.tenor, formData.tipePinjaman || 'flat');
    const total = cicilan * formData.tenor;
    const kolek = hitungKolektibilitas(formData.hariTerlambat);
    
    const data = {
      ...formData,
      cicilanPerBulan: cicilan,
      totalPembayaran: total,
      kolektibilitas: kolek,
    };
    
    if (editingId) {
      updatePinjaman(editingId, data);
      setEditingId(null);
    } else {
      addPinjaman(data);
      
      const ag = anggota.find(a => a.id === formData.anggotaId);
      addTransaksi({
        jenis: 'pinjaman',
        anggotaId: formData.anggotaId,
        referensiId: '',
        jumlah: formData.jumlah,
        tanggal: formData.tanggalPinjaman,
        deskripsi: `Pinjaman dari ${ag?.nama || '-'}`,
      });
    }
    resetForm();
  };

  const handleEdit = (data: Pinjaman) => {
    setFormData({
      anggotaId: data.anggotaId,
      jumlah: data.jumlah,
      bunga: data.bunga,
      tenor: data.tenor,
      tanggalPinjaman: data.tanggalPinjaman,
      status: data.status,
      cicilanPerBulan: data.cicilanPerBulan,
      totalPembayaran: data.totalPembayaran,
      sudahDibayar: data.sudahDibayar,
      hariTerlambat: data.hariTerlambat || 0,
      kolektibilitas: data.kolektibilitas || 'lancar',
      kategoriKesehatan: data.kategoriKesehatan || 'sehat',
      tipePinjaman: data.tipePinjaman || 'flat',
    });
    setJumlahDisplay(formatRupiahInput(String(data.jumlah)));
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus pinjaman ini?')) {
      deletePinjaman(id);
    }
  };

  const handleBayar = (pinjaman: Pinjaman) => {
    if (jumlahBayar > 0) {
      addTransaksi({
        jenis: 'pembayaran',
        anggotaId: pinjaman.anggotaId,
        referensiId: pinjaman.id,
        jumlah: jumlahBayar,
        tanggal: '2024-01-01',
        deskripsi: `Pembayaran cicilan pinjaman`,
      });
      setShowBayar(null);
      setJumlahBayar(0);
    }
  };

  const handleHitungKolek = () => {
    const kolek = hitungKolektibilitas(hariTerlambatInput);
    const npl = hitungNPL();
    const kesehatan = hitungKesehatan(npl);
    setFormData({
      ...formData,
      hariTerlambat: hariTerlambatInput,
      kolektibilitas: kolek,
      kategoriKesehatan: kesehatan,
    });
    setShowHitung(null);
  };

  const hitungKesehatan = (npl: number): 'sehat' | 'cukup_sehat' | 'kurang_sehat' | 'tidak_sehat' => {
    if (npl < 5) return 'sehat';
    if (npl <= 10) return 'cukup_sehat';
    if (npl <= 15) return 'kurang_sehat';
    return 'tidak_sehat';
  };

  const resetForm = () => {
    setFormData({
      anggotaId: '',
      jumlah: 0,
      bunga: 12,
      tenor: 12,
      tanggalPinjaman: '2024-01-01',
      status: 'aktif',
      cicilanPerBulan: 0,
      totalPembayaran: 0,
      sudahDibayar: 0,
      hariTerlambat: 0,
      kolektibilitas: 'lancar',
      kategoriKesehatan: 'sehat',
      tipePinjaman: 'flat',
    });
    setJumlahDisplay('');
    setShowForm(false);
    setEditingId(null);
  };

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');
  const sortedPinjamans = [...pinjamans].sort((a, b) => new Date(b.tanggalPinjaman).getTime() - new Date(a.tanggalPinjaman).getTime());
  const npl = hitungNPL();
  const kesehatan = hitungNPL() > 0 ? hitungKategoriKesehatan(hitungNPL()) : { nilai: 1, kategori: 'Sehat' };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Data Pinjaman</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Tutup Form' : '+ Ajukan Pinjaman'}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            📥 Import Saldo Akhir 2025
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold mb-2">Kesehatan Pinjaman (NPL)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-slate-500">Total Pinjaman Aktif</p>
            <p className="font-bold">{formatRupiah(pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0))}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-slate-500">NPL (%)</p>
            <p className="font-bold text-red-600">{npl.toFixed(2)}%</p>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-slate-500">Nilai</p>
            <p className="font-bold">{kesehatan.nilai}</p>
          </div>
          <div className={`p-2 rounded ${kesehatan.kategori === 'Sehat' ? 'bg-green-100' : kesehatan.kategori === 'Cukup Sehat' ? 'bg-blue-100' : kesehatan.kategori === 'Kurang Sehat' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            <p className="text-slate-500">Kategori</p>
            <p className="font-bold">{kesehatan.kategori}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Pinjaman' : 'Ajukan Pinjaman Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                placeholder="Jumlah Pinjaman (contoh: 10.000.000)"
                value={jumlahDisplay}
                onChange={e => {
                  const num = parseRupiah(e.target.value);
                  setJumlahDisplay(formatRupiahInput(e.target.value));
                  setFormData({ ...formData, jumlah: num });
                }}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Bunga (% per tahun)"
                value={formData.bunga}
                onChange={e => setFormData({ ...formData, bunga: Number(e.target.value) })}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Tenor (bulan)"
                value={formData.tenor}
                onChange={e => setFormData({ ...formData, tenor: Number(e.target.value) })}
                className="border p-2 rounded"
                required
              />
              <select
                value={formData.tipePinjaman || 'flat'}
                onChange={e => setFormData({ ...formData, tipePinjaman: e.target.value as 'flat' | 'musiman' })}
                className="border p-2 rounded"
              >
                <option value="flat">Flat (Angsuran Tetap)</option>
                <option value="musiman">Musiman (Bunga Saja)</option>
              </select>
              <input
                type="date"
                value={formData.tanggalPinjaman}
                onChange={e => setFormData({ ...formData, tanggalPinjaman: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <div className="flex items-center gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                  Batal
                </button>
              </div>
            </div>
            {formData.jumlah > 0 && formData.bunga > 0 && formData.tenor > 0 && (
              <div className="mt-3 p-3 bg-slate-100 rounded">
                <p>Estimasi Cicilan per Bulan: <strong>{formatRupiah(hitungCicilan(formData.jumlah, formData.bunga, formData.tenor, formData.tipePinjaman || 'flat'))}</strong></p>
                <p>Total Pembayaran: <strong>{formatRupiah(hitungCicilan(formData.jumlah, formData.bunga, formData.tenor, formData.tipePinjaman || 'flat') * formData.tenor)}</strong></p>
              </div>
            )}
          </form>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">Hitung Kolektibilitas & Kesehatan Pinjaman</h4>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Hari Terlambat"
                value={hariTerlambatInput || ''}
                onChange={e => setHariTerlambatInput(Number(e.target.value))}
                className="border p-2 rounded w-40"
              />
              <button
                type="button"
                onClick={handleHitungKolek}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Hitung
              </button>
              {formData.hariTerlambat > 0 && (
                <span className="ml-2 text-sm">
                  Kolektibilitas: <strong>{formData.kolektibilitas === 'lancar' ? 'Lancar' : formData.kolektibilitas === 'kurang_lancar' ? 'Kurang Lancar' : formData.kolektibilitas === 'diragukan' ? 'Diragukan' : 'Macet'}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kolektibilitas: Lancar (0-90 hari), Kurang Lancar (91-120 hari), Diragukan (121-180 hari), Macet ({'>'}180 hari)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-center p-2 w-12">No</th>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Nama Anggota</th>
              <th className="text-right p-2">Jumlah Pinjaman</th>
              <th className="text-right p-2">Bunga</th>
              <th className="text-right p-2">Tenor</th>
              <th className="text-right p-2">Cicilan/Bulan</th>
              <th className="text-right p-2">Dibayar</th>
              <th className="text-left p-2">Kolek</th>
              <th className="text-left p-2">Status</th>
              <th className="text-center p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pinjamans.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4 text-slate-500">Belum ada pinjaman</td>
              </tr>
            ) : (
              sortedPinjamans
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((p, index) => {
                  const ag = anggota.find(a => a.id === p.anggotaId);
                  const kolekLabel = p.kolektibilitas === 'lancar' ? 'Lancar' : p.kolektibilitas === 'kurang_lancar' ? 'Kurang Lancar' : p.kolektibilitas === 'diragukan' ? 'Diragukan' : 'Macet';
                  const pageIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{pageIndex}</td>
                    <td className="p-2">{formatDate(p.tanggalPinjaman)}</td>
                    <td className="p-2 font-medium">{ag?.nama || '-'}</td>
                    <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                    <td className="p-2 text-right">{p.bunga}%</td>
                    <td className="p-2 text-right">{p.tenor} bln</td>
                    <td className="p-2 text-right">{formatRupiah(p.cicilanPerBulan)}</td>
                    <td className="p-2 text-right">{formatRupiah(p.sudahDibayar)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.kolektibilitas === 'lancar' ? 'bg-green-100 text-green-800' :
                        p.kolektibilitas === 'kurang_lancar' ? 'bg-yellow-100 text-yellow-800' :
                        p.kolektibilitas === 'diragukan' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {kolekLabel}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'aktif' ? 'bg-blue-100 text-blue-800' : 
                        p.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {p.status === 'aktif' && (
                        <button onClick={() => setShowBayar(p.id)} className="text-green-600 hover:underline mr-2">Bayar</button>
                      )}
                      <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {sortedPinjamans.length > itemsPerPage && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-sm text-slate-600">
              Halaman {currentPage} dari {Math.ceil(sortedPinjamans.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedPinjamans.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(sortedPinjamans.length / itemsPerPage)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {showBayar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="font-semibold mb-3">Pembayaran Cicilan</h3>
            {(() => {
              const p = pinjamans.find(pin => pin.id === showBayar);
              if (!p) return null;
              const ag = anggota.find(a => a.id === p.anggotaId);
              return (
                <>
                  <p className="mb-2">Anggota: {ag?.nama}</p>
                  <p className="mb-2">Sisa Pembayaran: {formatRupiah(p.totalPembayaran - p.sudahDibayar)}</p>
                  <input
                    type="number"
                    placeholder="Jumlah Pembayaran"
                    value={jumlahBayar || ''}
                    onChange={e => setJumlahBayar(Number(e.target.value))}
                    className="border p-2 rounded w-full mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleBayar(p)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      Bayar
                    </button>
                    <button onClick={() => { setShowBayar(null); setJumlahBayar(0); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                      Batal
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="font-semibold text-lg mb-4">Import Saldo Akhir 2025</h2>
            <p className="text-sm text-slate-600 mb-2">Format Kolom Excel/CSV:</p>
            <ul className="text-xs text-slate-500 mb-2 space-y-1">
              <li>- <strong>No. NBA</strong> atau <strong>Nama Anggota</strong></li>
              <li>- <strong>Jenis Pinjaman</strong> = &quot;Flat&quot; atau &quot;Musiman&quot;</li>
              <li>- <strong>Sisa Pokok</strong> = angka (tanpa titik/koma)</li>
              <li>- <strong>Bunga (%)</strong> = 12 untuk Flat, 30 untuk Musiman (2.5% x 12 bulan)</li>
            </ul>
            <a 
              href="/template_pinjaman.xlsx" 
              download 
              className="text-blue-600 text-sm hover:underline mb-4 inline-block"
            >
              📥 Download Template Excel
            </a>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              ref={fileInputRef}
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
    </div>
  );
}