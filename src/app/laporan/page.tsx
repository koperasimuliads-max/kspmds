'use client';

import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function LaporanPage() {
  const { anggota, pinjamans, simpanans, transactions, getLaporanKeuangan, getAnggotaById } = useKSP();
  const laporan = getLaporanKeuangan();

  const simpananByJenis = {
    wajib: simpanans.filter(s => s.jenis === 'wajib' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0) + anggota.reduce((sum, a) => sum + (a.simpananWajib || 0), 0),
    pokok: simpanans.filter(s => s.jenis === 'pokok' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0) + anggota.reduce((sum, a) => sum + (a.simpananPokok || 0), 0),
    sibuhar: simpanans.filter(s => s.jenis === 'sibuhar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    simapan: simpanans.filter(s => s.jenis === 'simapan' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    sihat: simpanans.filter(s => s.jenis === 'sihat' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    sihar: simpanans.filter(s => s.jenis === 'sihar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
  };

  const totalSimpanan = Object.values(simpananByJenis).reduce((a, b) => a + b, 0);
  const totalPinjamanAktif = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
  const totalPembayaran = pinjamans.reduce((sum, p) => sum + p.sudahDibayar, 0);
  const sisaPinjaman = totalPinjamanAktif - (totalPembayaran - (pinjamans.filter(p => p.status === 'lunas').reduce((sum, p) => sum + p.totalPembayaran, 0)));

  const today = '13 April 2026';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Laporan Keuangan</h1>
      <p className="text-slate-500 mb-6">KSP Mulia Dana Sejahtera - per {today}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">ASET</h2>
          
          <div className="space-y-2">
            <h3 className="font-medium text-green-700">Simpanan</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Simpanan Wajib</span><span>{formatRupiah(simpananByJenis.wajib)}</span></p>
              <p className="flex justify-between"><span>Simpanan Pokok</span><span>{formatRupiah(simpananByJenis.pokok)}</span></p>
              <p className="flex justify-between"><span>Sibuhar (3%/thn)</span><span>{formatRupiah(simpananByJenis.sibuhar)}</span></p>
              <p className="flex justify-between"><span>Simapan (5%/thn)</span><span>{formatRupiah(simpananByJenis.simapan)}</span></p>
              <p className="flex justify-between"><span>Sihat (6%/thn)</span><span>{formatRupiah(simpananByJenis.sihat)}</span></p>
              <p className="flex justify-between"><span>Sihar</span><span>{formatRupiah(simpananByJenis.sihar)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Total Simpanan</span><span>{formatRupiah(totalSimpanan)}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PENDAPATAN</h2>
          <div className="space-y-2">
            <p className="text-sm">Uang Buku (BIAYA ADMINISTRASI)</p>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between">
                <span>Uang Buku Anggota ({anggota.filter(a => a.uangBuku > 0).length} anggota)</span>
                <span className="font-medium">{formatRupiah(anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0))}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PIUTANG</h2>
          
          <div className="space-y-2">
            <h3 className="font-medium text-red-700">Pinjaman Anggota</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Pinjaman Aktif</span><span>{formatRupiah(totalPinjamanAktif)}</span></p>
              <p className="flex justify-between"><span>Pinjaman Lunas</span><span>{pinjamans.filter(p => p.status === 'lunas').length} akun</span></p>
              <p className="flex justify-between border-t pt-1 font-medium"><span>Total Piutang</span><span>{formatRupiah(totalPinjamanAktif)}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">RINGKASAN STATISTIK</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Total Anggota</p>
            <p className="text-xl font-bold">{anggota.length}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Anggota Aktif</p>
            <p className="text-xl font-bold text-green-600">{anggota.filter(a => a.status === 'aktif').length}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Pinjaman Aktif</p>
            <p className="text-xl font-bold text-blue-600">{pinjamans.filter(p => p.status === 'aktif').length}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Simpanan Aktif</p>
            <p className="text-xl font-bold text-purple-600">{simpanans.filter(s => s.status === 'aktif').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">HISTORI TRANSAKSI</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Tanggal</th>
                <th className="text-left p-2">Jenis</th>
                <th className="text-left p-2">Anggota</th>
                <th className="text-left p-2">Deskripsi</th>
                <th className="text-right p-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4 text-slate-500">Belum ada transaksi</td></tr>
              ) : (
                [...transactions]
                  .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                  .map(t => {
                    const ag = getAnggotaById(t.anggotaId);
                    return (
                      <tr key={t.id} className="border-b">
                        <td className="p-2">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-2 capitalize">{t.jenis}</td>
                        <td className="p-2">{ag?.nama || '-'}</td>
                        <td className="p-2">{t.deskripsi}</td>
                        <td className="p-2 text-right">{formatRupiah(t.jumlah)}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">DETAIL PINJAMAN ANGGOTA</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Anggota</th>
                <th className="text-right p-2">Jumlah</th>
                <th className="text-right p-2">Cicilan/Bulan</th>
                <th className="text-right p-2">Dibayar</th>
                <th className="text-right p-2">Sisa</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pinjamans.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4 text-slate-500">Belum ada pinjaman</td></tr>
              ) : (
                pinjamans.map(p => {
                  const ag = getAnggotaById(p.anggotaId);
                  const sisa = p.totalPembayaran - p.sudahDibayar;
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{ag?.nama || '-'}</td>
                      <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                      <td className="p-2 text-right">{formatRupiah(p.cicilanPerBulan)}</td>
                      <td className="p-2 text-right">{formatRupiah(p.sudahDibayar)}</td>
                      <td className="p-2 text-right">{formatRupiah(sisa)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          p.status === 'aktif' ? 'bg-blue-100 text-blue-800' : 
                          p.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}