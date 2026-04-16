'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Pengeluaran } from '@/types';
import BackButton from '@/components/BackButton';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const jenisPengeluaranOptions = [
  { value: 'insentif_anggota_baru', label: 'V.2.1 Biaya Insentif Anggota Baru' },
  { value: 'insentif_deposan', label: 'V.2.1 Biaya Insentif Deposan' },
  { value: 'insentif_penanggung_jawab', label: 'V.2.1 Biaya Insentif Penanggung Jawab' },
  { value: 'gaji_karyawan', label: 'V.2.1 Gaji Karyawan' },
  { value: 'biaya_rat', label: 'V.2.2 Biaya RAT' },
  { value: 'biaya_sosialisasi', label: 'V.2.2 Biaya Sosialisasi' },
  { value: 'biaya_akta', label: 'V.2.2 Biaya AKTA' },
  { value: 'biaya_hut', label: 'V.2.2 Biaya HUT' },
  { value: 'biaya_sosial', label: 'V.2.2 Biaya Sosial' },
  { value: 'biaya_transport_marketing', label: 'V.2.3 Biaya Transport Marketing' },
  { value: 'biaya_iptw', label: 'V.2.3 Biaya IPTW' },
  { value: 'perlengkapan_kantor', label: 'V.2.4 Biaya Perlengkapan Kantor' },
  { value: 'atk_koperasi', label: 'V.2.4 Biaya ATK Koperasi' },
  { value: 'listrik_air_wifi', label: 'V.2.4 Biaya Listrik, Air & Wifi' },
  { value: 'materai', label: 'V.2.4 Biaya Pembelian Materai' },
  { value: 'kebersihan', label: 'V.2.4 Biaya Kebersihan' },
  { value: 'admin_bank', label: 'V.2.5 Biaya Admin Bank' },
  { value: 'entertainment', label: 'V.2.5 Biaya Entertainment' },
  { value: 'konsumsi_koperasi', label: 'V.2.5 Biaya Konsumsi Koperasi' },
  { value: 'spanduk', label: 'V.2.5 Biaya Spanduk' },
  { value: 'biaya_lain', label: 'V.2.5 Biaya Lain-Lainnya' },
  { value: 'kerugian_tahun_lalu', label: 'V.2.6 Biaya Kerugian Tahun Lalu' },
  { value: 'operasional', label: 'Biaya Operasional Lainnya' },
];

export default function PengeluaranPage() {
  const { pengeluarans, addPengeluaran, updatePengeluaran, deletePengeluaran } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    jenis: 'operasional' as string,
    deskripsi: '',
    jumlah: 0,
    tanggal: '2024-01-01',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePengeluaran(editingId, formData);
      setEditingId(null);
    } else {
      addPengeluaran(formData);
    }
    resetForm();
  };

  const handleEdit = (data: Pengeluaran) => {
    setFormData({
      jenis: data.jenis,
      deskripsi: data.deskripsi,
      jumlah: data.jumlah,
      tanggal: data.tanggal,
    });
    setEditingId(data.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin hapus pengeluaran ini?')) {
      deletePengeluaran(id);
    }
  };

  const resetForm = () => {
    setFormData({
      jenis: 'operasional',
      deskripsi: '',
      jumlah: 0,
      tanggal: '2024-01-01',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const totalPengeluaran = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);
  const sortedPengeluarans = [...pengeluarans].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const byJenis = pengeluarans.reduce((acc, p) => {
    acc[p.jenis] = (acc[p.jenis] || 0) + p.jumlah;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-slate-800">Pengeluaran</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Pengeluaran'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={formData.jenis}
              onChange={e => setFormData({ ...formData, jenis: e.target.value })}
              className="border p-2 rounded"
            >
              {jenisPengeluaranOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Deskripsi"
              value={formData.deskripsi}
              onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Jumlah"
              value={formData.jumlah || ''}
              onChange={e => setFormData({ ...formData, jumlah: Number(e.target.value) })}
              className="border p-2 rounded"
              required
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.tanggal}
                onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                className="border p-2 rounded"
              />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
          <button onClick={resetForm} className="mt-2 text-sm text-slate-500 hover:text-slate-700">
            Batal
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-slate-500 mb-2">Pengeluaran per Jenis</p>
          <div className="space-y-1 text-sm">
            {Object.entries(byJenis).map(([jenis, jumlah]) => (
              <p key={jenis} className="flex justify-between">
                <span className="capitalize">{jenis.replace('_', ' ')}</span>
                <span className="font-medium">{formatRupiah(Number(jumlah))}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Jenis</th>
              <th className="text-left p-2">Deskripsi</th>
              <th className="text-right p-2">Jumlah</th>
              <th className="text-center p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pengeluarans.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-slate-500">
                  Belum ada pengeluaran. Klik &quot;+ Tambah Pengeluaran&quot; untuk menambah.
                </td>
              </tr>
            ) : (
              sortedPengeluarans
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(p => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="p-2 capitalize">{p.jenis.replace('_', ' ')}</td>
                    <td className="p-2">{p.deskripsi}</td>
                    <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
        {sortedPengeluarans.length > itemsPerPage && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-sm text-slate-600">
              Halaman {currentPage} dari {Math.ceil(sortedPengeluarans.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedPengeluarans.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(sortedPengeluarans.length / itemsPerPage)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}