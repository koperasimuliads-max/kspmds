'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Anggota } from '@/types';

export default function AnggotaPage() {
  const { anggota, addAnggota, updateAnggota, deleteAnggota } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    alamat: '',
    telefon: '',
    tanggalJoin: new Date().toISOString().split('T')[0],
    status: 'aktif' as 'aktif' | 'nonaktif',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAnggota(editingId, formData);
      setEditingId(null);
    } else {
      addAnggota(formData);
    }
    resetForm();
  };

  const handleEdit = (data: Anggota) => {
    setFormData({
      nama: data.nama,
      nik: data.nik,
      alamat: data.alamat,
      telefon: data.telefon,
      tanggalJoin: data.tanggalJoin,
      status: data.status,
    });
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus anggota ini? Semua data pinjaman dan simpanan juga akan dihapus.')) {
      deleteAnggota(id);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      nik: '',
      alamat: '',
      telefon: '',
      tanggalJoin: new Date().toISOString().split('T')[0],
      status: 'aktif',
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Data Anggota</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Anggota'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={formData.nama}
              onChange={e => setFormData({ ...formData, nama: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="NIK"
              value={formData.nik}
              onChange={e => setFormData({ ...formData, nik: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Alamat"
              value={formData.alamat}
              onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="tel"
              placeholder="Nomor Telepon"
              value={formData.telefon}
              onChange={e => setFormData({ ...formData, telefon: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="date"
              value={formData.tanggalJoin}
              onChange={e => setFormData({ ...formData, tanggalJoin: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })}
              className="border p-2 rounded"
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <div className="md:col-span-2 flex gap-2">
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
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">NIK</th>
              <th className="text-left p-3">Alamat</th>
              <th className="text-left p-3">Telepon</th>
              <th className="text-left p-3">Join</th>
              <th className="text-left p-3">Status</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {anggota.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4 text-slate-500">Belum ada anggota</td>
              </tr>
            ) : (
              anggota.map(a => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{a.nama}</td>
                  <td className="p-3">{a.nik}</td>
                  <td className="p-3">{a.alamat}</td>
                  <td className="p-3">{a.telefon}</td>
                  <td className="p-3">{new Date(a.tanggalJoin).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline mr-2">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}