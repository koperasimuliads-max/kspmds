'use client';

import { useState, useMemo } from 'react';
import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export default function TransaksiPage() {
  const { anggota, simpanans, pinjamans, pendapatans, pengeluarans, transactions } = useKSP();
  const [filterJenis, setFilterJenis] = useState('all');
  const [filterAnggota, setFilterAnggota] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Gabungkan semua transaksi
  const allTransactions = useMemo(() => {
    const transaksiList: Array<{
      id: string;
      tanggal: string;
      jenis: string;
      deskripsi: string;
      debet: number;
      kredit: number;
      anggota: string;
      kategori: string;
    }> = [];

    // Transaksi Simpanan
    simpanans.forEach(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      transaksiList.push({
        id: `simpanan-${s.id}`,
        tanggal: s.tanggalSimpan,
        jenis: 'simpanan',
        deskripsi: `${s.jenis} dari ${ag?.nama || 'Unknown'}`,
        debet: s.jumlah,
        kredit: 0,
        anggota: ag?.nama || 'Unknown',
        kategori: s.jenis
      });
    });

    // Transaksi Pinjaman
    pinjamans.forEach(p => {
      const ag = anggota.find(a => a.id === p.anggotaId);
      transaksiList.push({
        id: `pinjaman-${p.id}`,
        tanggal: p.tanggalPinjaman,
        jenis: 'pinjaman',
        deskripsi: `Pinjaman dari ${ag?.nama || 'Unknown'}`,
        debet: 0,
        kredit: p.jumlah,
        anggota: ag?.nama || 'Unknown',
        kategori: 'pinjaman'
      });
    });

    // Transaksi Pendapatan
    pendapatans.forEach(p => {
      transaksiList.push({
        id: `pendapatan-${p.id}`,
        tanggal: p.tanggal,
        jenis: 'pendapatan',
        deskripsi: p.deskripsi,
        debet: p.jumlah,
        kredit: 0,
        anggota: 'System',
        kategori: p.jenis
      });
    });

    // Transaksi Pengeluaran
    pengeluarans.forEach(p => {
      transaksiList.push({
        id: `pengeluaran-${p.id}`,
        tanggal: p.tanggal,
        jenis: 'pengeluaran',
        deskripsi: p.deskripsi,
        debet: 0,
        kredit: p.jumlah,
        anggota: 'System',
        kategori: p.jenis
      });
    });

    // Transaksi dari transactions table
    transactions.forEach(t => {
      const ag = anggota.find(a => a.id === t.anggotaId);
      transaksiList.push({
        id: `transaction-${t.id}`,
        tanggal: t.tanggal,
        jenis: t.jenis,
        deskripsi: t.deskripsi,
        debet: t.jenis === 'simpanan' ? t.jumlah : 0,
        kredit: t.jenis === 'penarikan' || t.jenis === 'pinjaman' ? t.jumlah : 0,
        anggota: ag?.nama || 'Unknown',
        kategori: t.jenis
      });
    });

    return transaksiList
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [simpanans, pinjamans, pendapatans, pengeluarans, transactions, anggota]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (filterJenis !== 'all' && t.jenis !== filterJenis) return false;
      if (filterAnggota !== 'all' && t.anggota !== filterAnggota) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return t.deskripsi.toLowerCase().includes(term) ||
               t.anggota.toLowerCase().includes(term) ||
               t.kategori.toLowerCase().includes(term);
      }
      return true;
    });
  }, [allTransactions, filterJenis, filterAnggota, searchTerm]);

  const jenisOptions = ['all', ...Array.from(new Set(allTransactions.map(t => t.jenis)))];
  const anggotaOptions = ['all', ...Array.from(new Set(allTransactions.map(t => t.anggota)))];

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Daftar Transaksi Lengkap</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              placeholder="Cari deskripsi atau anggota..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Transaksi</label>
            <select
              value={filterJenis}
              onChange={e => setFilterJenis(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {jenisOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Semua Jenis' : option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Anggota</label>
            <select
              value={filterAnggota}
              onChange={e => setFilterAnggota(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {anggotaOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Semua Anggota' : option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterJenis('all');
                setFilterAnggota('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 w-full"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Transaksi</p>
          <p className="text-2xl font-bold text-blue-800">{filteredTransactions.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Total Debet (Masuk)</p>
          <p className="text-xl font-bold text-green-800">{formatRupiah(filteredTransactions.reduce((sum, t) => sum + t.debet, 0))}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 font-medium">Total Kredit (Keluar)</p>
          <p className="text-xl font-bold text-red-800">{formatRupiah(filteredTransactions.reduce((sum, t) => sum + t.kredit, 0))}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Net Balance</p>
          <p className="text-xl font-bold text-purple-800">{formatRupiah(filteredTransactions.reduce((sum, t) => sum + t.debet - t.kredit, 0))}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-3">Tanggal</th>
                <th className="text-left p-3">Jenis</th>
                <th className="text-left p-3">Anggota</th>
                <th className="text-left p-3">Deskripsi</th>
                <th className="text-right p-3">Debet (Masuk)</th>
                <th className="text-right p-3">Kredit (Keluar)</th>
                <th className="text-left p-3">Kategori</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-slate-500">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 100).map(t => (
                  <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-sm">{formatDate(t.tanggal)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.jenis === 'simpanan' ? 'bg-green-100 text-green-800' :
                        t.jenis === 'pinjaman' ? 'bg-blue-100 text-blue-800' :
                        t.jenis === 'pendapatan' ? 'bg-yellow-100 text-yellow-800' :
                        t.jenis === 'pengeluaran' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {t.jenis}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{t.anggota}</td>
                    <td className="p-3">{t.deskripsi}</td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      {t.debet > 0 ? formatRupiah(t.debet) : '-'}
                    </td>
                    <td className="p-3 text-right text-red-600 font-medium">
                      {t.kredit > 0 ? formatRupiah(t.kredit) : '-'}
                    </td>
                    <td className="p-3 text-sm text-slate-500">{t.kategori}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 100 && (
          <div className="p-4 bg-slate-50 text-center text-sm text-slate-600">
            Menampilkan 100 transaksi terbaru dari {filteredTransactions.length} total
          </div>
        )}
      </div>
    </div>
  );
}