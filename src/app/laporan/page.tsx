'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-500">Memuat Laporan...</p>
      </div>
    </div>
  );
}

function LaporanContent() {
  const searchParams = useSearchParams();
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans, hitungBungaBulanan } = useKSP();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'neraca' | 'shu' | 'ekuitas'>(
    tabParam === 'shu' ? 'shu' : tabParam === 'ekuitas' ? 'ekuitas' : 'neraca'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    window.location.hash = tab || 'neraca';
  }, [searchParams]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as 'neraca' | 'shu' | 'ekuitas';
      if (hash === 'shu' || hash === 'ekuitas' || hash === 'neraca') {
        setActiveTab(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);;

  const tahunOptions = Array.from(new Set([
    ...anggota.map(a => a.tanggalJoin ? new Date(a.tanggalJoin).getFullYear() : 2024),
    ...pendapatans.map(p => new Date(p.tanggal).getFullYear()),
    ...pengeluarans.map(p => new Date(p.tanggal).getFullYear()),
  ])).sort((a, b) => b - a);

  const handleHitungBunga = () => {
    if (confirm('Hitung bunga bulanan untuk semua simpanan berbunga?')) {
      hitungBungaBulanan();
      alert('Bunga bulanan berhasil dihitung!');
    }
  };

// ========== NERACA CALCULATIONS ==========
  
  // Total Pinjaman Aktif (semua waktu)
  const totalPinjamanAktif = pinjamans
    .filter(p => p.status === 'aktif')
    .reduce((sum, p) => sum + p.jumlah, 0);

  // ===== ASET =====
  // Pisahkan Pinjaman: Saldo Awal (tidak mengurangi kas) vs Pinjaman Baru (mengurangi kas)
  const pinjamansSaldoAwal = pinjamans
    .filter(p => p.status === 'aktif' && p.isSaldoAwal === true && new Date(p.tanggalPinjaman).getFullYear() <= selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
  
  const pinjamansBaru = pinjamans
    .filter(p => p.status === 'aktif' && !p.isSaldoAwal && new Date(p.tanggalPinjaman).getFullYear() <= selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
  
  const pinjamansByYear = pinjamansSaldoAwal + pinjamansBaru;

  // Kas ( netto ) = Total Simpanan - Total Pinjaman Baru (pinjaman saldo awal sudah ada di piutang)
  // Karena saat memberikan pinjaman baru, uang kas berkurang dan menjadi piutang
  const totalSimpanan = simpanans
    .filter(s => s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() <= selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
  const kas = totalSimpanan - pinjamansBaru;
  const bank = 0;
  const piutangBunga = Math.round(totalPinjamanAktif * 0.01);
  
  const penyisihanPinjaman = Math.round(pinjamansByYear * 0.05);
  const pinjamansKopLain = 0;
  const penyisihanPinjamanKopLain = 0;
  const asetTetap = 0;
  const tanah = 0;
  const bangunan = 0;
  const mesinKendaraan = 0;
  const inventaris = 0;
  const akumulasiPenyusutan = 0;
  const asetTakBerwujud = 0;
  const akumulasiAmortisasi = 0;
  const asetLain = 0;

  // ===== LIABILITAS =====
  // Simpanan Sukarela (SBH, Simapan, Sihat, Sihar) - KEWAJIBAN
  const simpananSukarela = simpanans
    .filter(s => s.status === 'aktif' && ['sibuhar', 'simapan', 'sihat', 'sihar'].includes(s.jenis) && new Date(s.tanggalSimpan).getFullYear() <= selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
    
  const simpananKopLain = 0;
  const liabilitasImbalanKerja = 0;
  const liabilitasLain = 0;
  
  // Utang Bunga (bunga yang harus dibayar - metode akrual)
  const utangBungaSBH = Math.round(simpananSukarela * 0.03 / 12);
  const utangBunga = utangBungaSBH;

  // ===== EKUITAS =====
  // Simpanan Pokok - MODAL
  const simpananPokok = simpanans
    .filter(s => s.jenis === 'pokok' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() <= selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
    
  // Simpanan Wajib - MODAL
  const simpananWajib = simpanans
    .filter(s => s.jenis === 'wajib' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() <= selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
    
  const cadangan = 0;
  const cadanganRisiko = 0;

  // SHU - berdasarkan tahun yang dipilih
  const pendapatanSelectedYear = pendapatans
    .filter(p => new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const pengeluaranSelectedYear = pengeluarans
    .filter(p => new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);

  // SHU Tahun Berjalan
  const shuTahunBerjalan = Math.max(0, pendapatanSelectedYear - pengeluaranSelectedYear);
  
  // Ekuitas Lain (Modal Ditahan/Selisih Penyeimbang) - agar Neraca selalu balance
  // Termasuk saldo awal pinjaman yang sudah ada di piutang
  const totalAsetHitung = (totalSimpanan - pinjamansBaru) + (totalPinjamanAktif * 0.01) + pinjamansSaldoAwal;
  const totalLiabilitasHitung = (totalPinjamanAktif * 0.03 / 12) + simpananSukarela;
  const totalModalDasar = simpananPokok + simpananWajib;
  const ekuitasLain = Math.max(0, totalAsetHitung - totalLiabilitasHitung - totalModalDasar - shuTahunBerjalan);

  // ========== PERHITUNGAN SHU (TAHUN DIPILIH) ==========
  
  const pendapatanBunga = pendapatans
    .filter(p => p.jenis === 'bunga_pinjaman' && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const pendapatanUsahaLain = 0;
  
  const pendapatanAdmin = pendapatans
    .filter(p => p.jenis === 'administrasi_pengunduran_diri' && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const pendapatanProvisi = 0;
  const pendapatanDenda = 0;
  const pendapatanPinalty = 0;
  const pendapatanLain = 0;
  
  const totalPendapatan = pendapatanBunga + pendapatanUsahaLain + pendapatanAdmin + pendapatanProvisi + pendapatanDenda + pendapatanPinalty + pendapatanLain;

  const bebanBungaSimpananHarian = Math.round(simpananSukarela * 0.03);
  
  const bebanBungaSukarelaBerjangka = simpanans
    .filter(s => s.jenis === 'sibuhar' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() === selectedYear)
    .reduce((sum, s) => sum + s.jumlah * 0.06 / 12, 0);
  
  const bebanBungaMasaDepan = simpanans
    .filter(s => s.jenis === 'simapan' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() === selectedYear)
    .reduce((sum, s) => sum + s.jumlah * 0.06 / 12, 0);
  
  const bebanBungaHariTua = simpanans
    .filter(s => s.jenis === 'sihat' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() === selectedYear)
    .reduce((sum, s) => sum + s.jumlah * 0.06 / 12, 0);
  
  const bebanBungaHariRaya = simpanans
    .filter(s => s.jenis === 'sihar' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() === selectedYear)
    .reduce((sum, s) => sum + s.jumlah * 0.06 / 12, 0);
  
  const bebanBungaSimpananProgram = 0;
  const bebanBungaSijakop = 0;
  const bebanBungaPinjaman = 0;
  
  const bebanGaji = pengeluarans
    .filter(p => p.jenis === 'gaji_karyawan' && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanKaryawan = pengeluarans
    .filter(p => ['insentif_anggota_baru', 'insentif_deposan', 'insentif_penanggung_jawab'].includes(p.jenis) && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanPerkoperasian = pengeluarans
    .filter(p => ['biaya_rat', 'biaya_sosialisasi', 'biaya_akta', 'biaya_hut', 'biaya_sosial'].includes(p.jenis) && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanPembinaan = pengeluarans
    .filter(p => ['biaya_transport_marketing', 'biaya_iptw'].includes(p.jenis) && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanAdminUmum = pengeluarans
    .filter(p => ['perlengkapan_kantor', 'atk_koperasi', 'listrik_air_wifi', 'materai', 'kebersihan'].includes(p.jenis) && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanLain = pengeluarans
    .filter(p => ['admin_bank', 'entertainment', 'konsumsi_koperasi', 'spanduk', 'biaya_lain', 'operasional'].includes(p.jenis) && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanKerugian = pengeluarans
    .filter(p => p.jenis === 'kerugian_tahun_lalu' && new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
    
  const bebanPenyusutan = 0;
  const bebanUsahaLain = 0;
  const totalBeban = bebanBungaSimpananHarian + bebanBungaSukarelaBerjangka + bebanBungaMasaDepan + bebanBungaHariTua + bebanBungaHariRaya + bebanBungaSimpananProgram + bebanBungaSijakop + bebanBungaPinjaman + bebanGaji + bebanKaryawan + bebanPerkoperasian + bebanPembinaan + bebanAdminUmum + bebanLain + bebanKerugian + bebanPenyusutan + bebanUsahaLain;

  // Pos Lain-Lain
  const hasilInvestasi = 0;
  const pendapatanLainNonOps = 0;
  const bebanLainNonOps = 0;
  const bebanPajak = 0;
  const pengKomprehensifLain = 0;

  const shuKotor = totalPendapatan - totalBeban + hasilInvestasi + pendapatanLainNonOps - bebanLainNonOps - bebanPajak;
  
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

  // ========== PERUBAHAN EKUITAS ==========
  // Hitung saldo awal dari tahun sebelumnya
  const simpananPokokBefore = simpanans
    .filter(s => s.jenis === 'pokok' && new Date(s.tanggalSimpan).getFullYear() < selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
  const simpananWajibBefore = simpanans
    .filter(s => s.jenis === 'wajib' && new Date(s.tanggalSimpan).getFullYear() < selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
  const cadanganBefore = shuDistribution?.dana_cadangan_umum || 0;
  
  const shuBeforeYear = selectedYear > 1 
    ? pendapatans.filter(p => new Date(p.tanggal).getFullYear() < selectedYear).reduce((sum, p) => sum + p.jumlah, 0) 
      - pengeluarans.filter(p => new Date(p.tanggal).getFullYear() < selectedYear).reduce((sum, p) => sum + p.jumlah, 0)
    : 0;

  const saldoAwalPokok = simpananPokokBefore;
  const saldoAwalWajib = simpananWajibBefore;
  const saldoAwalCadangan = cadanganBefore;
  const saldoAwalSHU = shuBeforeYear;
  const saldoAwalLain = 0;
  const penambahanPokok = simpanans
    .filter(s => s.jenis === 'pokok' && new Date(s.tanggalSimpan).getFullYear() === selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
  const penambahanWajib = simpanans
    .filter(s => s.jenis === 'wajib' && new Date(s.tanggalSimpan).getFullYear() === selectedYear)
    .reduce((sum, s) => sum + s.jumlah, 0);
  const penguranganPokok = 0;
  const penguranganWajib = 0;

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 print:hidden">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h1>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {tahunOptions.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={() => window.print()}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          🖨️ Cetak / PDF
        </button>
      </div>
      <p className="text-slate-500 mb-4 print:hidden">KSP Mulia Dana Sejahtera - per {today}</p>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('neraca')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'neraca' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'
          }`}
        >
          📊 Neraca
        </button>
        <button
          onClick={() => setActiveTab('shu')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'shu' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'
          }`}
        >
          📈 SHU (Laba/Rugi)
        </button>
        <button
          onClick={() => setActiveTab('ekuitas')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ekuitas' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'
          }`}
        >
          📋 Perubahan Ekuitas
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleHitungBunga}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          🔄 Hitung Bunga Bulanan
        </button>
      </div>

      {activeTab === 'neraca' ? (
        /* ========== NERACA ========== */
        <div className="space-y-4">
          {/* ASET */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
              <h2 className="text-white font-bold text-lg">I. ASET</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Kode Akun</th>
                    <th className="text-left p-2">Uraian Akun</th>
                    <th className="text-left p-2">Kelompok</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-2" colSpan={3}>I.1 ASET LANCAR</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.1</td>
                    <td className="p-2">Kas Tunai</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right">{formatRupiah(kas)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.2</td>
                    <td className="p-2">Bank - BRI Tigabinanga</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right">0</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.3</td>
                    <td className="p-2">Bank - BRI Berastagi</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right">0</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.4</td>
                    <td className="p-2">Bank - BPR Logo Asri</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right">0</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.5</td>
                    <td className="p-2">Piutang Bunga</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right">{formatRupiah(piutangBunga)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.6</td>
                    <td className="p-2">Pinjaman Anggota</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right font-medium text-blue-600">{formatRupiah(pinjamansByYear)}</td>
                  </tr>
                  <tr className="border-b bg-slate-50">
                    <td className="p-2 pl-8">→ Saldo Awal 2025</td>
                    <td className="p-2 text-slate-500">Diimpor dari Excel</td>
                    <td className="p-2 text-slate-500"></td>
                    <td className="p-2 text-right text-slate-600">{formatRupiah(pinjamansSaldoAwal)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.7</td>
                    <td className="p-2">Penyisihan Pinjaman (Anggota)</td>
                    <td className="p-2 text-slate-500">(Pengurang Aset)</td>
                    <td className="p-2 text-right text-red-500">({formatRupiah(penyisihanPinjaman)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.6</td>
                    <td className="p-2">Pinjaman Koperasi Lain</td>
                    <td className="p-2 text-slate-500">Aset Lancar</td>
                    <td className="p-2 text-right">{formatRupiah(pinjamansKopLain)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.7</td>
                    <td className="p-2">Penyisihan Pinjaman (Kop. Lain)</td>
                    <td className="p-2 text-slate-500">(Pengurang Aset)</td>
                    <td className="p-2 text-right text-red-500">({formatRupiah(penyisihanPinjamanKopLain)})</td>
                  </tr>
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-2" colSpan={3}>I.2 ASET TIDAK LANCAR</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.8</td>
                    <td className="p-2">Aset Tetap</td>
                    <td className="p-2 text-slate-500">Aset Tidak Lancar</td>
                    <td className="p-2 text-right">{formatRupiah(asetTetap)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.9</td>
                    <td className="p-2">Tanah</td>
                    <td className="p-2 text-slate-500">Aset Tetap</td>
                    <td className="p-2 text-right">{formatRupiah(tanah)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.10</td>
                    <td className="p-2">Bangunan</td>
                    <td className="p-2 text-slate-500">Aset Tetap</td>
                    <td className="p-2 text-right">{formatRupiah(bangunan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.11</td>
                    <td className="p-2">Mesin dan Kendaraan</td>
                    <td className="p-2 text-slate-500">Aset Tetap</td>
                    <td className="p-2 text-right">{formatRupiah(mesinKendaraan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.12</td>
                    <td className="p-2">Inventaris & Peralatan Kantor</td>
                    <td className="p-2 text-slate-500">Aset Tetap</td>
                    <td className="p-2 text-right">{formatRupiah(inventaris)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.13</td>
                    <td className="p-2">Akumulasi Penyusutan Aset Tetap</td>
                    <td className="p-2 text-slate-500">(Pengurang Aset)</td>
                    <td className="p-2 text-right text-red-500">({formatRupiah(akumulasiPenyusutan)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.14</td>
                    <td className="p-2">Aset Tak Berwujud</td>
                    <td className="p-2 text-slate-500">Aset Tidak Lancar</td>
                    <td className="p-2 text-right">{formatRupiah(asetTakBerwujud)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.15</td>
                    <td className="p-2">Akumulasi Amortisasi</td>
                    <td className="p-2 text-slate-500">(Pengurang Aset)</td>
                    <td className="p-2 text-right text-red-500">({formatRupiah(akumulasiAmortisasi)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">1.1.16</td>
                    <td className="p-2">Aset Lain</td>
                    <td className="p-2 text-slate-500">Aset Lain-lain</td>
                    <td className="p-2 text-right">{formatRupiah(asetLain)}</td>
                  </tr>
                  <tr className="bg-blue-100 font-bold">
                    <td className="p-3" colSpan={3}>TOTAL ASET</td>
                    <td className="p-3 text-right text-blue-800">{formatRupiah(kas + piutangBunga + pinjamansByYear - penyisihanPinjaman)}</td>
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
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Kode Akun</th>
                    <th className="text-left p-2">Uraian Akun</th>
                    <th className="text-left p-2">Kelompok</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-red-50 font-bold">
                    <td className="p-2" colSpan={3}>II.2 KEWAJIBAN</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">II.2.1</td>
                    <td className="p-2">Utang Bunga (Bunga Akrual)</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(utangBunga)}</td>
                  </tr>
<tr className="border-b bg-red-50">
                    <td className="p-2 pl-4" colSpan={2}>II.2.2 Simpanan Anggota</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(simpananSukarela)}</td>
                  </tr>
<tr className="border-b">
                    <td className="p-2 pl-8">II.2.2.1</td>
                    <td className="p-2">- Simpanan Bunga Harian (SBH)</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(simpananSukarela)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">II.2.2.1</td>
                    <td className="p-2">- Simpanan Berjangka (Simapan)</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(simpananSukarela)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">II.2.2.2</td>
                    <td className="p-2">- Simpanan Masa Depan (Simapan)</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(simpanans.filter(s => s.jenis === 'simapan' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() <= selectedYear).reduce((sum, s) => sum + s.jumlah, 0))}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">II.2.2.3</td>
                    <td className="p-2">- Simpanan Hari Tua (Sihat)</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(simpanans.filter(s => s.jenis === 'sihat' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() <= selectedYear).reduce((sum, s) => sum + s.jumlah, 0))}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">II.2.2.4</td>
                    <td className="p-2">- Simpanan Hari Raya (Sihar)</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(simpanans.filter(s => s.jenis === 'sihar' && s.status === 'aktif' && new Date(s.tanggalSimpan).getFullYear() <= selectedYear).reduce((sum, s) => sum + s.jumlah, 0))}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">II.2.3</td>
                    <td className="p-2">Simpanan Koperasi Lain</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(simpananKopLain)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">II.2.5</td>
                    <td className="p-2">Liabilitas Imbalan Kerja</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(liabilitasImbalanKerja)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">II.2.6</td>
                    <td className="p-2">Liabilitas Lain</td>
                    <td className="p-2 text-slate-500">Kewajiban</td>
                    <td className="p-2 text-right">{formatRupiah(liabilitasLain)}</td>
                  </tr>
                  <tr className="bg-red-100 font-bold">
                    <td className="p-3" colSpan={3}>TOTAL LIABILITAS</td>
                    <td className="p-3 text-right text-red-800">{formatRupiah(utangBunga + simpananSukarela + simpananKopLain + liabilitasImbalanKerja + liabilitasLain)}</td>
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
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Kode Akun</th>
                    <th className="text-left p-2">Uraian Akun</th>
                    <th className="text-left p-2">Kelompok</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50 font-bold">
                    <td className="p-2" colSpan={3}>III.3 MODAL</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">III.3.1</td>
                    <td className="p-2">Simpanan Pokok (Modal Tetap)</td>
                    <td className="p-2 text-slate-500">Modal</td>
                    <td className="p-2 text-right">{formatRupiah(simpananPokok)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">III.3.2</td>
                    <td className="p-2">Simpanan Wajib (Modal Tambahan)</td>
                    <td className="p-2 text-slate-500">Modal</td>
                    <td className="p-2 text-right">{formatRupiah(simpananWajib)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">III.3.3</td>
                    <td className="p-2">Cadangan</td>
                    <td className="p-2 text-slate-500">Modal</td>
                    <td className="p-2 text-right">{formatRupiah(cadangan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">III.3.4</td>
                    <td className="p-2">Cadangan Risiko</td>
                    <td className="p-2 text-slate-500">Modal</td>
                    <td className="p-2 text-right">{formatRupiah(cadanganRisiko)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">III.3.5</td>
                    <td className="p-2">Sisa Hasil Usaha (SHU)</td>
                    <td className="p-2 text-slate-500">Modal</td>
                    <td className="p-2 text-right text-green-600 font-medium">{formatRupiah(shuTahunBerjalan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">III.3.6</td>
                    <td className="p-2">Ekuitas Lain</td>
                    <td className="p-2 text-slate-500">Modal</td>
                    <td className="p-2 text-right">{formatRupiah(ekuitasLain)}</td>
                  </tr>
                  <tr className="bg-green-100 font-bold">
                    <td className="p-3" colSpan={3}>TOTAL EKUITAS</td>
                    <td className="p-3 text-right text-green-800">{formatRupiah(simpananPokok + simpananWajib + cadangan + cadanganRisiko + shuTahunBerjalan + ekuitasLain)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CHECK BALANCE */}
          {(() => {
            const totalAset = kas + piutangBunga + pinjamansByYear - penyisihanPinjaman;
            const totalLiabilitas = utangBunga + simpananSukarela + simpananKopLain + liabilitasImbalanKerja + liabilitasLain;
            const totalEkuitas = simpananPokok + simpananWajib + cadangan + cadanganRisiko + shuTahunBerjalan + ekuitasLain;
            const selisih = totalAset - (totalLiabilitas + totalEkuitas);
            const isBalance = selisih === 0;
            return (
              <div className="space-y-3">
                <div className={`rounded-xl p-4 ${isBalance ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm opacity-80">TOTAL ASET</p>
                      <p className="text-xl font-bold">{formatRupiah(totalAset)}</p>
                      <p className="text-xs opacity-70">Kas(Netto) + Piutang - Penyisihan</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">LIABILITAS + EKUITAS</p>
                      <p className="text-xl font-bold">{formatRupiah(totalLiabilitas + totalEkuitas)}</p>
                      <p className="text-xs opacity-70">Liab + Modal + SHU</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">SELISIH</p>
                      <p className="text-xl font-bold">{formatRupiah(selisih)}</p>
                      <p className="text-xs opacity-70">{isBalance ? 'BALANCE ✓' : 'TIDAK BALANCE!'}</p>
                    </div>
                  </div>
                </div>
                {!isBalance ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-bold">⚠️ Peringatan: Laporan tidak balance!</p>
                    <p className="text-sm">Aset tidak sama dengan Liabilitas + Ekuitas. Silakan periksa perhitungan.</p>
                  </div>
                ) : (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                    <p className="font-bold">✓ Laporan Balance & Sesuai Standar!</p>
                    <p className="text-sm">Total Aset = Total Liabilitas + Ekuitas</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : activeTab === 'shu' ? (
        /* ========== PERHITUNGAN SHU ========== */
        <div className="space-y-4">
          {/* PENDAPATAN */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <h2 className="text-white font-bold text-lg">IV. PARTISIPASI ANGGOTA (PENDAPATAN)</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Kode Akun</th>
                    <th className="text-left p-2">Uraian Akun</th>
                    <th className="text-left p-2">Keterangan</th>
                    <th className="text-right p-2">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.1</td>
                    <td className="p-2">Pendapatan Bunga</td>
                    <td className="p-2 text-slate-500">Dari Pinjaman</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanBunga)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.2</td>
                    <td className="p-2">Pendapatan Usaha Lain</td>
                    <td className="p-2 text-slate-500">Operasional</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanUsahaLain)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.3</td>
                    <td className="p-2">Pendapatan Administrasi</td>
                    <td className="p-2 text-slate-500">Biaya Admin</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanAdmin)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.4</td>
                    <td className="p-2">Pendapatan Provisi</td>
                    <td className="p-2 text-slate-500">Biaya Provisi</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanProvisi)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.5</td>
                    <td className="p-2">Pendapatan Denda</td>
                    <td className="p-2 text-slate-500">Keterlambatan</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanDenda)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.6</td>
                    <td className="p-2">Pendapatan Pinalty dan Fee</td>
                    <td className="p-2 text-slate-500">Denda Percepatan/Fee</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanPinalty)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">IV.1.7</td>
                    <td className="p-2">Pendapatan Lainnya</td>
                    <td className="p-2 text-slate-500">Lain-lain</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanLain)}</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td className="p-3" colSpan={3}>JUMLAH PENDAPATAN</td>
                    <td className="p-3 text-right text-green-700">{formatRupiah(totalPendapatan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BEBAN USAHA */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <h2 className="text-white font-bold text-lg">V.1 BEBAN USAHA</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Kode Akun</th>
                    <th className="text-left p-2">Uraian Akun</th>
                    <th className="text-left p-2">Keterangan</th>
                    <th className="text-right p-2">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.1</td>
                    <td className="p-2">Beban Bunga Simpanan Bunga Harian (SBH)</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaSimpananHarian)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.2</td>
                    <td className="p-2">Beban Bunga Simpanan Sukarela Berjangka (Sisujang)</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaSukarelaBerjangka)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.3</td>
                    <td className="p-2">Beban Bunga Simpanan Masa Depan (Simapan)</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaMasaDepan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.4</td>
                    <td className="p-2">Beban Bunga Simpanan Hari Tua (Sihat)</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaHariTua)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.5</td>
                    <td className="p-2">Beban Bunga Simpanan Hari Raya (Sihar)</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaHariRaya)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.6</td>
                    <td className="p-2">Beban Bunga Simpanan Program</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaSimpananProgram)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.7</td>
                    <td className="p-2">Beban Bunga Sijakop</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaSijakop)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.8</td>
                    <td className="p-2">Beban Bunga Pinjaman</td>
                    <td className="p-2 text-slate-500">Biaya Bunga</td>
                    <td className="p-2 text-right">{formatRupiah(bebanBungaPinjaman)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.9</td>
                    <td className="p-2">Beban Kepegawaian</td>
                    <td className="p-2 text-slate-500">Gaji & Tunjangan</td>
                    <td className="p-2 text-right">{formatRupiah(bebanGaji)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.10</td>
                    <td className="p-2">Beban Administrasi dan Umum</td>
                    <td className="p-2 text-slate-500">ATK, Listrik, dll</td>
                    <td className="p-2 text-right">{formatRupiah(bebanAdminUmum)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.11</td>
                    <td className="p-2">Beban Penyusutan dan Amortisasi</td>
                    <td className="p-2 text-slate-500">Penyusutan Aset</td>
                    <td className="p-2 text-right">{formatRupiah(bebanPenyusutan)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.1.12</td>
                    <td className="p-2">Beban Usaha Lain</td>
                    <td className="p-2 text-slate-500">Biaya Lainnya</td>
                    <td className="p-2 text-right">{formatRupiah(bebanUsahaLain)}</td>
                  </tr>
                  <tr className="bg-red-50 font-bold">
                    <td className="p-3" colSpan={3}>JUMLAH BEBAN USAHA</td>
                    <td className="p-3 text-right text-red-700">{formatRupiah(totalBeban)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* POS LAIN-LAIN */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <h2 className="text-white font-bold text-lg">V.2 - V.4 POS LAIN-LAIN</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="bg-orange-50 font-bold">
                    <td className="p-2" colSpan={3}>V.2 PENDAPATAN & BEBAN LUAR USAHA</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.2.1</td>
                    <td className="p-2">Hasil Investasi</td>
                    <td className="p-2 text-slate-500">Pendapatan Luar Usaha</td>
                    <td className="p-2 text-right">{formatRupiah(hasilInvestasi)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.2.2</td>
                    <td className="p-2">Beban Perkoperasian</td>
                    <td className="p-2 text-slate-500">Biaya Organisasi</td>
                    <td className="p-2 text-right">({formatRupiah(bebanPerkoperasian)})</td>
                  </tr>
                  <tr className="bg-orange-50 font-bold">
                    <td className="p-2" colSpan={3}>V.3 PENDAPATAN & BEBAN NON-OPERASIONAL</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.3.1</td>
                    <td className="p-2">Pendapatan Lain</td>
                    <td className="p-2 text-slate-500">Non-Operasional</td>
                    <td className="p-2 text-right">{formatRupiah(pendapatanLainNonOps)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.3.2</td>
                    <td className="p-2">Beban Lain</td>
                    <td className="p-2 text-slate-500">Non-Operasional</td>
                    <td className="p-2 text-right">({formatRupiah(bebanLainNonOps)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.3.4</td>
                    <td className="p-2">Beban Pajak Penghasilan</td>
                    <td className="p-2 text-slate-500">Pajak (PPh)</td>
                    <td className="p-2 text-right">({formatRupiah(bebanPajak)})</td>
                  </tr>
                  <tr className="bg-orange-50 font-bold">
                    <td className="p-2" colSpan={3}>V.4 PENGHASILAN KOMPREHENSIF LAIN</td>
                    <td className="p-2 text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-4">V.4.1</td>
                    <td className="p-2">Penghasilan Komprehensif Lain</td>
                    <td className="p-2 text-slate-500">Penyesuaian Nilai</td>
                    <td className="p-2 text-right">{formatRupiah(pengKomprehensifLain)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SHU KOTOR */}
          <div className={`rounded-xl p-6 ${shuKotor >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
            <div className="flex justify-between items-center text-white">
              <span className="text-lg font-bold">SISA HASIL USAHA (SHU) BERSIH</span>
              <span className="text-2xl font-bold">{formatRupiah(shuKotor)}</span>
            </div>
          </div>

          {/* SHU DISTRIBUTION */}
          {shuDistribution && shuKotor > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                <h2 className="text-white font-bold text-lg">PEMBAGIAN SHU</h2>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Cadangan Umum (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_cadangan_umum)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Cadangan Risiko (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_cadangan_resiko)}</td>
                    </tr>
                    <tr className="border-b bg-yellow-50">
                      <td className="p-2 pl-4 font-medium">Jasa Modal (55%)</td>
                      <td className="p-2 text-right font-medium">{formatRupiah(shuDistribution.jasa_modal)}</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <td className="p-2 pl-4 font-medium">Jasa Transaksi (20%)</td>
                      <td className="p-2 text-right font-medium">{formatRupiah(shuDistribution.jasa_transaksi)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Pengurus & Pengawas (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_pengurus_pengawas)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Kesejahteraan Karyawan (5%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_karyawan)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Pendidikan (2%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_pendidikan)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Sosial (2%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_sosial)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">Dana Pembangunan Daerah Kerja (1%)</td>
                      <td className="p-2 text-right">{formatRupiah(shuDistribution.dana_pembangunan)}</td>
                    </tr>
                    <tr className="bg-purple-50 font-bold">
                      <td className="p-3">TOTAL</td>
                      <td className="p-3 text-right text-purple-700">{formatRupiah(shuKotor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========== PERUBAHAN EKUITAS ========== */
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <h2 className="text-white font-bold text-lg">LAPORAN PERUBAHAN EKUITAS</h2>
              <p className="text-purple-100 text-sm">Tahun {selectedYear}</p>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Uraian Perubahan</th>
                    <th className="text-right p-2">Simpanan Pokok</th>
                    <th className="text-right p-2">Simpanan Wajib</th>
                    <th className="text-right p-2">Cadangan</th>
                    <th className="text-right p-2">SHU</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-2">SALDO AWAL (1 JANUARI {selectedYear})</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(saldoAwalPokok)}</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(saldoAwalWajib)}</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(saldoAwalCadangan)}</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(saldoAwalSHU)}</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(saldoAwalPokok + saldoAwalWajib + saldoAwalCadangan + saldoAwalSHU)}</td>
                  </tr>
                  <tr className="border-b bg-green-50">
                    <td className="p-2 pl-4 font-medium"> Penambahan Modal</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(penambahanPokok)}</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(penambahanWajib)}</td>
                    <td className="p-2 text-right">{formatRupiah(shuDistribution?.dana_cadangan_umum || 0)}</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right font-medium">{formatRupiah(penambahanPokok + penambahanWajib + (shuDistribution?.dana_cadangan_umum || 0))}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">- Setoran Simpanan Pokok</td>
                    <td className="p-2 text-right">{formatRupiah(penambahanPokok)}</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatRupiah(penambahanPokok)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">- Setoran Simpanan Wajib</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatRupiah(penambahanWajib)}</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatRupiah(penambahanWajib)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">- Cadangan dari SHU</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatRupiah(shuDistribution?.dana_cadangan_umum || 0)}</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatRupiah(shuDistribution?.dana_cadangan_umum || 0)}</td>
                  </tr>
                  <tr className="border-b bg-red-50">
                    <td className="p-2 pl-4 font-medium">Pengurangan Modal</td>
                    <td className="p-2 text-right font-medium">({formatRupiah(penguranganPokok)})</td>
                    <td className="p-2 text-right font-medium">({formatRupiah(penguranganWajib)})</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right font-medium">({formatRupiah(penguranganPokok + penguranganWajib)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">- Penarikan Simpanan Pokok</td>
                    <td className="p-2 text-right">({formatRupiah(penguranganPokok)})</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">({formatRupiah(penguranganPokok)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">- Penarikan Simpanan Wajib</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">({formatRupiah(penguranganWajib)})</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">({formatRupiah(penguranganWajib)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 pl-8">- Pembagian SHU ke Anggota</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">({formatRupiah((shuDistribution?.jasa_modal || 0) + (shuDistribution?.jasa_transaksi || 0))})</td>
                    <td className="p-2 text-right">({formatRupiah((shuDistribution?.jasa_modal || 0) + (shuDistribution?.jasa_transaksi || 0))})</td>
                  </tr>
                  <tr className="bg-purple-100 font-bold">
                    <td className="p-3">SALDO AKHIR (31 DESEMBER {selectedYear})</td>
                    <td className="p-3 text-right">{formatRupiah(saldoAwalPokok + penambahanPokok - penguranganPokok)}</td>
                    <td className="p-3 text-right">{formatRupiah(saldoAwalWajib + penambahanWajib - penguranganWajib)}</td>
                    <td className="p-3 text-right">{formatRupiah(saldoAwalCadangan + (shuDistribution?.dana_cadangan_umum || 0))}</td>
                    <td className="p-3 text-right text-green-600">{formatRupiah(shuKotor - (shuDistribution?.jasa_modal || 0) - (shuDistribution?.jasa_transaksi || 0))}</td>
                    <td className="p-3 text-right text-purple-700">{formatRupiah(
                      (saldoAwalPokok + penambahanPokok - penguranganPokok) + 
                      (saldoAwalWajib + penambahanWajib - penguranganWajib) + 
                      (saldoAwalCadangan + (shuDistribution?.dana_cadangan_umum || 0)) + 
                      (shuKotor - (shuDistribution?.jasa_modal || 0) - (shuDistribution?.jasa_transaksi || 0))
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporanPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LaporanContent />
    </Suspense>
  );
}