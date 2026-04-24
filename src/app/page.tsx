'use client';

import { useState, useEffect } from 'react';
import { useKSP } from '@/context/KSPContext';
import Link from 'next/link';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const { anggota, pinjamans, simpanans, transactions, pendapatans, pengeluarans, getLaporanKeuangan, seedSampleData } = useKSP();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const laporan = getLaporanKeuangan();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 8);

  const pinjamansAktif = pinjamans.filter(p => p.status === 'aktif');
  const pinjamansLunas = pinjamans.filter(p => p.status === 'lunas');
  const totalPinjamanCount = pinjamans.length;
  
  const simpananWajib = simpanans.filter(s => s.jenis === 'wajib' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const simpananPokok = simpanans.filter(s => s.jenis === 'pokok' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const simpananSibuhar = simpanans.filter(s => s.jenis === 'sibuhar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const simpananSimapan = simpanans.filter(s => s.jenis === 'simapan' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const simpananSihat = simpanans.filter(s => s.jenis === 'sihat' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const simpananSihar = simpanans.filter(s => s.jenis === 'sihar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0);
  const totalSimpanan = simpananWajib + simpananPokok + simpananSibuhar + simpananSimapan + simpananSihat + simpananSihar;

  const totalPendapatan = pendapatans
    .filter(p => new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluarans
    .filter(p => new Date(p.tanggal).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.jumlah, 0);
  const shu = totalPendapatan - totalPengeluaran;

  const totalPinjamanAktif = pinjamans
    .filter(p => p.status === 'aktif')
    .reduce((sum, p) => sum + p.jumlah, 0);
  const ldr = totalSimpanan > 0 ? (totalPinjamanAktif / totalSimpanan) * 100 : 0;

  const anggotaAktif = anggota.filter(a => a.status === 'aktif').length;
  const anggotaNonaktif = anggota.filter(a => a.status === 'nonaktif').length;

  const getYearStats = (year: number) => {
    const months: { name: string; masuk: number; keluar: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let month = 0; month < 12; month++) {
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
      
      months.push({ name: monthNames[month], masuk, keluar });
    }
    return months;
  };

  const availableYears = Array.from(new Set([
    ...anggota.map(a => a.tanggalJoin ? new Date(a.tanggalJoin).getFullYear() : new Date().getFullYear()),
    ...anggota.filter(a => a.tanggalKeluar).map(a => new Date(a.tanggalKeluar!).getFullYear())
  ])).sort((a, b) => b - a);

  const yearStats = getYearStats(selectedYear);
  const currentYearMasuk = yearStats.reduce((s, m) => s + m.masuk, 0);
  const currentYearKeluar = yearStats.reduce((s, m) => s + m.keluar, 0);

  const maxTransaction = Math.max(...recentTransactions.map(t => t.jumlah), 1);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Logo Placeholder - Ganti src dengan URL logo Anda */}
            <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/30">
              <span className="text-3xl">🏢</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">KSP Mulia Dana Sejahtera</h1>
              <p className="text-blue-100 mt-1 text-sm md:text-base">Koperasi Simpanan Pinjaman - Dashboard Monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">Tanggal</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Anggota Aktif</p>
              <p className="text-2xl font-bold text-slate-800">{anggotaAktif}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Anggota Keluar</p>
              <p className="text-2xl font-bold text-slate-800">{anggotaNonaktif}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Masuk {selectedYear}</p>
              <p className="text-2xl font-bold text-green-600">{currentYearMasuk}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">anggota baru</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-red-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Keluar {selectedYear}</p>
              <p className="text-2xl font-bold text-red-600">{currentYearKeluar}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">anggota keluar</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Total Simpanan</p>
              <p className="text-xl font-bold text-slate-800">{formatRupiah(totalSimpanan)}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">semua jenis</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Pinjaman Aktif</p>
              <p className="text-xl font-bold text-slate-800">{formatRupiah(laporan.totalPinjamanAktif)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{pinjamansAktif.length} pinjaman</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-indigo-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">SHU {selectedYear}</p>
              <p className={`text-xl font-bold ${shu >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatRupiah(shu)}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">laba tahun berjalan</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-t-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">LDR</p>
              <p className={`text-xl font-bold ${ldr <= 80 ? 'text-green-600' : ldr <= 100 ? 'text-yellow-600' : 'text-red-600'}`}>
                {ldr.toFixed(1)}%
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">pinjaman / simpanan</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
        <div className="flex flex-wrap gap-3">
          <Link href="/anggota" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-sm font-medium">Tambah Anggota</span>
          </Link>
          <Link href="/simpanan" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Tambah Simpanan</span>
          </Link>
          <Link href="/pinjaman" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">Ajukan Pinjaman</span>
          </Link>
          <Link href="/transaksi" className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium">Transaksi</span>
          </Link>
          <Link href="/laporan" className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">Laporan</span>
          </Link>
          <Link href="/audit-logs" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 5 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm font-medium">Audit Logs</span>
          </Link>
          <button
            onClick={async () => {
              const XLSX = await import('xlsx');

              // Prepare anggota data with simpanan
              const anggotaData = anggota.map(ag => {
                const agSimpanans = simpanans.filter(s => s.anggotaId === ag.id && s.status !== 'ditarik');
                return {
                  'No. NBA': ag.nama,
                  'Nama': ag.nama,
                  'NIK': ag.nik || '',
                  'Status': ag.status,
                  'Tanggal Join': ag.tanggalJoin || '',
                  'Simpanan Pokok': agSimpanans.filter(s => s.jenis === 'pokok').reduce((sum, s) => sum + s.jumlah, 0),
                  'Simpanan Wajib': agSimpanans.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0),
                  'SBh - Simpanan Bunga Harian': agSimpanans.filter(s => s.jenis === 'sibuhar').reduce((sum, s) => sum + s.jumlah, 0),
                  'Simapan': agSimpanans.filter(s => s.jenis === 'simapan').reduce((sum, s) => sum + s.jumlah, 0),
                  'Sihat': agSimpanans.filter(s => s.jenis === 'sihat').reduce((sum, s) => sum + s.jumlah, 0),
                  'Sihar': agSimpanans.filter(s => s.jenis === 'sihar').reduce((sum, s) => sum + s.jumlah, 0),
                  'Total Simpanan': agSimpanans.reduce((sum, s) => sum + s.jumlah, 0),
                };
              });

              // Prepare pinjaman data
              const pinjamansData = pinjamans.map(p => {
                const ag = anggota.find(a => a.id === p.anggotaId);
                return {
                  'No. NBA': ag?.nomorNBA || '',
                  'Nama Anggota': ag?.nama || '',
                  'Jumlah Pinjaman': p.jumlah,
                  'Tanggal': p.tanggalPinjaman,
                  'Jangka Waktu': p.tenor,
                  'Bunga': p.bunga,
                  'Status': p.status,
                  'Angsuran per Bulan': p.jumlah / p.tenor,
                };
              });

              // Create workbook
              const wb = XLSX.utils.book_new();

              const wsAnggota = XLSX.utils.json_to_sheet(anggotaData);
              XLSX.utils.book_append_sheet(wb, wsAnggota, 'Anggota');

              const wsPinjaman = XLSX.utils.json_to_sheet(pinjamansData);
              XLSX.utils.book_append_sheet(wb, wsPinjaman, 'Pinjaman');

              // Add summary sheet
              const now = new Date();
              const dateStr = now.toLocaleDateString('id-ID').replace(/\//g, '-');
              const summaryData = [
                { 'Ringkasan': 'Total Anggota', 'Jumlah': anggota.length },
                { 'Ringkasan': 'Anggota Aktif', 'Jumlah': anggota.filter(a => a.status === 'aktif').length },
                { 'Ringkasan': 'Total Simpanan', 'Jumlah': simpanans.filter(s => s.status !== 'ditarik').reduce((sum, s) => sum + s.jumlah, 0) },
                { 'Ringkasan': 'Total Pinjaman Aktif', 'Jumlah': pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0) },
                { 'Ringkasan': 'Tanggal Backup', 'Jumlah': now.toLocaleString('id-ID') },
                { 'Ringkasan': 'Creator', 'Jumlah': 'Marwan Esra Bangun (MEB Tech)' },
              ];
              const wsSummary = XLSX.utils.json_to_sheet(summaryData);
              XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

              // Download
              XLSX.writeFile(wb, `BACKUP_KSP_MULIA_DANA_${dateStr}.xlsx`);
              alert('Data berhasil diamankan ke Excel, Bos!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span className="text-sm font-medium">Backup Data</span>
          </button>
          <button
            onClick={() => seedSampleData()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm font-medium">Restore Sample Data</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Simpanan Chart */}
        <div className="bg-white rounded-xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Komposisi Simpanan
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Simpanan Wajib', value: simpananWajib, color: 'bg-yellow-500' },
              { label: 'Simpanan Pokok', value: simpananPokok, color: 'bg-teal-500' },
              { label: 'SBH - Simpanan Bunga Harian', value: simpananSibuhar, color: 'bg-blue-500' },
              { label: 'Simapan', value: simpananSimapan, color: 'bg-purple-500' },
              { label: 'Sihat', value: simpananSihat, color: 'bg-indigo-500' },
              { label: 'Sihar', value: simpananSihar, color: 'bg-pink-500' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(item.value)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: totalSimpanan > 0 ? `${(item.value / totalSimpanan) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <span className="text-lg font-bold text-slate-800">Total: {formatRupiah(totalSimpanan)}</span>
          </div>
        </div>

        {/* Pinjaman Chart */}
        <div className="bg-white rounded-xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Status Pinjaman
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Aktif', value: pinjamansAktif.length, color: 'bg-blue-500', sub: formatRupiah(pinjamansAktif.reduce((s, p) => s + p.jumlah, 0)) },
              { label: 'Lunas', value: pinjamansLunas.length, color: 'bg-green-500', sub: formatRupiah(pinjamansLunas.reduce((s, p) => s + p.jumlah, 0)) },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.sub}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: totalPinjamanCount > 0 ? `${(item.value / totalPinjamanCount) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.value} pinjaman</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <span className="text-lg font-bold text-slate-800">Total: {formatRupiah(laporan.totalPinjamanAktif)}</span>
          </div>
        </div>
      </div>

      {/* Monthly Stats & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Chart */}
        <div className="bg-white rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Pergerakan Anggota {selectedYear}
            </h3>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-between h-40 gap-1">
            {yearStats.map((m, i) => {
              const maxVal = Math.max(...yearStats.map(x => Math.max(x.masuk, x.keluar)), 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex gap-0.5 justify-center h-28 items-end">
                    <div 
                      className="w-3 bg-green-500 rounded-t hover:bg-green-600 transition-colors" 
                      style={{ height: m.masuk > 0 ? `${(m.masuk / maxVal) * 100}%` : '4px' }}
                      title={`Masuk: ${m.masuk}`}
                    />
                    <div 
                      className="w-3 bg-red-400 rounded-t hover:bg-red-500 transition-colors" 
                      style={{ height: m.keluar > 0 ? `${(m.keluar / maxVal) * 100}%` : '4px' }}
                      title={`Keluar: ${m.keluar}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">{m.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded"></span> Masuk</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded"></span> Keluar</span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Transaksi Terbaru
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Belum ada transaksi</p>
            ) : (
              recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      t.jenis === 'simpanan' ? 'bg-green-100 text-green-600' :
                      t.jenis === 'pinjaman' ? 'bg-purple-100 text-purple-600' :
                      t.jenis === 'pembayaran' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t.jenis === 'simpanan' ? '↓' : t.jenis === 'pinjaman' ? '↑' : t.jenis === 'pembayaran' ? '↩' : '○'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 capitalize">{t.jenis}</p>
                      <p className="text-xs text-slate-500">{t.deskripsi}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{formatRupiah(t.jumlah)}</p>
                    <p className="text-xs text-slate-400">{new Date(t.tanggal).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Pendapatan</p>
              <p className="text-2xl font-bold">{formatRupiah(totalPendapatan)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <p className="text-green-100 text-xs mt-2">semua waktu</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Pengeluaran</p>
              <p className="text-2xl font-bold">{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
          <p className="text-red-100 text-xs mt-2">semua waktu</p>
        </div>

        <div className={`bg-gradient-to-br ${shu >= 0 ? 'from-indigo-500 to-indigo-600' : 'from-orange-500 to-orange-600'} rounded-xl p-5 shadow-lg text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Selisih (SHU)</p>
              <p className="text-2xl font-bold">{formatRupiah(shu)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-xs mt-2">pendapatan - biaya</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-slate-400 text-xs">
        <p className="font-semibold">KSP Mulia Dana Sejahtera © {new Date().getFullYear()}</p>
        <p className="mt-1">Jl. Veteran No. 85, Kel. Tambak Lau Mulgap I, Kec. Berastagi, Kab. Karo, Sumatera Utara 22152</p>
        <p>📧 koperasimuliads@gmail.com | 📱 089505117507</p>
        <p className="mt-2 text-slate-500">Powered by <span className="font-semibold text-blue-500">MEB Tech Solutions</span> | Created by Marwan Esra Bangun</p>
      </div>
    </div>
  );
}