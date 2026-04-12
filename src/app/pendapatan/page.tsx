'use client';

import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function PendapatanPage() {
  const { anggota } = useKSP();

  const uangBukuTotal = anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0);
  const anggotaWithUangBuku = anggota.filter(a => a.uangBuku > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Pendapatan</h1>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 mb-6">
        <p className="text-sm text-slate-500">Uang Buku (Biaya Administrasi)</p>
        <p className="text-2xl font-bold text-green-600">{formatRupiah(uangBukuTotal)}</p>
        <p className="text-sm text-slate-500">{anggotaWithUangBuku.length} anggota × Rp 15.000</p>
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