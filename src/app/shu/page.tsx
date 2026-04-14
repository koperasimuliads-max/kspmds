'use client';

import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function SHUPerAnggotaPage() {
  const { anggota, pinjamans, simpanans, pendapatans, pengeluarans } = useKSP();

  const totalPendapatan = pendapatans.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);
  const shNet = totalPendapatan - totalPengeluaran;

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');

  const hitungSHU = () => {
    if (shNet <= 0) return { distribution: null, perAnggota: [] };
    
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

    const totalSimpananSemua = simpanans
      .filter(s => s.status === 'aktif')
      .reduce((sum, s) => sum + s.jumlah, 0);
    
    const totalPinjamanSemua = pinjamans
      .filter(p => p.status === 'aktif')
      .reduce((sum, p) => sum + p.jumlah, 0);
    
    const perAnggota = anggotaAktif.map(ag => {
      const simpananAnggota = simpanans
        .filter(s => s.anggotaId === ag.id && s.status === 'aktif')
        .reduce((sum, s) => sum + s.jumlah, 0);
      
      const pinjamanAnggota = pinjamans
        .filter(p => p.anggotaId === ag.id && p.status === 'aktif')
        .reduce((sum, p) => sum + p.jumlah, 0);
      
      const jasaModal = totalSimpananSemua > 0 
        ? (simpananAnggota / totalSimpananSemua) * distribution.jasa_modal 
        : 0;
      
      const jasaTransaksi = totalPinjamanSemua > 0 
        ? (pinjamanAnggota / totalPinjamanSemua) * distribution.jasa_transaksi 
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

    return { distribution, perAnggota };
  };

  const { distribution, perAnggota } = hitungSHU();

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">SHU Per Anggota</h1>
      </div>

      {shNet <= 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-slate-500 text-lg">Belum ada SHU untuk dibagikan.</p>
          <p className="text-slate-400 text-sm mt-2">SHU = Total Pendapatan - Total Pengeluaran</p>
          <div className="mt-4 p-4 bg-slate-50 rounded">
            <p className="text-slate-600">Pendapatan: {formatRupiah(totalPendapatan)}</p>
            <p className="text-slate-600">Pengeluaran: {formatRupiah(totalPengeluaran)}</p>
            <p className="text-slate-500 mt-2">SHU: {formatRupiah(shNet)}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">RINGKASAN SHU</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-blue-600 text-xs">Total Pendapatan</p>
                <p className="font-bold">{formatRupiah(totalPendapatan)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-red-600 text-xs">Total Pengeluaran</p>
                <p className="font-bold">{formatRupiah(totalPengeluaran)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-green-600 text-xs">Total SHU</p>
                <p className="font-bold text-green-700">{formatRupiah(shNet)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-purple-600 text-xs">Anggota Dapat SHU</p>
                <p className="font-bold">{perAnggota.length} orang</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PEMBAGIAN SHU</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="p-2 bg-slate-50 rounded text-center">
                <p className="text-slate-500 text-xs">Jasa Modal (55%)</p>
                <p className="font-bold">{formatRupiah(distribution?.jasa_modal || 0)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded text-center">
                <p className="text-blue-600 text-xs">Jasa Transaksi (20%)</p>
                <p className="font-bold">{formatRupiah(distribution?.jasa_transaksi || 0)}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded text-center">
                <p className="text-slate-500 text-xs">Dana Cadangan (10%)</p>
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
            <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">SHU PER ANGGOTA</h2>
            <p className="text-sm text-slate-500 mb-3">
              Diedarkan berdasarkan proporsi simpanan (Jasa Modal) dan pinjaman (Jasa Transaksi)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-center p-2 w-12">No</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">NBA</th>
                    <th className="text-right p-2">Simpanan</th>
                    <th className="text-right p-2">Pinjaman</th>
                    <th className="text-right p-2">Jasa Modal</th>
                    <th className="text-right p-2">Jasa Transaksi</th>
                    <th className="text-right p-2 font-bold">Total SHU</th>
                  </tr>
                </thead>
                <tbody>
                  {perAnggota.length === 0 ? (
                    <tr><td colSpan={8} className="text-center p-4 text-slate-500">Belum ada data</td></tr>
                  ) : (
                    perAnggota.map((a, index) => (
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
                    ))
                  )}
                </tbody>
                {perAnggota.length > 0 && (
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={3} className="p-2 text-right">TOTAL</td>
                      <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.simpanan, 0))}</td>
                      <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.pinjaman, 0))}</td>
                      <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.jasaModal, 0))}</td>
                      <td className="p-2 text-right">{formatRupiah(perAnggota.reduce((s, a) => s + a.jasaTransaksi, 0))}</td>
                      <td className="p-2 text-right text-green-700">{formatRupiah(perAnggota.reduce((s, a) => s + a.totalSHU, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}