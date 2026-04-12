'use client';

import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function PendapatanPage() {
  const { anggota, simpanans } = useKSP();

  const uangBukuTotal = anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0);
  
  const simpananSukarela = simpanans.filter(s => s.jenis === 'sukarela' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const simpananWajib = simpanans.filter(s => s.jenis === 'wajib' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  const simpananPokok = simpanans.filter(s => s.jenis === 'pokok' && s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
  
  const totalPendapatan = uangBukuTotal + simpananSukarela + simpananWajib + simpananPokok;

  const anggotaWithUangBuku = anggota.filter(a => a.uangBuku > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Pendapatan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Uang Buku (Biaya Administrasi)</p>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(uangBukuTotal)}</p>
          <p className="text-sm text-slate-500">{anggotaWithUangBuku.length} anggota × Rp 15.000</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-slate-500">Total Pendapatan</p>
          <p className="text-2xl font-bold text-purple-600">{formatRupiah(totalPendapatan)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">Rincian Pendapatan</h2>
        
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded">
            <h3 className="font-medium text-green-800">Uang Buku (Administrasi)</h3>
            <p className="text-sm text-green-600">{anggotaWithUangBuku.length} anggota × Rp 15.000 = {formatRupiah(uangBukuTotal)}</p>
          </div>
          
          {simpananPokok > 0 && (
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-800">Simpanan Pokok (Pendapatan Bunga)</h3>
              <p className="text-sm text-blue-600">{formatRupiah(simpananPokok)}</p>
            </div>
          )}
          
          {simpananWajib > 0 && (
            <div className="p-3 bg-yellow-50 rounded">
              <h3 className="font-medium text-yellow-800">Simpanan Wajib</h3>
              <p className="text-sm text-yellow-600">Total: {formatRupiah(simpananWajib)}</p>
            </div>
          )}
          
          {simpananSukarela > 0 && (
            <div className="p-3 bg-purple-50 rounded">
              <h3 className="font-medium text-purple-800">Simpanan Sukarela</h3>
              <p className="text-sm text-purple-600">Total: {formatRupiah(simpananSukarela)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">Detail Uang Buku per Anggota</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Nama</th>
                <th className="text-left p-2">NBA</th>
                <th className="text-right p-2">Uang Buku</th>
              </tr>
            </thead>
            <tbody>
              {anggotaWithUangBuku.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-4 text-slate-500">Belum ada anggota dengan uang buku</td></tr>
              ) : (
                anggotaWithUangBuku.map(a => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{a.nama}</td>
                    <td className="p-2">{a.nomorNBA || '-'}</td>
                    <td className="p-2 text-right">{formatRupiah(a.uangBuku)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}