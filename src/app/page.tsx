'use client';

import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const { anggota, pinjamans, simpanans, transactions, getLaporanKeuangan } = useKSP();
  const laporan = getLaporanKeuangan();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Total Anggota Aktif</p>
          <p className="text-2xl font-bold text-slate-800">{laporan.jumlahAnggotaAktif}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Total Simpanan</p>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(laporan.totalSimpanan)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Total Pinjaman Aktif</p>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(laporan.totalPinjamanAktif)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-slate-500">Pinjaman Lunas</p>
          <p className="text-2xl font-bold text-slate-800">{laporan.totalPinjamanLunas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-2">Pinjaman per Status</h3>
          <div className="space-y-1">
            <p className="flex justify-between">
              <span>Aktif:</span>
              <span className="font-medium">{pinjamans.filter(p => p.status === 'aktif').length}</span>
            </p>
            <p className="flex justify-between">
              <span>Lunas:</span>
              <span className="font-medium">{pinjamans.filter(p => p.status === 'lunas').length}</span>
            </p>
            <p className="flex justify-between">
              <span>Macet:</span>
              <span className="font-medium">{pinjamans.filter(p => p.status === 'macet').length}</span>
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-2">Simpanan per Jenis</h3>
          <div className="space-y-1">
            <p className="flex justify-between">
              <span>Sukarela:</span>
              <span className="font-medium">{formatRupiah(simpanans.filter(s => s.jenis === 'sukarela' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0))}</span>
            </p>
            <p className="flex justify-between">
              <span>Wajib:</span>
              <span className="font-medium">{formatRupiah(simpanans.filter(s => s.jenis === 'wajib' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0))}</span>
            </p>
            <p className="flex justify-between">
              <span>Berjangka:</span>
              <span className="font-medium">{formatRupiah(simpanans.filter(s => s.jenis === 'berjangka' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0))}</span>
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-2">Total Pembayaran</h3>
          <p className="text-xl font-bold text-green-600">{formatRupiah(laporan.totalPembayaranPinjaman)}</p>
          <p className="text-sm text-slate-500 mt-1">Dari pinjaman</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-slate-700 mb-4">Transaksi Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tanggal</th>
                <th className="text-left py-2">Jenis</th>
                <th className="text-left py-2">Deskripsi</th>
                <th className="text-right py-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-slate-500">Belum ada transaksi</td>
                </tr>
              ) : (
                recentTransactions.map(t => (
                  <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="py-2">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="py-2 capitalize">{t.jenis}</td>
                    <td className="py-2">{t.deskripsi}</td>
                    <td className="py-2 text-right">{formatRupiah(t.jumlah)}</td>
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