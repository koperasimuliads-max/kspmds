'use client';

import { useState, useSyncExternalStore } from 'react';
import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export default function SHUPerAnggotaPage() {
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans } = useKSP();
  const hydrated = useHydrated();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const allTahun = Array.from(new Set([
    ...pendapatans.map(p => new Date(p.tanggal).getFullYear()),
    ...pengeluarans.map(p => new Date(p.tanggal).getFullYear()),
  ])).sort((a, b) => b - a);

  const availableTahun = allTahun.length > 0 ? allTahun : [2023, 2024, 2025, 2026];

  const hitungSHUPerTahun = (tahun: number) => {
    const pendapatanTahun = pendapatans.filter((p: any) => new Date(p.tanggal).getFullYear() === tahun).reduce((sum: number, p: any) => sum + p.jumlah, 0);
    const pengeluaranTahun = pengeluarans.filter(p => new Date(p.tanggal).getFullYear() === tahun).reduce((sum: number, p) => sum + p.jumlah, 0);
    return { pendapatan: pendapatanTahun, pengeluaran: pengeluaranTahun, shu: pendapatanTahun - pengeluaranTahun };
  };

  const totalSimpananTable = simpanans.filter(s => s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const totalSimpananAwal = anggota.reduce((sum, a) => sum + (a.simpananPokok || 0) + (a.simpananWajib || 0), 0);
  const totalSimpananSemua = totalSimpananTable + totalSimpananAwal;
  const totalPinjamanSemua = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);

  const hitungDistribution = (shu: number) => ({
    dana_cadangan_umum: shu * 0.05,
    dana_cadangan_resiko: shu * 0.05,
    jasa_modal: shu * 0.55,
    jasa_transaksi: shu * 0.20,
    dana_pengurus_pengawas: shu * 0.05,
    dana_kesejahteraan_karyawan: shu * 0.05,
    dana_pendidikan: shu * 0.02,
    dana_sosial: shu * 0.02,
    daerah_pembangunan_daerah_kerja: shu * 0.01,
  });

  const hitungSHUPerAnggota = (tahun: number) => {
    const { shu } = hitungSHUPerTahun(tahun);
    const distribution = hitungDistribution(shu);

    return anggota.map(ag => {
      const simpananDariTable = simpanans.filter(s => s.anggotaId === ag.id && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
      const simpananTotal = simpananDariTable + (ag.simpananPokok || 0) + (ag.simpananWajib || 0);
      const pinjaman = pinjamans.filter(p => p.anggotaId === ag.id && p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
      const jasaModal = totalSimpananSemua > 0 && simpananTotal > 0 ? (simpananTotal / totalSimpananSemua) * distribution.jasa_modal : 0;
      const jasaTransaksi = totalPinjamanSemua > 0 && pinjaman > 0 ? (pinjaman / totalPinjamanSemua) * distribution.jasa_transaksi : 0;
      return { id: ag.id, nama: ag.nama, nomorNBA: ag.nomorNBA, simpananTotal, pinjaman, jasaModal, jasaTransaksi, totalSHU: jasaModal + jasaTransaksi };
    }).sort((a, b) => b.totalSHU - a.totalSHU);
  };

  const { pendapatan: pendPerTahun, pengeluaran: pengPerTahun, shu: shuPerTahun } = hitungSHUPerTahun(selectedYear);
  const distribution = hitungDistribution(shuPerTahun);
  const perAnggota = hitungSHUPerAnggota(selectedYear);
  const totalJasaModal = perAnggota.reduce((s, a) => s + a.jasaModal, 0);
  const totalJasaTransaksi = perAnggota.reduce((s, a) => s + a.jasaTransaksi, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">SHU Per Anggota</h1>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="ml-auto border p-2 rounded"
        >
          {availableTahun.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (confirm('Yakin ingin menghapus semua data anggota, simpanan, dan pinjaman? Data tidak bisa dikembalikan!')) {
              localStorage.removeItem('ksp_anggota');
              localStorage.removeItem('ksp_simpanans');
              localStorage.removeItem('ksp_pinjamans');
              localStorage.removeItem('ksp_pendapatans');
              localStorage.removeItem('ksp_pengeluarans');
              localStorage.removeItem('ksp_transactions');
              window.location.reload();
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
        >
          🗑️ Reset Semua Data
        </button>
      </div>

      {!hydrated ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading...</div>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-blue-800">📊 RINGKASAN DATA KSP - TAHUN {selectedYear}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded"><p className="text-slate-500 text-xs">Total Anggota Aktif</p><p className="text-xl font-bold">{anggota.filter(a => a.status === 'aktif').length}</p></div>
          <div className="bg-white p-3 rounded"><p className="text-slate-500 text-xs">Pendapatan</p><p className="text-xl font-bold text-green-600">{formatRupiah(pendPerTahun)}</p></div>
          <div className="bg-white p-3 rounded"><p className="text-slate-500 text-xs">Pengeluaran</p><p className="text-xl font-bold text-red-600">{formatRupiah(pengPerTahun)}</p></div>
          <div className="bg-white p-3 rounded"><p className="text-slate-500 text-xs">SHU Tahun {selectedYear}</p><p className="text-xl font-bold text-blue-600">{formatRupiah(shuPerTahun)}</p></div>
        </div>
      </div>

      {shuPerTahun > 0 ? (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">📈 ALOKASI SHU TAHUN {selectedYear}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              <div className="p-2 bg-green-50 rounded"><p className="text-green-700 text-xs">Jasa Modal (55%)</p><p className="font-bold">{formatRupiah(distribution.jasa_modal)}</p></div>
              <div className="p-2 bg-blue-50 rounded"><p className="text-blue-700 text-xs">Jasa Transaksi (20%)</p><p className="font-bold">{formatRupiah(distribution.jasa_transaksi)}</p></div>
              <div className="p-2 bg-slate-100 rounded"><p className="text-slate-600 text-xs">Dana Cadangan (10%)</p><p className="font-bold">{formatRupiah(distribution.dana_cadangan_umum + distribution.dana_cadangan_resiko)}</p></div>
              <div className="p-2 bg-yellow-50 rounded"><p className="text-yellow-700 text-xs">Dana Pengurus (5%)</p><p className="font-bold">{formatRupiah(distribution.dana_pengurus_pengawas)}</p></div>
            </div>
            <div className="border-t pt-3 mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Lainnya (10%):</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="p-1 bg-purple-50 rounded text-center"><span className="text-purple-700">Karyawan 5%</span><p className="font-bold">{formatRupiah(distribution.dana_kesejahteraan_karyawan)}</p></div>
                <div className="p-1 bg-orange-50 rounded text-center"><span className="text-orange-700">Pendidikan 2%</span><p className="font-bold">{formatRupiah(distribution.dana_pendidikan)}</p></div>
                <div className="p-1 bg-red-50 rounded text-center"><span className="text-red-700">Sosial 2%</span><p className="font-bold">{formatRupiah(distribution.dana_sosial)}</p></div>
                <div className="p-1 bg-teal-50 rounded text-center"><span className="text-teal-700">Daerah 1%</span><p className="font-bold">{formatRupiah(distribution.daerah_pembangunan_daerah_kerja)}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">👥 SHU PER ANGGOTA - TAHUN {selectedYear}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr><th className="text-center p-2 w-12">No</th><th className="text-left p-2">Nama</th><th className="text-left p-2">NBA</th><th className="text-right p-2">Total Simpanan</th><th className="text-right p-2">Pinjaman</th><th className="text-right p-2">Jasa Modal</th><th className="text-right p-2">Jasa Transaksi</th><th className="text-right p-2 font-bold">Total SHU</th></tr>
                </thead>
                <tbody>
                  {perAnggota.map((a, index) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{index + 1}</td>
                      <td className="p-2 font-medium">{a.nama}</td>
                      <td className="p-2">{a.nomorNBA || '-'}</td>
                      <td className="p-2 text-right">{formatRupiah(a.simpananTotal)}</td>
                      <td className="p-2 text-right">{formatRupiah(a.pinjaman)}</td>
                      <td className="p-2 text-right text-green-600">{formatRupiah(a.jasaModal)}</td>
                      <td className="p-2 text-right text-blue-600">{formatRupiah(a.jasaTransaksi)}</td>
                      <td className="p-2 text-right font-bold text-green-700">{formatRupiah(a.totalSHU)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr><td colSpan={3} className="p-2 text-right">TOTAL</td><td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.simpananTotal, 0))}</td><td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.pinjaman, 0))}</td><td className="p-2 text-right">{formatRupiah(totalJasaModal)}</td><td className="p-2 text-right">{formatRupiah(totalJasaTransaksi)}</td><td className="p-2 text-right text-green-700">{formatRupiah(totalJasaModal + totalJasaTransaksi)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow mb-4 text-center text-slate-500">
          <p className="text-lg">Belum ada SHU untuk tahun {selectedYear}</p>
          <p className="text-sm mt-2">Silakan input data pendapatan dan pengeluaran terlebih dahulu</p>
        </div>
      )}
        </>
      )}
    </div>
  );
}