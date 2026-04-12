'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function PendapatanPage() {
  const { anggota, bulkUpdateUangBuku } = useKSP();
  const [showUbahForm, setShowUbahForm] = useState(false);
  const [ubahForm, setUbahForm] = useState({ startNBA: 176, endNBA: 426, uangBuku: 25000 });

  const uangBukuTotal = anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0);
  const anggotaWithUangBuku = anggota.filter(a => a.uangBuku > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Pendapatan</h1>

      <div className="flex justify-between items-start mb-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 flex-1">
          <p className="text-sm text-slate-500">Uang Buku (Biaya Administrasi)</p>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(uangBukuTotal)}</p>
          <p className="text-sm text-slate-500">{anggotaWithUangBuku.length} anggota × Rp 15.000 / Rp 25.000</p>
        </div>
        <button
          onClick={() => setShowUbahForm(!showUbahForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2"
        >
          {showUbahForm ? 'Tutup' : 'Ubah Uang Buku'}
        </button>
      </div>

      {showUbahForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-semibold mb-3">Ubah Uang Buku Massal</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="NBA Awal"
              value={ubahForm.startNBA}
              onChange={e => setUbahForm({ ...ubahForm, startNBA: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="NBA Akhir"
              value={ubahForm.endNBA}
              onChange={e => setUbahForm({ ...ubahForm, endNBA: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Uang Buku Baru"
              value={ubahForm.uangBuku}
              onChange={e => setUbahForm({ ...ubahForm, uangBuku: Number(e.target.value) })}
              className="border p-2 rounded"
            />
            <button
              onClick={() => {
                bulkUpdateUangBuku(ubahForm.startNBA, ubahForm.endNBA, ubahForm.uangBuku);
                alert(`Uang buku NBA ${ubahForm.startNBA}-${ubahForm.endNBA} diubah menjadi ${formatRupiah(ubahForm.uangBuku)}`);
                setShowUbahForm(false);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Simpan
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Contoh: NBA 176-426 ubah ke Rp 25.000</p>
        </div>
      )}

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