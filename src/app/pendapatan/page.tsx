'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
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

export default function PendapatanPage() {
  const { anggota, pendapatans, pengeluarans, bulkUpdateUangBuku, addPendapatan, deletePendapatan, addPengeluaran, deletePengeluaran } = useKSP();
  const [showUbahForm, setShowUbahForm] = useState(false);
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [jenisForm, setJenisForm] = useState<'pendapatan' | 'pengeluaran'>('pendapatan');
  const [formData, setFormData] = useState({ jenis: 'uang_buku', deskripsi: '', jumlah: 0 });
  const [ubahForm, setUbahForm] = useState({ startNBA: 176, endNBA: 426, uangBuku: 25000 });

  const uangBukuTotal = anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0);
  const anggotaWithUangBuku = anggota.filter(a => a.uangBuku > 0);
  const totalPendapatan = pendapatans.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluarans.reduce((sum, p) => sum + p.jumlah, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.jumlah <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    if (jenisForm === 'pendapatan') {
      addPendapatan({
        jenis: formData.jenis,
        deskripsi: formData.deskripsi || formData.jenis,
        jumlah: formData.jumlah,
        tanggal: '2024-01-01',
      });
    } else {
      addPengeluaran({
        jenis: formData.jenis,
        deskripsi: formData.deskripsi || formData.jenis,
        jumlah: formData.jumlah,
        tanggal: '2024-01-01',
      });
    }
    setFormData({ jenis: 'uang_buku', deskripsi: '', jumlah: 0 });
    setShowTambahForm(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Pendapatan & Pengeluaran</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Uang Buku (dari Anggota)</p>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(uangBukuTotal)}</p>
          <p className="text-sm text-slate-500">{anggotaWithUangBuku.length} anggota</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Pendapatan Lain</p>
          <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalPendapatan)}</p>
          <p className="text-sm text-slate-500">{pendapatans.length} transaksi</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</p>
          <p className="text-sm text-slate-500">{pengeluarans.length} transaksi</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setShowTambahForm(true); setJenisForm('pendapatan'); }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Tambah Pendapatan
        </button>
        <button
          onClick={() => { setShowTambahForm(true); setJenisForm('pengeluaran'); }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          + Tambah Pengeluaran
        </button>
        <button
          onClick={() => setShowUbahForm(!showUbahForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showUbahForm ? 'Tutup' : 'Ubah Uang Buku'}
        </button>
      </div>

      {showTambahForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-semibold mb-3">
            Tambah {jenisForm === 'pendapatan' ? 'Pendapatan' : 'Pengeluaran'} Baru
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={formData.jenis}
              onChange={e => setFormData({ ...formData, jenis: e.target.value })}
              className="border p-2 rounded"
            >
              {jenisForm === 'pendapatan' ? (
                <>
                  <option value="uang_buku">Uang Buku</option>
                  <option value="bunga_pinjaman">Bunga Pinjaman</option>
                  <option value="jasa_admin">Jasa Admin</option>
                  <option value="denda">Denda Keterlambatan</option>
                  <option value="lainnya">Pendapatan Lainnya</option>
                </>
              ) : (
                <>
                  <option value="gaji">Gaji & Tunjangan</option>
                  <option value="admin">Biaya Admin & Umum</option>
                  <option value="listrik">Biaya Listrik & Air</option>
                  <option value="telepon">Biaya Telepon/Internet</option>
                  <option value="supplies">Supplies Kantor</option>
                  <option value="perbaikan">Biaya Perbaikan</option>
                  <option value="charity">Charity</option>
                  <option value="lainnya">Pengeluaran Lainnya</option>
                </>
              )}
            </select>
            <input
              type="text"
              placeholder="Deskripsi (opsional)"
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
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Simpan
              </button>
              <button type="button" onClick={() => setShowTambahForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">Pendapatan Lain</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-center p-2 w-12">No</th>
                  <th className="text-left p-2">Tanggal</th>
                  <th className="text-left p-2">Jenis</th>
                  <th className="text-left p-2">Deskripsi</th>
                  <th className="text-right p-2">Jumlah</th>
                  <th className="text-center p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendapatans.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-4 text-slate-500">Belum ada pendapatan lain</td></tr>
                ) : (
                  pendapatans.map((p, index) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{index + 1}</td>
                      <td className="p-2">{formatDate(p.tanggal)}</td>
                      <td className="p-2 capitalize">{p.jenis.replace('_', ' ')}</td>
                      <td className="p-2">{p.deskripsi || '-'}</td>
                      <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => deletePendapatan(p.id)} className="text-red-600 hover:underline">Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">Pengeluaran</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-center p-2 w-12">No</th>
                  <th className="text-left p-2">Tanggal</th>
                  <th className="text-left p-2">Jenis</th>
                  <th className="text-left p-2">Deskripsi</th>
                  <th className="text-right p-2">Jumlah</th>
                  <th className="text-center p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pengeluarans.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-4 text-slate-500">Belum ada pengeluaran</td></tr>
                ) : (
                  pengeluarans.map((p, index) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-500">{index + 1}</td>
                      <td className="p-2">{formatDate(p.tanggal)}</td>
                      <td className="p-2 capitalize">{p.jenis.replace('_', ' ')}</td>
                      <td className="p-2">{p.deskripsi || '-'}</td>
                      <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => deletePengeluaran(p.id)} className="text-red-600 hover:underline">Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mt-4">
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