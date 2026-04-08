'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Pinjaman } from '@/types';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function PinjamanPage() {
  const { anggota, pinjamans, addPinjaman, updatePinjaman, deletePinjaman, addTransaksi } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [showBayar, setShowBayar] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    anggotaId: '',
    jumlah: 0,
    bunga: 12,
    tenor: 12,
    tanggalPinjaman: new Date().toISOString().split('T')[0],
    status: 'aktif' as 'aktif' | 'lunas' | 'macet',
    cicilanPerBulan: 0,
    totalPembayaran: 0,
    sudahDibayar: 0,
  });
  const [jumlahBayar, setJumlahBayar] = useState(0);

  const hitungCicilan = (jumlah: number, bunga: number, tenor: number) => {
    const bungaPerBulan = bunga / 100 / 12;
    const cicilan = (jumlah * bungaPerBulan * Math.pow(1 + bungaPerBulan, tenor)) / (Math.pow(1 + bungaPerBulan, tenor) - 1);
    return Math.round(cicilan);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cicilan = hitungCicilan(formData.jumlah, formData.bunga, formData.tenor);
    const total = cicilan * formData.tenor;
    
    const data = {
      ...formData,
      cicilanPerBulan: cicilan,
      totalPembayaran: total,
    };
    
    if (editingId) {
      updatePinjaman(editingId, data);
      setEditingId(null);
    } else {
      addPinjaman(data);
    }
    resetForm();
  };

  const handleEdit = (data: Pinjaman) => {
    setFormData({
      anggotaId: data.anggotaId,
      jumlah: data.jumlah,
      bunga: data.bunga,
      tenor: data.tenor,
      tanggalPinjaman: data.tanggalPinjaman,
      status: data.status,
      cicilanPerBulan: data.cicilanPerBulan,
      totalPembayaran: data.totalPembayaran,
      sudahDibayar: data.sudahDibayar,
    });
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus pinjaman ini?')) {
      deletePinjaman(id);
    }
  };

  const handleBayar = (pinjaman: Pinjaman) => {
    if (jumlahBayar > 0) {
      addTransaksi({
        jenis: 'pembayaran',
        anggotaId: pinjaman.anggotaId,
        referensiId: pinjaman.id,
        jumlah: jumlahBayar,
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: `Pembayaran cicilan pinjaman`,
      });
      setShowBayar(null);
      setJumlahBayar(0);
    }
  };

  const resetForm = () => {
    setFormData({
      anggotaId: '',
      jumlah: 0,
      bunga: 12,
      tenor: 12,
      tanggalPinjaman: new Date().toISOString().split('T')[0],
      status: 'aktif',
      cicilanPerBulan: 0,
      totalPembayaran: 0,
      sudahDibayar: 0,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Data Pinjaman</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Tutup Form' : '+ Ajukan Pinjaman'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Pinjaman' : 'Ajukan Pinjaman Baru'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={formData.anggotaId}
              onChange={e => setFormData({ ...formData, anggotaId: e.target.value })}
              className="border p-2 rounded"
              required
            >
              <option value="">Pilih Anggota</option>
              {anggotaAktif.map(a => (
                <option key={a.id} value={a.id}>{a.nama}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Jumlah Pinjaman"
              value={formData.jumlah || ''}
              onChange={e => setFormData({ ...formData, jumlah: Number(e.target.value) })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Bunga (% per tahun)"
              value={formData.bunga}
              onChange={e => setFormData({ ...formData, bunga: Number(e.target.value) })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Tenor (bulan)"
              value={formData.tenor}
              onChange={e => setFormData({ ...formData, tenor: Number(e.target.value) })}
              className="border p-2 rounded"
              required
            />
            <input
              type="date"
              value={formData.tanggalPinjaman}
              onChange={e => setFormData({ ...formData, tanggalPinjaman: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <div className="flex items-center gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Batal
              </button>
            </div>
          </form>
          {formData.jumlah > 0 && formData.bunga > 0 && formData.tenor > 0 && (
            <div className="mt-3 p-3 bg-slate-100 rounded">
              <p>Estimasi Cicilan per Bulan: <strong>{formatRupiah(hitungCicilan(formData.jumlah, formData.bunga, formData.tenor))}</strong></p>
              <p>Total Pembayaran: <strong>{formatRupiah(hitungCicilan(formData.jumlah, formData.bunga, formData.tenor) * formData.tenor)}</strong></p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Anggota</th>
              <th className="text-right p-3">Jumlah</th>
              <th className="text-right p-3">Bunga</th>
              <th className="text-right p-3">Tenor</th>
              <th className="text-right p-3">Cicilan/Bulan</th>
              <th className="text-right p-3">Dibayar</th>
              <th className="text-left p-3">Status</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pinjamans.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-slate-500">Belum ada pinjaman</td>
              </tr>
            ) : (
              pinjamans.map(p => {
                const ag = anggota.find(a => a.id === p.anggotaId);
                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{ag?.nama || '-'}</td>
                    <td className="p-3 text-right">{formatRupiah(p.jumlah)}</td>
                    <td className="p-3 text-right">{p.bunga}%</td>
                    <td className="p-3 text-right">{p.tenor} bln</td>
                    <td className="p-3 text-right">{formatRupiah(p.cicilanPerBulan)}</td>
                    <td className="p-3 text-right">{formatRupiah(p.sudahDibayar)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'aktif' ? 'bg-blue-100 text-blue-800' : 
                        p.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.status === 'aktif' && (
                        <button onClick={() => setShowBayar(p.id)} className="text-green-600 hover:underline mr-2">Bayar</button>
                      )}
                      <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showBayar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="font-semibold mb-3">Pembayaran Cicilan</h3>
            {(() => {
              const p = pinjamans.find(pin => pin.id === showBayar);
              if (!p) return null;
              const ag = anggota.find(a => a.id === p.anggotaId);
              return (
                <>
                  <p className="mb-2">Anggota: {ag?.nama}</p>
                  <p className="mb-2">Sisa Pembayaran: {formatRupiah(p.totalPembayaran - p.sudahDibayar)}</p>
                  <input
                    type="number"
                    placeholder="Jumlah Pembayaran"
                    value={jumlahBayar || ''}
                    onChange={e => setJumlahBayar(Number(e.target.value))}
                    className="border p-2 rounded w-full mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleBayar(p)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      Bayar
                    </button>
                    <button onClick={() => { setShowBayar(null); setJumlahBayar(0); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                      Batal
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}