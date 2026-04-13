'use client';

import { useState, useEffect } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Simpanan } from '@/types';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatRupiahInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return parseInt(numbers).toLocaleString('id-ID');
}

function parseRupiah(value: string): number {
  return parseInt(value.replace(/\D/g, '')) || 0;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID');
  } catch {
    return '-';
  }
}

const jenisSimpananOptions = [
  { value: 'pokok', label: 'SP - Simpanan Pokok', bunga: 0 },
  { value: 'wajib', label: 'SW - Simpanan Wajib', bunga: 0 },
  { value: 'sibuhar', label: 'Sibuhar - Masa Depan (3%)', bunga: 3, tenor: 12 },
  { value: 'simapan', label: 'Simapan - Masa Depan (5%)', bunga: 5, tenor: 12, tenorMax: 120 },
  { value: 'sihat', label: 'Sihat - Hari Tua (6%)', bunga: 6, tenor: 12, tenorMax: 180 },
  { value: 'sihar', label: 'Sihar - Hari Raya', bunga: 0, tenor: 12 },
];

export default function SimpananPage() {
  const { anggota, simpanans, addSimpanan, updateSimpanan, deleteSimpanan, fixSimpananTanggal, addTransaksi } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterJenis, setFilterJenis] = useState('all');
  const [jumlahDisplay, setJumlahDisplay] = useState('');
  const [formData, setFormData] = useState({
    anggotaId: '',
    jumlah: 0,
    jenis: 'wajib' as 'wajib' | 'pokok' | 'sibuhar' | 'simapan' | 'sihat' | 'sihar',
    tanggalSimpan: '2024-01-01',
    status: 'aktif' as 'aktif' | 'ditarik' | 'aktif_auto',
    tenor: 12,
    premi: 100000,
    bunga: 0,
  });

  useEffect(() => {
    const hasWrongDate = simpanans.some(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      return ag && ag.tanggalJoin && s.tanggalSimpan !== ag.tanggalJoin && (s.jenis === 'pokok' || s.jenis === 'wajib');
    });
    if (hasWrongDate) {
      fixSimpananTanggal();
    }
  }, [anggota, simpanans, fixSimpananTanggal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSimpanan(editingId, formData);
      setEditingId(null);
    } else {
      addSimpanan(formData);
      
      const ag = anggota.find(a => a.id === formData.anggotaId);
      addTransaksi({
        jenis: 'simpanan',
        anggotaId: formData.anggotaId,
        referensiId: '',
        jumlah: formData.jumlah,
        tanggal: formData.tanggalSimpan,
        deskripsi: `${formData.jenis} dari ${ag?.nama || '-'}`,
      });
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
    setJumlahDisplay(formatRupiahInput(String(data.jumlah)));
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
      tanggalSimpan: '2024-01-01',
      status: 'aktif',
      tenor: 12,
      premi: 100000,
      bunga: 0,
    });
    setJumlahDisplay('');
    setShowForm(false);
    setEditingId(null);
  };

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');
  const filteredSimpanans = filterJenis === 'all' ? simpanans : simpanans.filter(s => s.jenis === filterJenis);

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

      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilterJenis('all')}
          className={`px-3 py-2 rounded text-sm ${filterJenis === 'all' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Semua ({simpanans.length})
        </button>
        {jenisSimpananOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterJenis(opt.value)}
            className={`px-3 py-2 rounded text-sm ${filterJenis === opt.value ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            {opt.label.split(' ')[0]} ({simpanans.filter(s => s.jenis === opt.value).length})
          </button>
        ))}
        <button
          onClick={() => {
            if (confirm('Samakan tanggal simpanan pokok & wajib dengan tanggal masuk anggota?')) {
              fixSimpananTanggal();
              alert('Tanggal simpanan telah diperbaiki!');
            }
          }}
          className="px-3 py-2 rounded text-sm bg-yellow-500 text-white hover:bg-yellow-600"
        >
          🔧 Perbaiki Tanggal
        </button>
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
              type="text"
              placeholder="Jumlah (contoh: 500.000)"
              value={jumlahDisplay}
              onChange={e => {
                const num = parseRupiah(e.target.value);
                setJumlahDisplay(formatRupiahInput(e.target.value));
                setFormData({ ...formData, jumlah: num });
              }}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.jenis}
              onChange={e => {
                const opt = jenisSimpananOptions.find(o => o.value === e.target.value);
                setFormData({ ...formData, jenis: e.target.value as typeof formData.jenis, bunga: opt?.bunga || 0, tenor: opt?.tenor || 12 });
              }}
              className="border p-2 rounded"
            >
              {jenisSimpananOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.tanggalSimpan}
              onChange={e => setFormData({ ...formData, tanggalSimpan: e.target.value })}
              className="border p-2 rounded"
            />
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
              className="border p-2 rounded"
            >
              <option value="aktif">Aktif</option>
              <option value="aktif_auto">Aktif Auto</option>
              <option value="ditarik">Ditarik</option>
            </select>
            <div className="flex gap-2">
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
              <th className="text-center p-3 w-12">No</th>
              <th className="text-left p-3">Tanggal</th>
              <th className="text-left p-3">Nama Anggota</th>
              <th className="text-left p-3">Jenis Simpanan</th>
              <th className="text-right p-3">Jumlah</th>
              {filterJenis === 'all' || filterJenis === 'sibuhar' || filterJenis === 'simapan' || filterJenis === 'sihat' || filterJenis === 'sihar' ? (
                <>
                  <th className="text-right p-3">Bunga</th>
                  <th className="text-right p-3">Tenor</th>
                </>
              ) : null}
              <th className="text-left p-3">Status</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredSimpanans.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-4 text-slate-500">Belum ada simpanan</td>
              </tr>
            ) : (
              filteredSimpanans.map((s, index) => {
                const ag = anggota.find(a => a.id === s.anggotaId);
                const showBungaTenor = s.jenis === 'sibuhar' || s.jenis === 'simapan' || s.jenis === 'sihat' || s.jenis === 'sihar';
                return (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-500">{index + 1}</td>
                    <td className="p-3">{formatDate(s.tanggalSimpan)}</td>
                    <td className="p-3 font-medium">{ag?.nama || '-'}</td>
                    <td className="p-3 capitalize">{s.jenis}</td>
                    <td className="p-3 text-right">{formatRupiah(s.jumlah)}</td>
                    {showBungaTenor ? (
                      <>
                        <td className="p-3 text-right">{s.bunga || 0}%</td>
                        <td className="p-3 text-right">{s.tenor || '-'} bln</td>
                      </>
                    ) : (
                      filterJenis === 'all' ? (
                        <>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">-</td>
                        </>
                      ) : null
                    )}
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