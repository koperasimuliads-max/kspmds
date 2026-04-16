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
    return new Date(dateStr).toLocaleDateString('id-ID');
  } catch {
    return '-';
  }
}

export default function AutodebitPage() {
  const { anggota, pinjamans, simpanans, addSimpanan, updateSimpanan, updatePinjaman, addPendapatan, addTransaksi, deleteTransaksi } = useKSP();
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const anggotaWithPinjaman = anggota
    .filter(a => a.status === 'aktif')
    .map(ag => {
      const agPinjamans = pinjamans.filter(p => p.anggotaId === ag.id && p.status === 'aktif');
      const agSimpanans = simpanans.filter(s => s.anggotaId === ag.id && s.status === 'aktif');
      
      const totalPinjaman = agPinjamans.reduce((sum, p) => sum + p.jumlah, 0);
      const totalBunga = agPinjamans.reduce((sum, p) => sum + (p.jumlah * (p.bunga / 100) / 12), 0);
      const simpananWajib = agSimpanans.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
      const simpananHarian = agSimpanans.filter(s => s.jenis === 'sibuhar').reduce((sum, s) => sum + s.jumlah, 0);
      
      const wajibBulanan = 50000;
      const totalTagihan = totalBunga + wajibBulanan;
      
      return {
        ...ag,
        totalPinjaman,
        totalBunga,
        wajibBulanan,
        simpananWajib,
        simpananHarian,
        totalTagihan,
        canAutodebit: simpananHarian >= totalTagihan,
      };
    })
    .filter(a => a.totalPinjaman > 0)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const handleAutodebit = async (aggotaId: string) => {
    setProcessing(aggotaId);
    setMessage(null);
    
    try {
      const ag = anggota.find(a => a.id === aggotaId);
      if (!ag) throw new Error('Anggota tidak ditemukan');
      
      const agPinjamans = pinjamans.filter(p => p.anggotaId === aggotaId && p.status === 'aktif');
      const agSimpanans = simpanans.filter(s => s.anggotaId === aggotaId && s.status === 'aktif');
      
      const totalBunga = agPinjamans.reduce((sum, p) => sum + (p.jumlah * (p.bunga / 100) / 12), 0);
      const simpananHarian = agSimpanans.filter(s => s.jenis === 'sibuhar').reduce((sum, s) => sum + s.jumlah, 0);
      const wajibBulanan = 50000;
      const totalTagihan = totalBunga + wajibBulanan;
      
      if (simpananHarian < totalTagihan) {
        throw new Error('Saldo Sibuhar tidak mencukupi');
      }

      // 1. Potong Sibuhar (mengurangi liabilitas)
      const sibuharSimpanan = agSimpanans.find(s => s.jenis === 'sibuhar');
      if (sibuharSimpanan) {
        updateSimpanan(sibuharSimpanan.id, {
          jumlah: sibuharSimpanan.jumlah - totalTagihan
        });
      }

      // 2. Tambah Simpanan Wajib (menambah ekuitas)
      addSimpanan({
        anggotaId: aggotaId,
        jumlah: wajibBulanan,
        jenis: 'wajib',
        tanggalSimpan: new Date().toISOString().split('T')[0],
        status: 'aktif',
        bunga: 0,
        tenor: 0,
      });

      // 3. Catat Pendapatan Bunga
      if (totalBunga > 0) {
        addPendapatan({
          jenis: 'bunga_pinjaman',
          deskripsi: `Bunga pinjaman ${ag.nama}`,
          jumlah: Math.round(totalBunga),
          tanggal: new Date().toISOString().split('T')[0],
        });
      }

      // 4. Catat Transaksi
      addTransaksi({
        jenis: 'pembayaran',
        anggotaId: aggotaId,
        referensiId: '',
        jumlah: totalTagihan,
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: `Autodebit: Bunga=${formatRupiah(totalBunga)}, Wajib=${formatRupiah(wajibBulanan)}`,
      });

      setMessage({
        type: 'success',
        text: `Autodebit ${ag.nama} berhasil! Total: ${formatRupiah(totalTagihan)}`
      });
      
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Gagal memproses autodebit'
      });
    } finally {
      setProcessing(null);
    }
  };

  const totalTagihanSemua = anggotaWithPinjaman.reduce((sum, a) => sum + a.totalTagihan, 0);
  const totalCanAutodebit = anggotaWithPinjaman.filter(a => a.canAutodebit).length;

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">🔄 Autodebit Terpadu</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-slate-500">Total Anggota with Pinjaman</p>
          <p className="text-2xl font-bold text-blue-600">{anggotaWithPinjaman.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-slate-500">Siap Autodebit</p>
          <p className="text-2xl font-bold text-yellow-600">{totalCanAutodebit}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-slate-500">Total Tagihan Bulanan</p>
          <p className="text-2xl font-bold text-purple-600">{formatRupiah(totalTagihanSemua)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">No</th>
              <th className="text-left p-3">Anggota</th>
              <th className="text-right p-3">Pinjaman</th>
              <th className="text-right p-3">Bunga/Bulan</th>
              <th className="text-right p-3">Wajib/Bulan</th>
              <th className="text-right p-3">Total Tagihan</th>
              <th className="text-right p-3">Sibuhar Tersedia</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {anggotaWithPinjaman.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-slate-500">
                  Tidak ada anggota dengan pinjaman aktif
                </td>
              </tr>
            ) : (
              anggotaWithPinjaman.map((ag, index) => (
                <tr key={ag.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-center">{index + 1}</td>
                  <td className="p-3">
                    <p className="font-medium">{ag.nama}</p>
                    <p className="text-xs text-slate-500">NBA: {ag.nomorNBA || '-'}</p>
                  </td>
                  <td className="p-3 text-right">{formatRupiah(ag.totalPinjaman)}</td>
                  <td className="p-3 text-right text-green-600">{formatRupiah(ag.totalBunga)}</td>
                  <td className="p-3 text-right">{formatRupiah(ag.wajibBulanan)}</td>
                  <td className="p-3 text-right font-bold">{formatRupiah(ag.totalTagihan)}</td>
                  <td className={`p-3 text-right ${ag.canAutodebit ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(ag.simpananHarian)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleAutodebit(ag.id)}
                      disabled={processing === ag.id || !ag.canAutodebit}
                      className={`px-3 py-1 rounded text-sm ${
                        ag.canAutodebit 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {processing === ag.id ? '...' : ag.canAutodebit ? 'Autodebit' : 'Saldo Kurang'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-50 font-bold">
            <tr>
              <td colSpan={5} className="p-3 text-right">TOTAL:</td>
              <td className="p-3 text-right">{formatRupiah(totalTagihanSemua)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">ℹ️ Cara Kerja Autodebit:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Sistem mengambil tagihan bunga pinjaman + simpanan wajib per bulan</li>
          <li>2. Cek saldo Sibuhar (simpanan harian) anggota</li>
          <li>3. Jika saldo cukup → potong Sibuhar, catat wajib, catat pendapatan bunga</li>
          <li>4. Semua laporan (Neraca, SHU) otomatis terupdate</li>
          <li>5. Jika saldo tidak cukup → tidak bisa autodebit</li>
        </ul>
      </div>
    </div>
  );
}