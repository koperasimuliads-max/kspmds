'use client';

import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function SHUPerAnggotaPage() {
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans } = useKSP();

  // Debug: lihat struktur data
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

  // Hitung SHU distribution
  const distribution = shNet > 0 ? {
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

  // Hitung SHU per anggota
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
    let jasaModal = 0;
    let jasaTransaksi = 0;
    
    if (shNet > 0 && distribution) {
      if (totalSimpananSemua > 0 && simpananTotal > 0) {
        jasaModal = (simpananTotal / totalSimpananSemua) * distribution.jasa_modal;
      }
      if (totalPinjamanSemua > 0 && pinjaman > 0) {
        jasaTransaksi = (pinjaman / totalPinjamanSemua) * distribution.jasa_transaksi;
      }
    }
    
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

      {/* Debug Info */}
      <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-sm">
        <h3 className="font-semibold text-yellow-800 mb-2">📊 DEBUG - Sumber Data:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-yellow-700">
          <div>📥 Pendapatan: {formatRupiah(totalPendapatan)}</div>
          <div>📤 Pengeluaran: {formatRupiah(totalPengeluaran)}</div>
          <div>💰 SHU: {formatRupiah(shNet)}</div>
          <div>👥 Anggota: {anggota.length}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-yellow-700 mt-2">
          <div>💵 Simpanan Table: {formatRupiah(totalSimpananTable)}</div>
          <div>💵 Setoran Awal (Pokok+Wajib): {formatRupiah(totalSimpananAwal)}</div>
          <div>💵 Total Simpanan: {formatRupiah(totalSimpananSemua)}</div>
          <div>💳 Pinjaman Aktif: {formatRupiah(totalPinjamanSemua)}</div>
        </div>
        <div className="text-yellow-600 mt-2 text-xs">
          count: simpanans={simpanans.length}, pinjamans={pinjamans.length}, pendapatans={pendapatans.length}, pengeluarans={pengeluarans.length}
        </div>
      </div>

      {shNet <= 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-slate-500 text-lg">SHU belum tersedia atau masih Rp 0.</p>
          <p className="text-slate-400 text-sm mt-2">SHU = Total Pendapatan - Total Pengeluaran</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PEMBAGIAN SHU (Total: {formatRupiah(shNet)})</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
              <div className="p-2 bg-green-50 rounded text-center">
                <p className="text-green-700 text-xs">Jasa Modal (55%)</p>
                <p className="font-bold">{formatRupiah(distribution?.jasa_modal || 0)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded text-center">
                <p className="text-blue-700 text-xs">Jasa Transaksi (20%)</p>
                <p className="font-bold">{formatRupiah(distribution?.jasa_transaksi || 0)}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded text-center">
                <p className="text-slate-600 text-xs">Dana Cadangan (10%)</p>
                <p className="font-bold">{formatRupiah((distribution?.dana_cadangan_umum || 0) + (distribution?.dana_cadangan_resiko || 0))}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded text-center">
                <p className="text-yellow-700 text-xs">Dana Pengurus (5%)</p>
                <p className="font-bold">{formatRupiah(distribution?.dana_pengurus_pengawas || 0)}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded text-center">
                <p className="text-orange-700 text-xs">Lainnya (10%)</p>
                <p className="font-bold">{formatRupiah((distribution?.dana_kesejahteraan_karyawan || 0) + (distribution?.dana_pendidikan || 0) + (distribution?.dana_sosial || 0) + (distribution?.daerah_pembangunan_daerah_kerja || 0))}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">SHU PER ANGGOTA ({perAnggota.length} orang)</h2>
            <p className="text-sm text-slate-500 mb-3">
              Jasa Modal = proporsi simpanan × 55% SHU<br/>
              Jasa Transaksi = proporsi pinjaman × 20% SHU
            </p>
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
        </>
      )}
    </div>
  );
}