'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
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

export default function PendapatanPage() {
  const { anggota, pendapatans, updatePendapatan, addPendapatan } = useKSP();
  const [editingPendapatan, setEditingPendapatan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ jumlah: 0, deskripsi: '' });
  const [showTambah, setShowTambah] = useState(false);
  const [tambahForm, setTambahForm] = useState({ jenis: 'uang_buku', deskripsi: '', jumlah: 0, tanggal: '2024-01-01' });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentPagePendapatan, setCurrentPagePendapatan] = useState(1);
  const [currentPageUangBuku, setCurrentPageUangBuku] = useState(1);
  const itemsPerPage = 20;

  const allTahun = Array.from(new Set([
    ...pendapatans.map(p => new Date(p.tanggal).getFullYear()),
  ])).sort((a, b) => b - a);

  const filteredPendapatans = selectedYear ? pendapatans.filter(p => new Date(p.tanggal).getFullYear() === selectedYear) : pendapatans;
  const sortedPendapatans = [...filteredPendapatans].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const uangBukuTotal = 0;
  const anggotaWithUangBuku: typeof anggota = [];
  const totalPendapatan = filteredPendapatans.reduce((sum, p) => sum + p.jumlah, 0);

  const handleEditStart = (id: string, currentJumlah: number, currentDeskripsi: string) => {
    setEditForm({ jumlah: currentJumlah, deskripsi: currentDeskripsi || '' });
    setEditingPendapatan(id);
  };

  const handleSaveEdit = (id: string) => {
    if (editForm.jumlah <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    updatePendapatan(id, { jumlah: editForm.jumlah, deskripsi: editForm.deskripsi });
    setEditingPendapatan(null);
  };

  const handleCancelEdit = () => {
    setEditingPendapatan(null);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 no-print">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Pendapatan</h1>
        {allTahun.length > 0 && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="ml-auto border p-2 rounded"
          >
            {allTahun.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 mb-4 no-print">
        <button
          onClick={() => setShowTambah(!showTambah)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showTambah ? 'Tutup' : '+ Tambah Pendapatan'}
        </button>
      </div>

      {showTambah && (
        <div className="bg-white p-4 rounded-lg shadow mb-4 no-print">
          <h3 className="font-semibold mb-3">Tambah Pendapatan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={tambahForm.jenis}
              onChange={e => setTambahForm({ ...tambahForm, jenis: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="uang_buku">Uang Buku</option>
              <option value="administrasi_pengunduran_diri">Admin Pengunduran Diri</option>
              <option value="bunga_pinjaman">Bunga Pinjaman</option>
              <option value="lainnya">Lainnya</option>
            </select>
            <input
              type="text"
              placeholder="Deskripsi"
              value={tambahForm.deskripsi}
              onChange={e => setTambahForm({ ...tambahForm, deskripsi: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Jumlah"
              value={tambahForm.jumlah || ''}
              onChange={e => setTambahForm({ ...tambahForm, jumlah: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (tambahForm.jumlah <= 0) {
                    alert('Jumlah harus lebih dari 0');
                    return;
                  }
                  addPendapatan({
                    jenis: tambahForm.jenis,
                    deskripsi: tambahForm.deskripsi || `${tambahForm.jenis.replace('_', ' ')} - ${tambahForm.tanggal}`,
                    jumlah: tambahForm.jumlah,
                    tanggal: tambahForm.tanggal,
                  });
                  setTambahForm({ jenis: 'uang_buku', deskripsi: '', jumlah: 0, tanggal: '2024-01-01' });
                  setShowTambah(false);
                  alert('Pendapatan berhasil ditambahkan!');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Simpan
              </button>
              <input
                type="date"
                value={tambahForm.tanggal}
                onChange={e => setTambahForm({ ...tambahForm, tanggal: e.target.value })}
                className="border p-2 rounded"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Uang Buku (dari Anggota)</p>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(uangBukuTotal)}</p>
          <p className="text-sm text-slate-500">{anggotaWithUangBuku.length} anggota</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Total Pendapatan {selectedYear ? `(${selectedYear})` : ''}</p>
          <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalPendapatan)}</p>
          <p className="text-sm text-slate-500">{sortedPendapatans.length} transaksi</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">Daftar Pendapatan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-center p-2 w-12">No</th>
                <th className="text-left p-2">Tanggal</th>
                <th className="text-left p-2">Jenis</th>
                <th className="text-left p-2">Deskripsi</th>
                <th className="text-right p-2">Jumlah</th>
                <th className="text-center p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedPendapatans.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4 text-slate-500">Belum ada pendapatan</td></tr>
              ) : (
                sortedPendapatans
                  .slice((currentPagePendapatan - 1) * itemsPerPage, currentPagePendapatan * itemsPerPage)
                  .map((p, index) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{(currentPagePendapatan - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-2">{formatDate(p.tanggal)}</td>
                      <td className="p-2 capitalize">{p.jenis.replace('_', ' ')}</td>
                      <td className="p-2">
                        {editingPendapatan === p.id ? (
                          <input
                            type="text"
                            value={editForm.deskripsi}
                            onChange={e => setEditForm({ ...editForm, deskripsi: e.target.value })}
                            className="border p-1 rounded w-full"
                          />
                        ) : (
                          p.deskripsi || '-'
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {editingPendapatan === p.id ? (
                          <input
                            type="number"
                            value={editForm.jumlah}
                            onChange={e => setEditForm({ ...editForm, jumlah: Number(e.target.value) })}
                            className="border p-1 rounded w-24 text-right"
                          />
                        ) : (
                          formatRupiah(p.jumlah)
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {editingPendapatan === p.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleSaveEdit(p.id)} className="text-green-600 hover:underline text-xs">Simpan</button>
                            <button onClick={handleCancelEdit} className="text-gray-600 hover:underline text-xs">Batal</button>
                          </div>
                        ) : (
                          <button onClick={() => handleEditStart(p.id, p.jumlah, p.deskripsi)} className="text-blue-600 hover:underline">Edit</button>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
          {sortedPendapatans.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 p-3 border-t">
              <button
                onClick={() => setCurrentPagePendapatan(p => Math.max(1, p - 1))}
                disabled={currentPagePendapatan === 1}
                className="px-2 py-1 rounded border bg-white text-sm disabled:opacity-50"
              >
                &lt;
              </button>
              <span className="text-xs text-slate-600">
                {currentPagePendapatan} / {Math.ceil(sortedPendapatans.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPagePendapatan(p => Math.min(Math.ceil(sortedPendapatans.length / itemsPerPage), p + 1))}
                disabled={currentPagePendapatan >= Math.ceil(sortedPendapatans.length / itemsPerPage)}
                className="px-2 py-1 rounded border bg-white text-sm disabled:opacity-50"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}