'use client';

import { useState, useMemo } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Transaksi } from '@/types';

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

export default function TransaksiPage() {
  const { anggota, pinjamans, simpanans, transactions, addTransaksi, deleteTransaksi, getAnggotaById } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');
  const [formData, setFormData] = useState({
    jenis: 'simpanan' as 'pinjaman' | 'simpanan' | 'pembayaran' | 'penarikan' | 'pendapatan',
    anggotaId: '',
    jumlah: 0,
    tanggal: '2024-01-01',
    deskripsi: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.anggotaId) {
      alert('Pilih anggota terlebih dahulu');
      return;
    }
    if (formData.jumlah <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    addTransaksi({
      jenis: formData.jenis,
      anggotaId: formData.anggotaId,
      referensiId: '',
      jumlah: formData.jumlah,
      tanggal: formData.tanggal,
      deskripsi: formData.deskripsi || `${formData.jenis} - ${getAnggotaById(formData.anggotaId)?.nama || '-'}`,
    });
    setFormData({
      jenis: 'simpanan',
      anggotaId: '',
      jumlah: 0,
      tanggal: '2024-01-01',
      deskripsi: '',
    });
    setShowForm(false);
  };

  const allTransaksi = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [transactions]);

  const filteredTransaksi = useMemo(() => {
    let result = allTransaksi;
    
    if (filterTanggal) {
      result = result.filter(t => t.tanggal.startsWith(filterTanggal));
    }
    
    if (filterJenis !== 'all') {
      result = result.filter(t => t.jenis === filterJenis);
    }
    
    return result;
  }, [allTransaksi, filterTanggal, filterJenis]);

  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: Transaksi[] } = {};
    filteredTransaksi.forEach(t => {
      const dateKey = t.tanggal;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredTransaksi]);

  const totalPerHari = useMemo(() => {
    const totals: { [key: string]: { masuk: number; keluar: number } } = {};
    filteredTransaksi.forEach(t => {
      const dateKey = t.tanggal;
      if (!totals[dateKey]) {
        totals[dateKey] = { masuk: 0, keluar: 0 };
      }
      if (t.jenis === 'pembayaran' || t.jenis === 'simpanan') {
        totals[dateKey].masuk += t.jumlah;
      } else {
        totals[dateKey].keluar += t.jumlah;
      }
    });
    return totals;
  }, [filteredTransaksi]);

  const totalKeseluruhan = useMemo(() => {
    return filteredTransaksi.reduce((acc, t) => {
      if (t.jenis === 'pembayaran' || t.jenis === 'simpanan') {
        return { ...acc, masuk: acc.masuk + t.jumlah };
      }
      return { ...acc, keluar: acc.keluar + t.jumlah };
    }, { masuk: 0, keluar: 0 });
  }, [filteredTransaksi]);

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(allTransaksi.map(t => t.tanggal.substring(0, 7)))];
    return dates.sort().reverse();
  }, [allTransaksi]);

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');

  const getJenisLabel = (jenis: string) => {
    const labels: { [key: string]: string } = {
      pinjaman: 'Pinjaman',
      simpanan: 'Simpanan',
      pembayaran: 'Pembayaran',
      penarikan: 'Penarikan',
      pendapatan: 'Pendapatan',
    };
    return labels[jenis] || jenis;
  };

  const getJenisColor = (jenis: string) => {
    switch (jenis) {
      case 'pinjaman': return 'bg-blue-100 text-blue-800';
      case 'pembayaran': return 'bg-green-100 text-green-800';
      case 'simpanan': return 'bg-purple-100 text-purple-800';
      case 'penarikan': return 'bg-orange-100 text-orange-800';
      case 'pendapatan': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Transaksi Harian</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Transaksi'}
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Filter:</label>
            <select
              value={filterTanggal}
              onChange={e => setFilterTanggal(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Semua Tanggal</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <select
            value={filterJenis}
            onChange={e => setFilterJenis(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Semua Jenis</option>
            <option value="pinjaman">Pinjaman</option>
            <option value="pembayaran">Pembayaran</option>
            <option value="simpanan">Simpanan</option>
            <option value="penarikan">Penarikan</option>
            <option value="pendapatan">Pendapatan</option>
          </select>
          <div className="ml-auto flex gap-4 text-sm">
            <div className="px-3 py-1 bg-green-50 rounded">
              <span className="text-slate-500">Total Masuk: </span>
              <span className="font-bold text-green-600">{formatRupiah(totalKeseluruhan.masuk)}</span>
            </div>
            <div className="px-3 py-1 bg-red-50 rounded">
              <span className="text-slate-500">Total Keluar: </span>
              <span className="font-bold text-red-600">{formatRupiah(totalKeseluruhan.keluar)}</span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">Tambah Transaksi Baru</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={formData.jenis}
              onChange={e => setFormData({ ...formData, jenis: e.target.value as any })}
              className="border p-2 rounded"
            >
              <option value="pinjaman">Pinjaman</option>
              <option value="simpanan">Simpanan</option>
              <option value="pembayaran">Pembayaran</option>
              <option value="penarikan">Penarikan</option>
              <option value="pendapatan">Pendapatan</option>
            </select>
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
              type="number"
              placeholder="Jumlah"
              value={formData.jumlah || ''}
              onChange={e => setFormData({ ...formData, jumlah: Number(e.target.value) })}
              className="border p-2 rounded"
              required
            />
            <input
              type="date"
              value={formData.tanggal}
              onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Deskripsi (opsional)"
              value={formData.deskripsi}
              onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
              className="border p-2 rounded"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {groupedByDate.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-slate-500">
            <p>Belum ada transaksi</p>
            <p className="text-sm mt-2">Transaksi akan muncul otomatis ketika:</p>
            <ul className="text-sm mt-2 list-disc list-inside">
              <li>Menambahkan anggota (simpanan pokok/wajib)</li>
              <li>Menambahkan pinjaman</li>
              <li>Membuat pembayaran cicilan</li>
              <li>Menambahkan simpanan</li>
            </ul>
          </div>
        ) : (
          groupedByDate.map(([tanggal, items]) => {
            const total = totalPerHari[tanggal] || { masuk: 0, keluar: 0 };
            return (
              <div key={tanggal} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-slate-100 p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">{formatDate(tanggal)}</span>
                    <span className="text-sm text-slate-500">({items.length} transaksi)</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">Masuk: {formatRupiah(total.masuk)}</span>
                    <span className="text-red-600">Keluar: {formatRupiah(total.keluar)}</span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2 w-12">No</th>
                      <th className="text-left p-2">Jenis</th>
                      <th className="text-left p-2">Nama Anggota</th>
                      <th className="text-left p-2">Deskripsi</th>
                      <th className="text-right p-2">Jumlah</th>
                      <th className="text-center p-2 w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t, index) => {
                      const ag = getAnggotaById(t.anggotaId);
                      const isPemasukan = t.jenis === 'pembayaran' || t.jenis === 'simpanan';
                      return (
                        <tr key={t.id} className="border-b hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-500">{index + 1}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${getJenisColor(t.jenis)}`}>
                              {getJenisLabel(t.jenis)}
                            </span>
                          </td>
                          <td className="p-2 font-medium">{ag?.nama || '-'}</td>
                          <td className="p-2 text-slate-600">{t.deskripsi || '-'}</td>
                          <td className={`p-2 text-right font-medium ${isPemasukan ? 'text-green-600' : 'text-red-600'}`}>
                            {isPemasukan ? '+' : '-'}{formatRupiah(t.jumlah)}
                          </td>
                          <td className="p-2 text-center">
                            <button onClick={() => deleteTransaksi(t.id)} className="text-red-600 hover:underline text-xs">
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}