'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const { anggota, pinjamans, simpanans, transactions, getLaporanKeuangan } = useKSP();
  const [selectedYear, setSelectedYear] = useState(2024);
  const laporan = getLaporanKeuangan();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 10);

  const pinjamansAktif = pinjamans.filter(p => p.status === 'aktif').length;
  const pinjamansLunas = pinjamans.filter(p => p.status === 'lunas').length;
  const pinjamansMacet = pinjamans.filter(p => p.status === 'macet').length;
  const totalPinjaman = pinjamansAktif + pinjamansLunas + pinjamansMacet;
  
  const wajib = simpanans.filter(s => s.jenis === 'wajib' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const pokok = simpanans.filter(s => s.jenis === 'pokok' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const sibuhar = simpanans.filter(s => s.jenis === 'sibuhar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const simapan = simpanans.filter(s => s.jenis === 'simapan' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const sihat = simpanans.filter(s => s.jenis === 'sihat' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const sihar = simpanans.filter(s => s.jenis === 'sihar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const totalSimpanan = wajib + pokok + sibuhar + simapan + sihat + sihar;

  const getYearStats = (year: number) => {
    const months: { name: string; masuk: number; keluar: number }[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const monthName = monthStart.toLocaleDateString('id-ID', { month: 'short' });
      
      const masuk = anggota.filter(a => {
        if (!a.tanggalJoin) return false;
        const joinDate = new Date(a.tanggalJoin);
        return joinDate.getFullYear() === year && joinDate.getMonth() === month;
      }).length;
      
      const keluar = anggota.filter(a => {
        if (a.status !== 'nonaktif' || !a.tanggalKeluar) return false;
        const exitDate = new Date(a.tanggalKeluar);
        return exitDate.getFullYear() === year && exitDate.getMonth() === month;
      }).length;
      
      months.push({ name: monthName, masuk, keluar });
    }
    return months;
  };

  const availableYears = Array.from(new Set(anggota.map(a => {
    if (a.tanggalJoin) return new Date(a.tanggalJoin).getFullYear();
    return 2024;
  }).concat(anggota.filter(a => a.tanggalKeluar).map(a => new Date(a.tanggalKeluar!).getFullYear())))).sort((a, b) => b - a);

  const yearStats = getYearStats(selectedYear);
  const currentYearMasuk = yearStats.reduce((s, m) => s + m.masuk, 0);
  const currentYearKeluar = yearStats.reduce((s, m) => s + m.keluar, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Dashboard</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Total Aktif</p>
          <p className="text-2xl font-bold text-slate-800">{laporan.jumlahAnggotaAktif}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Masuk ({selectedYear})</p>
          <p className="text-2xl font-bold text-green-600">{currentYearMasuk}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Keluar ({selectedYear})</p>
          <p className="text-2xl font-bold text-red-600">{currentYearKeluar}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Total Simpanan</p>
          <p className="text-xl font-bold text-slate-800">{formatRupiah(laporan.totalSimpanan)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Total Pinjaman Aktif</p>
          <p className="text-xl font-bold text-slate-800">{formatRupiah(laporan.totalPinjamanAktif)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-slate-500">Pinjaman Lunas</p>
          <p className="text-2xl font-bold text-slate-800">{laporan.totalPinjamanLunas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700">Grafik Pinjaman per Status</h3>
            <span className="text-sm text-slate-500">Total: {pinjamansAktif + pinjamansLunas + pinjamansMacet}</span>
          </div>
          <div className="relative h-48">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-36 gap-2">
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-blue-500 rounded-t-lg transition-all" 
                  style={{ height: totalPinjaman > 1 ? `${(pinjamansAktif / totalPinjaman) * 100}%` : '0%' }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Aktif</span>
                <span className="text-xs font-bold">{totalPinjaman > 1 ? Math.round((pinjamansAktif / totalPinjaman) * 100) : 0}%</span>
                <span className="text-xs text-slate-500">({pinjamansAktif})</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-green-500 rounded-t-lg transition-all" 
                  style={{ height: totalPinjaman > 1 ? `${(pinjamansLunas / totalPinjaman) * 100}%` : '0%' }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Lunas</span>
                <span className="text-xs font-bold">{totalPinjaman > 1 ? Math.round((pinjamansLunas / totalPinjaman) * 100) : 0}%</span>
                <span className="text-xs text-slate-500">({pinjamansLunas})</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div 
                  className="w-full bg-red-500 rounded-t-lg transition-all" 
                  style={{ height: totalPinjaman > 1 ? `${(pinjamansMacet / totalPinjaman) * 100}%` : '0%' }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Macet</span>
                <span className="text-xs font-bold">{totalPinjaman > 1 ? Math.round((pinjamansMacet / totalPinjaman) * 100) : 0}%</span>
                <span className="text-xs text-slate-500">({pinjamansMacet})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700">Grafik Simpanan per Jenis</h3>
            <span className="text-sm text-slate-500">Total: {formatRupiah(totalSimpanan)}</span>
          </div>
          <div className="relative h-48">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-36 gap-2">
              <div className="flex flex-col items-center w-1/4">
                <div 
                  className="w-full bg-yellow-500 rounded-t-lg transition-all" 
                  style={{ height: totalSimpanan > 1 ? `${(wajib / totalSimpanan) * 100}%` : '0%' }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Wajib</span>
                <span className="text-xs font-bold">{totalSimpanan > 1 ? Math.round((wajib / totalSimpanan) * 100) : 0}%</span>
              </div>
              <div className="flex flex-col items-center w-1/4">
                <div 
                  className="w-full bg-teal-500 rounded-t-lg transition-all" 
                  style={{ height: totalSimpanan > 1 ? `${(pokok / totalSimpanan) * 100}%` : '0%' }}
                ></div>
                <span className="text-xs mt-2 text-slate-600">Pokok</span>
                <span className="text-xs font-bold">{totalSimpanan > 1 ? Math.round((pokok / totalSimpanan) * 100) : 0}%</span>
              </div>
              </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-700">Anggota Masuk & Keluar per Bulan</h3>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border p-2 rounded"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <div className="relative h-56 min-w-[800px]">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-40 gap-1">
              {yearStats.map((m, i) => {
                const maxVal = Math.max(...yearStats.map(x => Math.max(x.masuk, x.keluar)), 1);
                return (
                  <div key={i} className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className="flex gap-0.5 w-full justify-center h-32 items-end">
                      <div 
                        className="w-3 bg-green-500 rounded-t" 
                        style={{ height: m.masuk > 0 ? `${(m.masuk / maxVal) * 100}%` : '0%' }}
                        title={`Masuk: ${m.masuk}`}
                      ></div>
                      <div 
                        className="w-3 bg-red-500 rounded-t" 
                        style={{ height: m.keluar > 0 ? `${(m.keluar / maxVal) * 100}%` : '0%' }}
                        title={`Keluar: ${m.keluar}`}
                      ></div>
                    </div>
                    <span className="text-[10px] mt-1 text-slate-600 whitespace-nowrap">{m.name}</span>
                    <div className="text-[10px]">
                      <span className="text-green-600">↑{m.masuk}</span>
                      {m.keluar > 0 && <span className="text-red-600">↓{m.keluar}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-3 text-sm">
          <span className="text-green-600 font-medium">█ Masuk</span>
          <span className="text-red-600 font-medium">█ Keluar</span>
        </div>
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Bulan</th>
                <th className="text-right p-2">Masuk</th>
                <th className="text-right p-2">%</th>
                <th className="text-right p-2">Keluar</th>
                <th className="text-right p-2">%</th>
              </tr>
            </thead>
            <tbody>
              {yearStats.map((m, i) => {
                const total = yearStats.reduce((s, x) => s + x.masuk + x.keluar, 0);
                const masukPct = total > 0 ? Math.round((m.masuk / total) * 100) : 0;
                const keluarPct = total > 0 ? Math.round((m.keluar / total) * 100) : 0;
                return (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="p-2">{m.name}</td>
                    <td className="p-2 text-right text-green-600 font-medium">{m.masuk}</td>
                    <td className="p-2 text-right text-slate-500">{masukPct}%</td>
                    <td className="p-2 text-right text-red-600 font-medium">{m.keluar}</td>
                    <td className="p-2 text-right text-slate-500">{keluarPct}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-semibold">
              <tr>
                <td className="p-2">Total</td>
                <td className="p-2 text-right text-green-600">{yearStats.reduce((s, m) => s + m.masuk, 0)}</td>
                <td className="p-2 text-right">100%</td>
                <td className="p-2 text-right text-red-600">{yearStats.reduce((s, m) => s + m.keluar, 0)}</td>
                <td className="p-2 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-slate-50 rounded text-sm">
          <h4 className="font-semibold text-slate-700 mb-2">Ringkasan Statistik {selectedYear}:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-slate-500 text-xs">Total Masuk</p>
              <p className="text-xl font-bold text-green-600">{currentYearMasuk}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs">Total Keluar</p>
              <p className="text-xl font-bold text-red-600">{currentYearKeluar}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs">Rata-rata Masuk/Bulan</p>
              <p className="text-lg font-bold text-green-600">{Math.round(currentYearMasuk / 12)}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs">Bulan Tertinggi</p>
              <p className="text-lg font-bold text-slate-700">
                {yearStats.reduce((max, m) => m.masuk > max.masuk ? m : max, yearStats[0] || {name: '-', masuk: 0}).name}
              </p>
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
              <span>Wajib:</span>
              <span className="font-medium">{formatRupiah(wajib)}</span>
            </p>
            <p className="flex justify-between">
              <span>Pokok:</span>
              <span className="font-medium">{formatRupiah(pokok)}</span>
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