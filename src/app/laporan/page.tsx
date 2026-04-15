'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function LaporanPage() {
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans, getLaporanKeuangan } = useKSP();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
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
  const totalPinjamanLunas = pinjamans.filter(p => p.status === 'lunas').reduce((sum, p) => sum + p.jumlah, 0);
  const totalPinjamanMacet = pinjamans.filter(p => p.status === 'macet').reduce((sum, p) => sum + p.jumlah, 0);

  const totalPendapatan = pendapatans.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);
  const shNet = totalPendapatan - totalPengeluaran;

  const pendapatanPerTahun = pendapatans.filter(p => new Date(p.tanggal).getFullYear() === selectedYear).reduce((sum, p) => sum + p.jumlah, 0);
  const pengeluaranPerTahun = pengeluarans.filter(p => new Date(p.tanggal).getFullYear() === selectedYear).reduce((sum, p) => sum + p.jumlah, 0);
  const shNetPerTahun = pendapatanPerTahun - pengeluaranPerTahun;

  const shuDistribution = shNet > 0 ? {
    dana_cadangan_umum: shNet * 0.05,
    dana_cadangan_resiko: shNet * 0.05,
    jasa_modal: shNet * 0.55,
    jasa_transaksi: shNet * 0.20,
    dana_pengurus_pengawas: shNet * 0.05,
    dana_kesejahteraan_karyawan: shNet * 0.05,
    dana_pendidikan: shNet * 0.02,
    dana_sosial: shNet * 0.02,
    daerah_pembangunan_daerah_kerja: shNet * 0.01,
  } : null;

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');
  
  const hitungSHUAnggota = () => {
    if (!shuDistribution || shuDistribution.jasa_modal === 0 || shuDistribution.jasa_transaksi === 0) return [];
    
    const totalSimpananSemua = simpanans
      .filter(s => s.status === 'aktif')
      .reduce((sum, s) => sum + s.jumlah, 0);
    
    const totalPinjamanSemua = pinjamans
      .filter(p => p.status === 'aktif')
      .reduce((sum, p) => sum + p.jumlah, 0);
    
    return anggotaAktif.map(ag => {
      const simpananAnggota = simpanans
        .filter(s => s.anggotaId === ag.id && s.status === 'aktif')
        .reduce((sum, s) => sum + s.jumlah, 0);
      
      const pinjamanAnggota = pinjamans
        .filter(p => p.anggotaId === ag.id && p.status === 'aktif')
        .reduce((sum, p) => sum + p.jumlah, 0);
      
      const jasaModal = totalSimpananSemua > 0 
        ? (simpananAnggota / totalSimpananSemua) * shuDistribution.jasa_modal 
        : 0;
      
      const jasaTransaksi = totalPinjamanSemua > 0 
        ? (pinjamanAnggota / totalPinjamanSemua) * shuDistribution.jasa_transaksi 
        : 0;
      
      return {
        id: ag.id,
        nama: ag.nama,
        nomorNBA: ag.nomorNBA,
        simpanan: simpananAnggota,
        pinjaman: pinjamanAnggota,
        jasaModal,
        jasaTransaksi,
        totalSHU: jasaModal + jasaTransaksi,
      };
    }).filter(a => a.totalSHU > 0).sort((a, b) => b.totalSHU - a.totalSHU);
  };

  const shuPerAnggota = hitungSHUAnggota();

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const tahunOptions = Array.from(new Set([
    ...anggota.map(a => a.tanggalJoin ? new Date(a.tanggalJoin).getFullYear() : 2024),
    ...pendapatans.map(p => new Date(p.tanggal).getFullYear()),
    ...pengeluarans.map(p => new Date(p.tanggal).getFullYear()),
  ])).sort((a, b) => b - a);

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h1>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="ml-auto border p-2 rounded"
        >
          {tahunOptions.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <p className="text-slate-500 mb-4">KSP Mulia Dana Sejahtera - per {today}</p>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">📊 NERACA PER TAHUN {selectedYear}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-blue-700 text-sm font-medium">Pendapatan Tahun {selectedYear}</p>
            <p className="text-xl font-bold text-blue-800">{formatRupiah(pendapatanPerTahun)}</p>
            <p className="text-xs text-blue-600 mt-1">{pendapatans.filter(p => new Date(p.tanggal).getFullYear() === selectedYear).length} transaksi</p>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="text-red-700 text-sm font-medium">Pengeluaran Tahun {selectedYear}</p>
            <p className="text-xl font-bold text-red-800">{formatRupiah(pengeluaranPerTahun)}</p>
            <p className="text-xs text-red-600 mt-1">{pengeluarans.filter(p => new Date(p.tanggal).getFullYear() === selectedYear).length} transaksi</p>
          </div>
          <div className={`p-3 rounded ${shNetPerTahun >= 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
            <p className={`text-sm font-medium ${shNetPerTahun >= 0 ? 'text-green-700' : 'text-orange-700'}`}>SHU Tahun {selectedYear}</p>
            <p className={`text-xl font-bold ${shNetPerTahun >= 0 ? 'text-green-800' : 'text-orange-800'}`}>{formatRupiah(shNetPerTahun)}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <p className="text-purple-700 text-sm font-medium">Total Semua Pendapatan</p>
            <p className="text-xl font-bold text-purple-800">{formatRupiah(totalPendapatan)}</p>
            <p className="text-xs text-purple-600 mt-1">Semua tahun</p>
          </div>
        </div>
      </div>

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
            <p className="flex justify-between"><span>Pinjaman Aktif</span><span className="text-blue-600">{formatRupiah(totalPinjamanAktif)}</span></p>
            <p className="flex justify-between text-slate-500"><span>Pinjaman Lunas</span><span>{pinjamans.filter(p => p.status === 'lunas').length} akun</span></p>
            <p className="flex justify-between text-slate-500"><span>Pinjaman Macet</span><span>{pinjamans.filter(p => p.status === 'macet').length} akun</span></p>
            <p className="flex justify-between font-bold border-t pt-1"><span>TOTAL PIUTANG</span><span>{formatRupiah(totalPinjamanAktif + totalPinjamanLunas + totalPinjamanMacet)}</span></p>
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

      {shuDistribution && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PEMBAGIAN SHU (SISA HASIL USAHA)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-slate-500 text-xs">Dana Cadangan Umum (5%)</p>
              <p className="font-bold">{formatRupiah(shuDistribution.dana_cadangan_umum)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-slate-500 text-xs">Dana Cadangan Resiko (5%)</p>
              <p className="font-bold">{formatRupiah(shuDistribution.dana_cadangan_resiko)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-green-700 text-xs">Jasa Modal (55%)</p>
              <p className="font-bold text-green-700">{formatRupiah(shuDistribution.jasa_modal)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-blue-700 text-xs">Jasa Transaksi (20%)</p>
              <p className="font-bold text-blue-700">{formatRupiah(shuDistribution.jasa_transaksi)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <p className="text-yellow-700 text-xs">Dana Pengurus/Pengawas (5%)</p>
              <p className="font-bold text-yellow-700">{formatRupiah(shuDistribution.dana_pengurus_pengawas)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-purple-700 text-xs">Dana Kesejahteraan Karyawan (5%)</p>
              <p className="font-bold text-purple-700">{formatRupiah(shuDistribution.dana_kesejahteraan_karyawan)}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded">
              <p className="text-orange-700 text-xs">Dana Pendidikan (2%)</p>
              <p className="font-bold text-orange-700">{formatRupiah(shuDistribution.dana_pendidikan)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="text-red-700 text-xs">Dana Sosial (2%)</p>
              <p className="font-bold text-red-700">{formatRupiah(shuDistribution.dana_sosial)}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded">
              <p className="text-teal-700 text-xs">Daerah Pembangunan Daerah Kerja (1%)</p>
              <p className="font-bold text-teal-700">{formatRupiah(shuDistribution.daerah_pembangunan_daerah_kerja)}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t text-center">
            <p className="text-slate-600">Total Pembagian SHU</p>
            <p className="text-xl font-bold text-slate-800">{formatRupiah(shNet)}</p>
          </div>
        </div>
      )}

      {shuPerAnggota.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">SHU PER ANGGOTA</h2>
          <p className="text-sm text-slate-500 mb-3">
            Berdasarkan proporsi simpanan (Jasa Modal) dan pinjaman (Jasa Transaksi)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-center p-2 w-12">No</th>
                  <th className="text-left p-2">Nama Anggota</th>
                  <th className="text-left p-2">NBA</th>
                  <th className="text-right p-2">Simpanan</th>
                  <th className="text-right p-2">Pinjaman</th>
                  <th className="text-right p-2">Jasa Modal</th>
                  <th className="text-right p-2">Jasa Transaksi</th>
                  <th className="text-right p-2 font-bold">Total SHU</th>
                </tr>
              </thead>
              <tbody>
                {shuPerAnggota.map((a, index) => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 text-center text-slate-500">{index + 1}</td>
                    <td className="p-2 font-medium">{a.nama}</td>
                    <td className="p-2">{a.nomorNBA || '-'}</td>
                    <td className="p-2 text-right">{formatRupiah(a.simpanan)}</td>
                    <td className="p-2 text-right">{formatRupiah(a.pinjaman)}</td>
                    <td className="p-2 text-right text-green-600">{formatRupiah(a.jasaModal)}</td>
                    <td className="p-2 text-right text-blue-600">{formatRupiah(a.jasaTransaksi)}</td>
                    <td className="p-2 text-right font-bold text-green-700">{formatRupiah(a.totalSHU)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold">
                <tr>
                  <td colSpan={4} className="p-2 text-right">TOTAL</td>
                  <td className="p-2 text-right">{formatRupiah(shuPerAnggota.reduce((s, a) => s + a.simpanan, 0))}</td>
                  <td className="p-2 text-right">{formatRupiah(shuPerAnggota.reduce((s, a) => s + a.pinjaman, 0))}</td>
                  <td className="p-2 text-right">{formatRupiah(shuPerAnggota.reduce((s, a) => s + a.jasaModal, 0))}</td>
                  <td className="p-2 text-right">{formatRupiah(shuPerAnggota.reduce((s, a) => s + a.jasaTransaksi, 0))}</td>
                  <td className="p-2 text-right text-green-700">{formatRupiah(shuPerAnggota.reduce((s, a) => s + a.totalSHU, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}