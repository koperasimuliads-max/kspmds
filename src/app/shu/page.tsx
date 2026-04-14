'use client';

import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function SHUPerAnggotaPage() {
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans, addPendapatan } = useKSP();

  // Hitung total
  const totalPendapatan = pendapatans.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);
  const shNet = totalPendapatan - totalPengeluaran;

  // Total simpanan dari table simpanan (status aktif)
  const totalSimpananTable = simpanans
    .filter(s => s.status === 'aktif')
    .reduce((sum, s) => sum + s.jumlah, 0);
  
  // Total simpanan pokok & wajib dari anggota (setoran awal)
  const totalSimpananAwal = anggota.reduce((sum, a) => sum + (a.simpananPokok || 0) + (a.simpananWajib || 0), 0);
  
  // Total simpanan = table simpanan + setoran awal anggota
  const totalSimpananSemua = totalSimpananTable + totalSimpananAwal;
  
  // Total pinjaman aktif
  const totalPinjamanSemua = pinjamans
    .filter(p => p.status === 'aktif')
    .reduce((sum, p) => sum + p.jumlah, 0);

  // Hitung SHU distribution (tetapHitung即使SHU 0)
  const distribution = {
    dana_cadangan_umum: shNet * 0.05,
    dana_cadangan_resiko: shNet * 0.05,
    jasa_modal: shNet * 0.55,
    jasa_transaksi: shNet * 0.20,
    dana_pengurus_pengawas: shNet * 0.05,
    dana_kesejahteraan_karyawan: shNet * 0.05,
    dana_pendidikan: shNet * 0.02,
    dana_sosial: shNet * 0.02,
    daerah_pembangunan_daerah_kerja: shNet * 0.01,
  };

  // Hitung SHU per anggota (selaluHitungagarBisa debug)
  const perAnggota = anggota.map(ag => {
    // Simpanan dari table simpanan
    const simpananDariTable = simpanans
      .filter(s => s.anggotaId === ag.id && s.status === 'aktif')
      .reduce((sum, s) => sum + s.jumlah, 0);
    
    // Total simpanan = setoran awal (pokok+wajib) + simpanan dari table
    const simpananTotal = simpananDariTable + (ag.simpananPokok || 0) + (ag.simpananWajib || 0);
    
    // Pinjaman aktif
    const pinjaman = pinjamans
      .filter(p => p.anggotaId === ag.id && p.status === 'aktif')
      .reduce((sum, p) => sum + p.jumlah, 0);
    
    // Hitung jasa modal & transaksi
    const jasaModal = totalSimpananSemua > 0 && simpananTotal > 0
      ? (simpananTotal / totalSimpananSemua) * distribution.jasa_modal
      : 0;
    
    const jasaTransaksi = totalPinjamanSemua > 0 && pinjaman > 0
      ? (pinjaman / totalPinjamanSemua) * distribution.jasa_transaksi
      : 0;
    
    return {
      id: ag.id,
      nama: ag.nama,
      nomorNBA: ag.nomorNBA,
      status: ag.status,
      simpananPokok: ag.simpananPokok || 0,
      simpananWajib: ag.simpananWajib || 0,
      simpananTable: simpananDariTable,
      simpananTotal,
      pinjaman,
      jasaModal,
      jasaTransaksi,
      totalSHU: jasaModal + jasaTransaksi,
    };
  }).sort((a, b) => b.totalSHU - a.totalSHU);

  const totalJasaModal = perAnggota.reduce((s, a) => s + a.jasaModal, 0);
  const totalJasaTransaksi = perAnggota.reduce((s, a) => s + a.jasaTransaksi, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">SHU Per Anggota</h1>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-blue-800 mb-3">📊 RINGKASAN DATA KSP</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded">
            <p className="text-slate-500 text-xs">Total Anggota</p>
            <p className="text-xl font-bold">{anggota.length}</p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="text-slate-500 text-xs">Total Pendapatan</p>
            <p className="text-xl font-bold text-green-600">{formatRupiah(totalPendapatan)}</p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="text-slate-500 text-xs">Total Pengeluaran</p>
            <p className="text-xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="text-slate-500 text-xs">SHU (Laba Bersih)</p>
            <p className="text-xl font-bold text-blue-600">{formatRupiah(shNet)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>💵 Simpanan Pokok+Wajib: <span className="font-semibold">{formatRupiah(totalSimpananAwal)}</span></div>
          <div>💵 Simpanan Table: <span className="font-semibold">{formatRupiah(totalSimpananTable)}</span></div>
          <div>💵 Total Simpanan: <span className="font-semibold">{formatRupiah(totalSimpananSemua)}</span></div>
          <div>💳 Total Pinjaman: <span className="font-semibold">{formatRupiah(totalPinjamanSemua)}</span></div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          📋 count: anggota={anggota.length} | simpanans={simpanans.length} | pinjamans={pinjamans.length} | pendapatans={pendapatans.length} | pengeluarans={pengeluarans.length}
        </div>
        {pendapatans.length === 0 && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
            ⚠️ BELUM ADA DATA PENDAPATAN! 
            <button 
              onClick={() => {
                addPendapatan({
                  jenis: 'uang_buku',
                  deskripsi: 'Pendapatan tahun 2023-2026',
                  jumlah: 9000000,
                  tanggal: '2024-01-01',
                });
                alert('Pendapatan Rp 9.000.000 berhasil ditambahkan!');
              }}
              className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
            >
              + Tambah Pendapatan 9JT
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">
          📦 PEMBAGIAN SHU (Total: {formatRupiah(shNet)})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
          <div className="p-3 bg-green-50 rounded">
            <p className="text-green-700 text-xs font-medium">Jasa Modal (55%)</p>
            <p className="font-bold text-lg">{formatRupiah(distribution.jasa_modal)}</p>
            <p className="text-xs text-green-600">Untuk anggota</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-blue-700 text-xs font-medium">Jasa Transaksi (20%)</p>
            <p className="font-bold text-lg">{formatRupiah(distribution.jasa_transaksi)}</p>
            <p className="text-xs text-blue-600">Untuk anggota</p>
          </div>
          <div className="p-3 bg-slate-100 rounded">
            <p className="text-slate-700 text-xs font-medium">Dana Cadangan (10%)</p>
            <p className="font-bold text-lg">{formatRupiah(distribution.dana_cadangan_umum + distribution.dana_cadangan_resiko)}</p>
            <p className="text-xs text-slate-500">5% umum + 5% risiko</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded">
            <p className="text-yellow-700 text-xs font-medium">Dana Pengurus (5%)</p>
            <p className="font-bold text-lg">{formatRupiah(distribution.dana_pengurus_pengawas)}</p>
            <p className="text-xs text-yellow-600">Untuk pengurus & pengawas</p>
          </div>
        </div>
        
        {/* Lainnya 10% breakdown */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">📋 LAINNYA (10%)</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="p-2 bg-purple-50 rounded">
              <p className="text-purple-700 text-xs">Kesejahteraan Karyawan (5%)</p>
              <p className="font-bold">{formatRupiah(distribution.dana_kesejahteraan_karyawan)}</p>
            </div>
            <div className="p-2 bg-orange-50 rounded">
              <p className="text-orange-700 text-xs">Pendidikan (2%)</p>
              <p className="font-bold">{formatRupiah(distribution.dana_pendidikan)}</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <p className="text-red-700 text-xs">Sosial (2%)</p>
              <p className="font-bold">{formatRupiah(distribution.dana_sosial)}</p>
            </div>
            <div className="p-2 bg-teal-50 rounded">
              <p className="text-teal-700 text-xs">Pembangunan Daerah (1%)</p>
              <p className="font-bold">{formatRupiah(distribution.daerah_pembangunan_daerah_kerja)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center justify-center">
              <p className="text-slate-600 font-bold">Total: {formatRupiah(distribution.dana_kesejahteraan_karyawan + distribution.dana_pendidikan + distribution.dana_sosial + distribution.daerah_pembangunan_daerah_kerja)}</p>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-3 border-t pt-2">
          ✓ Total: {formatRupiah(distribution.jasa_modal + distribution.jasa_transaksi + distribution.dana_cadangan_umum + distribution.dana_cadangan_resiko + distribution.dana_pengurus_pengawas + distribution.dana_kesejahteraan_karyawan + distribution.dana_pendidikan + distribution.dana_sosial + distribution.daerah_pembangunan_daerah_kerja)}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">
          👥 SHU PER ANGGOTA ({perAnggota.length} orang)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-center p-2 w-10">No</th>
                <th className="text-left p-2">Nama</th>
                <th className="text-left p-2">NBA</th>
                <th className="text-center p-2">Sts</th>
                <th className="text-right p-2">Pokok</th>
                <th className="text-right p-2">Wajib</th>
                <th className="text-right p-2">Table</th>
                <th className="text-right p-2">Total Simpanan</th>
                <th className="text-right p-2">Pinjaman</th>
                <th className="text-right p-2">Jasa Modal</th>
                <th className="text-right p-2">Jasa Transaksi</th>
                <th className="text-right p-2 font-bold">Total SHU</th>
              </tr>
            </thead>
            <tbody>
              {perAnggota.map((a, index) => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="p-2 text-center text-slate-500">{index + 1}</td>
                  <td className="p-2 font-medium">{a.nama}</td>
                  <td className="p-2">{a.nomorNBA || '-'}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">{formatRupiah(a.simpananPokok)}</td>
                  <td className="p-2 text-right">{formatRupiah(a.simpananWajib)}</td>
                  <td className="p-2 text-right">{formatRupiah(a.simpananTable)}</td>
                  <td className="p-2 text-right font-medium">{formatRupiah(a.simpananTotal)}</td>
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
                <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.simpananPokok, 0))}</td>
                <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.simpananWajib, 0))}</td>
                <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.simpananTable, 0))}</td>
                <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.simpananTotal, 0))}</td>
                <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.pinjaman, 0))}</td>
                <td className="p-2 text-right">{formatRupiah(totalJasaModal)}</td>
                <td className="p-2 text-right">{formatRupiah(totalJasaTransaksi)}</td>
                <td className="p-2 text-right text-green-700">{formatRupiah(totalJasaModal + totalJasaTransaksi)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}