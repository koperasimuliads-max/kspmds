'use client';

import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function LaporanPage() {
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans, getLaporanKeuangan } = useKSP();
  const laporan = getLaporanKeuangan();

  const simpananByJenis = {
    wajib: simpanans.filter(s => s.jenis === 'wajib' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0),
    pokok: simpanans.filter(s => s.jenis === 'pokok' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0),
    sibuhar: simpanans.filter(s => s.jenis === 'sibuhar' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0),
    simapan: simpanans.filter(s => s.jenis === 'simapan' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0),
    sihat: simpanans.filter(s => s.jenis === 'sihat' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0),
    sihar: simpanans.filter(s => s.jenis === 'sihar' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0),
  };

  const totalSimpanan = Object.values(simpananByJenis).reduce((a, b) => a + b, 0);
  const totalPinjamanAktif = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
  const totalPendapatan = pendapatans.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);
  const shNet = totalPendapatan - totalPengeluaran;

  const today = '13 April 2026';

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h1>
      </div>
      <p className="text-slate-500 mb-6">KSP Mulia Dana Sejahtera - per {today}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">ASET - SIMPANAN</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span>Simpanan Pokok</span><span>{formatRupiah(simpananByJenis.pokok)}</span></p>
            <p className="flex justify-between"><span>Simpanan Wajib</span><span>{formatRupiah(simpananByJenis.wajib)}</span></p>
            <p className="flex justify-between"><span>Sibuhar</span><span>{formatRupiah(simpananByJenis.sibuhar)}</span></p>
            <p className="flex justify-between"><span>Simapan</span><span>{formatRupiah(simpananByJenis.simapan)}</span></p>
            <p className="flex justify-between"><span>Sihat</span><span>{formatRupiah(simpananByJenis.sihat)}</span></p>
            <p className="flex justify-between"><span>Sihar</span><span>{formatRupiah(simpananByJenis.sihar)}</span></p>
            <p className="flex justify-between font-bold border-t pt-1"><span>TOTAL</span><span>{formatRupiah(totalSimpanan)}</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PIUTANG</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span>Pinjaman Aktif</span><span>{formatRupiah(totalPinjamanAktif)}</span></p>
            <p className="flex justify-between"><span>Pinjaman Lunas</span><span>{pinjamans.filter(p => p.status === 'lunas').length} akun</span></p>
            <p className="flex justify-between font-bold border-t pt-1"><span>TOTAL</span><span>{formatRupiah(totalPinjamanAktif)}</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PENDAPATAN</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span>Total Pendapatan</span><span className="font-medium">{formatRupiah(totalPendapatan)}</span></p>
            <p className="text-xs text-slate-500 mt-2">Dari menu Pendapatan</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PENGELUARAN</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span>Total Pengeluaran</span><span className="font-medium">{formatRupiah(totalPengeluaran)}</span></p>
            <p className="text-xs text-slate-500 mt-2">Dari menu Pengeluaran</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">RINGKASAN LABA/RUGI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded">
            <p className="font-medium text-green-800">Total Pendapatan</p>
            <p className="text-xl font-bold text-green-700">{formatRupiah(totalPendapatan)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="font-medium text-red-800">Total Pengeluaran</p>
            <p className="text-xl font-bold text-red-700">{formatRupiah(totalPengeluaran)}</p>
          </div>
          <div className={`p-3 rounded ${shNet >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <p className={`font-medium ${shNet >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              {shNet >= 0 ? 'SISA HASIL USAHA (SHU)' : 'RUGI'}
            </p>
            <p className={`text-2xl font-bold ${shNet >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatRupiah(shNet)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">STATISTIK</h2>
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
            <p className="text-slate-500">Total Simpanan</p>
            <p className="text-xl font-bold text-purple-600">{formatRupiah(totalSimpanan)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}