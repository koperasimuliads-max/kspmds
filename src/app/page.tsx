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

  const pinjamansAktif = pinjamans.filter(p => p.status === 'aktif').length;
  const pinjamansLunas = pinjamans.filter(p => p.status === 'lunas').length;
  const pinjamansMacet = pinjamans.filter(p => p.status === 'macet').length;
  const totalPinjaman = pinjamansAktif + pinjamansLunas + pinjamansMacet || 1;
  
  const sukarela = simpanans.filter(s => s.jenis === 'sukarela' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const wajib = simpanans.filter(s => s.jenis === 'wajib' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const berjangka = simpanans.filter(s => s.jenis === 'berjangka' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const totalSimpanan = sukarela + wajib + berjangka || 1;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-4">Grafik Pinjaman per Status</h3>
          <div className="relative h-48">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-36 gap-2">
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-blue-500 rounded-t-lg transition-all" 
                  style={{ height: `${(pinjamansAktif / totalPinjaman) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Aktif ({pinjamansAktif})</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-green-500 rounded-t-lg transition-all" 
                  style={{ height: `${(pinjamansLunas / totalPinjaman) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Lunas ({pinjamansLunas})</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-red-500 rounded-t-lg transition-all" 
                  style={{ height: `${(pinjamansMacet / totalPinjaman) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Macet ({pinjamansMacet})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-4">Grafik Simpanan per Jenis</h3>
          <div className="relative h-48">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-36 gap-2">
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-purple-500 rounded-t-lg transition-all" 
                  style={{ height: `${(sukarela / totalSimpanan) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Sukarela</span>
                <span className="text-xs text-slate-500">{formatRupiah(sukarela)}</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-yellow-500 rounded-t-lg transition-all" 
                  style={{ height: `${(wajib / totalSimpanan) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Wajib</span>
                <span className="text-xs text-slate-500">{formatRupiah(wajib)}</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-teal-500 rounded-t-lg transition-all" 
                  style={{ height: `${(berjangka / totalSimpanan) * 100}%` }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Berjangka</span>
                <span className="text-xs text-slate-500">{formatRupiah(berjangka)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-2">Detail Pinjaman</h3>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Aktif:</span>
              <span className="font-medium">{pinjamansAktif}</span>
            </p>
            <p className="flex justify-between">
              <span>Lunas:</span>
              <span className="font-medium">{pinjamansLunas}</span>
            </p>
            <p className="flex justify-between">
              <span>Macet:</span>
              <span className="font-medium">{pinjamansMacet}</span>
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-slate-700 mb-2">Detail Simpanan</h3>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Sukarela:</span>
              <span className="font-medium">{formatRupiah(sukarela)}</span>
            </p>
            <p className="flex justify-between">
              <span>Wajib:</span>
              <span className="font-medium">{formatRupiah(wajib)}</span>
            </p>
            <p className="flex justify-between">
              <span>Berjangka:</span>
              <span className="font-medium">{formatRupiah(berjangka)}</span>
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