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
  const [activeTab, setActiveTab] = useState<'neraca' | 'shu'>('neraca');

  const tahunOptions = Array.from(new Set([
    ...anggota.map(a => a.tanggalJoin ? new Date(a.tanggalJoin).getFullYear() : 2024),
    ...pendapatans.map(p => new Date(p.tanggal).getFullYear()),
    ...pengeluarans.map(p => new Date(p.tanggal).getFullYear()),
  ])).sort((a, b) => b - a);

  // ========== NERACA CALCULATIONS ==========
  
  // Calculate totals first
  const totalPinjamanAktif = pinjamans
    .filter(p => p.status === 'aktif')
    .reduce((sum, p) => sum + p.jumlah, 0);
  const totalPinjamanLunas = pinjamans
    .filter(p => p.status === 'lunas')
    .reduce((sum, p) => sum + p.jumlah, 0);
  const totalPinjamanMacet = pinjamans
    .filter(p => p.status === 'macet')
    .reduce((sum, p) => sum + p.jumlah, 0);
  
  // ASET
  const kas = simpanans.filter(s => s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const bank = 0;
  const piutangBunga = Math.round(totalPinjamanAktif * 0.01);
  const pinjamansByYear = pinjamans
    .filter(p => p.status === 'aktif' && new Date(p.tanggalPinjaman).getFullYear() <= selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
  const penyisihanPinjaman = Math.round(totalPinjamanAktif * 0.05);
  const asetTetap = 0;
  const tanah = 0;
  const bangunan = 0;
  const mesinKendaraan = 0;
  const inventaris = 0;
  const akumulasiPenyusutan = 0;

  // LIABILITAS
  const utangBunga = Math.round(totalPinjamanAktif * 0.12 / 12);
  const simpananHarian = simpanans.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
  const simpananBerencana = simpanans.filter(s => ['sibuhar', 'simapan', 'sihat', 'sihar'].includes(s.jenis)).reduce((sum, s) => sum + s.jumlah, 0);
  const simpananBerjangka = 0;
  const utangPinjaman = totalPinjamanAktif;

  // EKUITAS
  const simpananPokok = simpanans.filter(s => s.jenis === 'pokok').reduce((sum, s) => sum + s.jumlah, 0);
  const simpananWajib = simpanans.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
  const cadangan = 0;
  
  const pendapatanAll = pendapatans.reduce((sum, p) => sum + p.jumlah, 0);
  const pengeluaranAll = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);
  const shuTahunBerjalan = pendapatanAll - pengeluaranAll;

  // ========== PERHITUNGAN SHU ==========
  
  // PENDAPATAN (Partisipasi Anggota)
  const pendapatanBunga = pendapatans.filter(p => p.jenis === 'bunga_pinjaman').reduce((sum, p) => sum + p.jumlah, 0);
  const pendapatanUsahaLain = 0;
  const pendapatanAdmin = pendapatans.filter(p => p.jenis === 'administrasi_pengunduran_diri').reduce((sum, p) => sum + p.jumlah, 0);
  const pendapatanProvisi = 0;
  const pendapatanDenda = 0;
  const totalPendapatan = pendapatanBunga + pendapatanUsahaLain + pendapatanAdmin + pendapatanProvisi + pendapatanDenda;

  // BEBAN USAHA
  const bebanBungaSimpanan = Math.round(simpananHarian * 0.03); // Estimasi 3% per tahun
  const bebanBungaPinjaman = 0;
  const bebanGaji = pengeluarans.filter(p => p.jenis === 'gaji_karyawan').reduce((sum, p) => sum + p.jumlah, 0);
  const bebanAdminUmum = pengeluarans.filter(p => ['operasional', 'kantor', 'listrik', 'internet', 'atk', 'perawatan', 'pajak', 'bank', 'lainnya'].includes(p.jenis)).reduce((sum, p) => sum + p.jumlah, 0);
  const bebanPenyusutan = 0;
  const totalBeban = bebanBungaSimpanan + bebanBungaPinjaman + bebanGaji + bebanAdminUmum + bebanPenyusutan;

  const shuKotor = totalPendapatan - totalBeban;
  
  // SHU Distribution
  const shuDistribution = shuKotor > 0 ? {
    dana_cadangan_umum: shuKotor * 0.05,
    dana_cadangan_resiko: shuKotor * 0.05,
    jasa_modal: shuKotor * 0.55,
    jasa_transaksi: shuKotor * 0.20,
    dana_pengurus_pengawas: shuKotor * 0.05,
    dana_karyawan: shuKotor * 0.05,
    dana_pendidikan: shuKotor * 0.02,
    dana_sosial: shuKotor * 0.02,
    dana_pembangunan: shuKotor * 0.01,
  } : null;

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
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

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('neraca')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'neraca' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-600 border hover:bg-slate-50'
          }`}
        >
          📊 Posisi Keuangan (Neraca)
        </button>
        <button
          onClick={() => setActiveTab('shu')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'shu' 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-slate-600 border hover:bg-slate-50'
          }`}
        >
          📈 Perhitungan SHU (Laba/Rugi)
        </button>
      </div>

      {activeTab === 'neraca' ? (
        /* ========== NERACA ========== */
        <div className="space-y-6">
          {/* ASET */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
              <h2 className="text-white font-bold text-lg">I. ASET</h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b bg-slate-50">
                    <td className="p-2 font-medium text-slate-700">I.1ASET LANCAR</td>
                    <td className="p-2 text-right font-medium text-slate-700">SALDO</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.1 Kas</td>
                    <td className="p-2 text-right">{formatRupiah(kas)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.2 Bank</td>
                    <td className="p-2 text-right">{formatRupiah(bank)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.3 Piutang Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(piutangBunga)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.4 Pinjaman Anggota</td>
                    <td className="p-2 text-right font-medium text-blue-600">{formatRupiah(pinjamansByYear)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.5 Penyisihan Pinjaman (Kontra)</td>
                    <td className="p-2 text-right text-red-500">({formatRupiah(penyisihanPinjaman)})</td>
                  </tr>
                  <tr className="border-b bg-slate-50">
                    <td className="p-2 font-medium text-slate-700">I.2 ASET TETAP</td>
                    <td className="p-2 text-right font-medium text-slate-700">SALDO</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.8 Aset Tetap</td>
                    <td className="p-2 text-right">{formatRupiah(asetTetap)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.9 Tanah</td>
                    <td className="p-2 text-right">{formatRupiah(tanah)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.10 Bangunan</td>
                    <td className="p-2 text-right">{formatRupiah(bangunan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.11 Mesin dan Kendaraan</td>
                    <td className="p-2 text-right">{formatRupiah(mesinKendaraan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.12 Inventaris & Peralatan Kantor</td>
                    <td className="p-2 text-right">{formatRupiah(inventaris)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">I.1.13 Akumulasi Penyusutan (Kontra)</td>
                    <td className="p-2 text-right text-red-500">({formatRupiah(akumulasiPenyusutan)})</td>
                  </tr>
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-3">TOTAL ASET</td>
                    <td className="p-3 text-right text-blue-700">{formatRupiah(kas + bank + piutangBunga + pinjamansByYear - penyisihanPinjaman)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* LIABILITAS */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <h2 className="text-white font-bold text-lg">II. LIABILITAS</h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b bg-slate-50">
                    <td className="p-2 font-medium text-slate-700">II.2 LIABILITAS</td>
                    <td className="p-2 text-right font-medium text-slate-700">SALDO</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">II.2.1 Utang Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(utangBunga)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">II.2.2.1 Simpanan Harian</td>
                    <td className="p-2 text-right">{formatRupiah(simpananHarian)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">II.2.2.2 Simpanan Berencana</td>
                    <td className="p-2 text-right">{formatRupiah(simpananBerencana)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">II.2.2.3 Simpanan Berjangka</td>
                    <td className="p-2 text-right">{formatRupiah(simpananBerjangka)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">II.2.4 Utang Pinjaman</td>
                    <td className="p-2 text-right text-red-600">{formatRupiah(utangPinjaman)}</td>
                  </tr>
                  <tr className="bg-red-50 font-bold">
                    <td className="p-3">TOTAL LIABILITAS</td>
                    <td className="p-3 text-right text-red-700">{formatRupiah(utangBunga + simpananHarian + simpananBerencana + simpananBerjangka + utangPinjaman)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* EKUITAS */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <h2 className="text-white font-bold text-lg">III. EKUITAS</h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b bg-slate-50">
                    <td className="p-2 font-medium text-slate-700">III.3 EKUITAS</td>
                    <td className="p-2 text-right font-medium text-slate-700">SALDO</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">III.3.1 Simpanan Pokok (Modal Tetap)</td>
                    <td className="p-2 text-right">{formatRupiah(simpananPokok)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">III.3.2 Simpanan Wajib (Modal Tambahan)</td>
                    <td className="p-2 text-right">{formatRupiah(simpananWajib)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">III.3.3 Cadangan</td>
                    <td className="p-2 text-right">{formatRupiah(cadangan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">III.3.5 Sisa Hasil Usaha (SHU)</td>
                    <td className="p-2 text-right text-green-600 font-medium">{formatRupiah(shuTahunBerjalan)}</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td className="p-3">TOTAL EKUITAS</td>
                    <td className="p-3 text-right text-green-700">{formatRupiah(simpananPokok + simpananWajib + cadangan + shuTahunBerjalan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CHECK BALANCE */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="font-bold">TOTAL LIABILITAS + EKUITAS</span>
              <span className="text-xl font-bold">
                {formatRupiah((utangBunga + simpananHarian + simpananBerencana + simpananBerjangka + utangPinjaman) + (simpananPokok + simpananWajib + cadangan + shuTahunBerjalan))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ========== PERHITUNGAN SHU ========== */
        <div className="space-y-6">
          {/* PENDAPATAN */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <h2 className="text-white font-bold text-lg">IV. PARTISIPASI ANGGOTA (PENDAPATAN)</h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 pl-6">IV.1.1 Pendapatan Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanBunga)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">IV.1.2 Pendapatan Usaha Lain</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanUsahaLain)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">IV.1.3 Pendapatan Administrasi</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanAdmin)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">IV.1.4 Pendapatan Provisi</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanProvisi)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">IV.1.5 Pendapatan Denda</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanDenda)}</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td className="p-3">JUMLAH PENDAPATAN</td>
                    <td className="p-3 text-right text-green-700">{formatRupiah(totalPendapatan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BEBAN USAHA */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <h2 className="text-white font-bold text-lg">V. BEBAN USAHA</h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 pl-6">V.1.1 Beban Bunga Simpanan Harian/Program</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaSimpanan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">V.1.4 Beban Bunga Pinjaman</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaPinjaman)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">V.1.5 Beban Kepegawaian (Gaji)</td>
                    <td className="p-2 text-right">{formatRupiah(bebanGaji)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">V.1.6 Beban Administrasi dan Umum</td>
                    <td className="p-2 text-right">{formatRupiah(bebanAdminUmum)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-6">V.1.7 Beban Penyusutan dan Amortisasi</td>
                    <td className="p-2 text-right">{formatRupiah(bebanPenyusutan)}</td>
                  </tr>
                  <tr className="bg-red-50 font-bold">
                    <td className="p-3">JUMLAH BEBAN USAHA</td>
                    <td className="p-3 text-right text-red-700">{formatRupiah(totalBeban)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SHU KOTOR */}
          <div className={`rounded-xl p-6 ${shuKotor >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
            <div className="flex justify-between items-center text-white">
              <span className="text-lg font-bold">SISA HASIL USAHA (SHU) KOTOR</span>
              <span className="text-2xl font-bold">{formatRupiah(shuKotor)}</span>
            </div>
          </div>

          {/* SHU DISTRIBUTION */}
          {shuDistribution && shuKotor > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                <h2 className="text-white font-bold text-lg">VI. PENYISIHAN & PEMBAGIAN SHU</h2>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Cadangan Umum (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_cadangan_umum)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Cadangan Risiko (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_cadangan_resiko)}</td>
                    </tr>
                    <tr className="border-b bg-yellow-50">
                      <td className="p-2 pl-6 font-medium">Jasa Modal (55%)</td>
                      <td className="p-2 text-right font-medium">{formatRupiah(shuDistribution.jasa_modal)}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <td className="p-2 pl-6 font-medium">Jasa Transaksi (20%)</td>
                      <td className="p-2 text-right font-medium">{formatRupiah(shuDistribution.jasa_transaksi)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Pengurus & Pengawas (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_pengurus_pengawas)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Kesejahteraan Karyawan (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_karyawan)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Pendidikan (2%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_pendidikan)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Sosial (2%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_sosial)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-6">Dana Pembangunan Daerah Kerja (1%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_pembangunan)}</td>
                    </tr>
                    <tr className="bg-purple-50 font-bold">
                      <td className="p-3">TOTAL PENYISIHAN</td>
                      <td className="p-3 text-right text-purple-700">{formatRupiah(shuKotor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}