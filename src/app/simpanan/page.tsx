'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Simpanan } from '@/types';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const jenisSimpananOptions = [
  { value: 'pokok', label: 'Simpanan Pokok (SP)', bunga: 0 },
  { value: 'wajib', label: 'Simpanan Wajib (SW)', bunga: 0 },
  { value: 'sibuhar', label: 'Simpanan Masa Depan (Sibuhar)', bunga: 3, tenor: 12, premiMin: 100000, premiMax: 1000000 },
  { value: 'simapan', label: 'Simpanan Masa Depan (Simapan)', bunga: 5, tenor: 12, tenorMax: 120, premiMin: 100000, premiMax: 1000000 },
  { value: 'sihat', label: 'Simpanan Hari Tua (Sihat)', bunga: 6, tenor: 12, tenorMax: 180, premiMin: 100000, premiMax: 1000000 },
  { value: 'sihar', label: 'Simpanan Hari Raya (Sihar)', bunga: 0, tenor: 12, tenorMax: 12, premiMin: 100000, premiMax: 1000000 },
];

export default function SimpananPage() {
  const { anggota, simpanans, addSimpanan, updateSimpanan, deleteSimpanan } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    anggotaId: '',
    jumlah: 0,
    jenis: 'wajib' as 'wajib' | 'pokok' | 'sibuhar' | 'simapan' | 'sihat' | 'sihar',
    tanggalSimpan: new Date().toISOString().split('T')[0],
    status: 'aktif' as 'aktif' | 'ditarik' | 'aktif_auto',
    tenor: 12,
    premi: 100000,
    bunga: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateSimpanan(editingId, formData);
      setEditingId(null);
    } else {
      addSimpanan(formData);
    }
    resetForm();
  };

  const handleEdit = (data: Simpanan) => {
    setFormData({
      anggotaId: data.anggotaId,
      jumlah: data.jumlah,
      jenis: data.jenis,
      tanggalSimpan: data.tanggalSimpan,
      status: data.status,
      tenor: data.tenor || 12,
      premi: data.premi || 100000,
      bunga: data.bunga || 0,
    });
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus simpanan ini?')) {
      deleteSimpanan(id);
    }
  };

  const resetForm = () => {
    setFormData({
      anggotaId: '',
      jumlah: 0,
      jenis: 'wajib',
      tanggalSimpan: new Date().toISOString().split('T')[0],
      status: 'aktif',
      tenor: 12,
      premi: 100000,
      bunga: 0,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Data Simpanan</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Simpanan'}
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 p-3 rounded mb-4 text-sm">
        <p className="text-green-800 font-medium">Jenis Simpanan:</p>
        <ul className="text-green-700 list-disc list-inside mt-1">
          <li><strong>SP</strong> - Simpanan Pokok (sekali saat入会)</li>
          <li><strong>SW</strong> - Simpanan Wajib (per bulan)</li>
          <li><strong>Sibuhar</strong> - Simpanan Masa Depan, bunga 3%/thn, tenor 12 bln, premi Rp100rb-1jt</li>
          <li><strong>Simapan</strong> - Simpanan Masa Depan, bunga 5%/thn, tenor 1-10 thn, premi Rp100rb-1jt</li>
          <li><strong>Sihat</strong> - Simpanan Hari Tua, bunga 6%/thn, tenor 1-15 thn, premi Rp100rb-1jt</li>
          <li><strong>Sihar</strong> - Simpanan Hari Raya, bunga 0%, tenor 12 bln, premi Rp100rb-1jt</li>
        </ul>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Simpanan' : 'Tambah Simpanan Baru'}</h2>
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
              placeholder="Jumlah Simpanan"
              value={formData.jumlah || ''}
              onChange={e => setFormData({ ...formData, jumlah: Number(e.target.value) })}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.jenis}
              onChange={e => {
                const opt = jenisSimpananOptions.find(o => o.value === e.target.value);
                setFormData({ ...formData, jenis: e.target.value as any, bunga: opt?.bunga || 0, tenor: opt?.tenor || 12 });
              }}
              className="border p-2 rounded"
            >
              {jenisSimpananOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label} {o.bunga ? `(${o.bunga}%/thn)` : ''}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.tanggalSimpan}
              onChange={e => setFormData({ ...formData, tanggalSimpan: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="border p-2 rounded"
            >
              <option value="aktif">Aktif</option>
              <option value="aktif_auto">Aktif Auto</option>
              <option value="ditarik">Ditarik</option>
            </select>
            <div className="flex items-center gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingId ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
<tr>
                <th className="text-left p-3">Anggota</th>
                <th className="text-left p-3">Jenis</th>
                <th className="text-right p-3">Jumlah</th>
                <th className="text-right p-3">Bunga %</th>
                <th className="text-right p-3">Tenor</th>
                <th className="text-left p-3">Tanggal</th>
                <th className="text-left p-3">Status</th>
                <th className="text-center p-3">Aksi</th>
              </tr>
          </thead>
          <tbody>
            {simpanans.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-slate-500">Belum ada simpanan</td>
              </tr>
            ) : (
              simpanans.map(s => {
                const ag = anggota.find(a => a.id === s.anggotaId);
                return (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{ag?.nama || '-'}</td>
                    <td className="p-3 capitalize">{s.jenis}</td>
                    <td className="p-3 text-right">{formatRupiah(s.jumlah)}</td>
                    <td className="p-3 text-right">{s.bunga || 0}%</td>
                    <td className="p-3 text-right">{s.tenor || '-'} bln</td>
                    <td className="p-3">{new Date(s.tanggalSimpan).toLocaleDateString('id-ID')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.status === 'aktif' ? 'bg-green-100 text-green-800' : s.status === 'aktif_auto' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}