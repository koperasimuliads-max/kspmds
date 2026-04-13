'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Pinjaman } from '@/types';

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

function hitungKolektibilitas(hariTerlambat: number): 'lancar' | 'kurang_lancar' | 'diragukan' | 'macet' {
  if (hariTerlambat <= 90) return 'lancar';
  if (hariTerlambat <= 120) return 'kurang_lancar';
  if (hariTerlambat <= 180) return 'diragukan';
  return 'macet';
}

function hitungKategoriKesehatan(npl: number): { nilai: number; kategori: string } {
  if (npl < 5) return { nilai: 1, kategori: 'Sehat' };
  if (npl <= 10) return { nilai: 2, kategori: 'Cukup Sehat' };
  if (npl <= 15) return { nilai: 3, kategori: 'Kurang Sehat' };
  return { nilai: 4, kategori: 'Tidak Sehat' };
}

export default function PinjamanPage() {
  const { anggota, pinjamans, addPinjaman, updatePinjaman, deletePinjaman, addTransaksi } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [showBayar, setShowBayar] = useState<string | null>(null);
  const [showHitung, setShowHitung] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    anggotaId: '',
    jumlah: 0,
    bunga: 12,
    tenor: 12,
    tanggalPinjaman: '2024-01-01',
    status: 'aktif' as 'aktif' | 'lunas' | 'macet',
    cicilanPerBulan: 0,
    totalPembayaran: 0,
    sudahDibayar: 0,
    hariTerlambat: 0,
    kolektibilitas: 'lancar' as 'lancar' | 'kurang_lancar' | 'diragukan' | 'macet',
    kategoriKesehatan: 'sehat' as 'sehat' | 'cukup_sehat' | 'kurang_sehat' | 'tidak_sehat',
  });
  const [jumlahBayar, setJumlahBayar] = useState(0);
  const [hariTerlambatInput, setHariTerlambatInput] = useState(0);

  const hitungCicilan = (jumlah: number, bunga: number, tenor: number) => {
    const bungaPerBulan = bunga / 100 / 12;
    const cicilan = (jumlah * bungaPerBulan * Math.pow(1 + bungaPerBulan, tenor)) / (Math.pow(1 + bungaPerBulan, tenor) - 1);
    return Math.round(cicilan);
  };

  const hitungNPL = () => {
    const totalPinjamanAktif = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
    const totalPinjamanBermasalah = pinjamans.filter(p => p.status === 'aktif' && (p.kolektibilitas === 'kurang_lancar' || p.kolektibilitas === 'diragukan' || p.kolektibilitas === 'macet')).reduce((sum, p) => sum + p.jumlah, 0);
    if (totalPinjamanAktif === 0) return 0;
    return (totalPinjamanBermasalah / totalPinjamanAktif) * 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cicilan = hitungCicilan(formData.jumlah, formData.bunga, formData.tenor);
    const total = cicilan * formData.tenor;
    const kolek = hitungKolektibilitas(formData.hariTerlambat);
    
    const data = {
      ...formData,
      cicilanPerBulan: cicilan,
      totalPembayaran: total,
      kolektibilitas: kolek,
    };
    
    if (editingId) {
      updatePinjaman(editingId, data);
      setEditingId(null);
    } else {
      addPinjaman(data);
      
      const ag = anggota.find(a => a.id === formData.anggotaId);
      addTransaksi({
        jenis: 'pinjaman',
        anggotaId: formData.anggotaId,
        referensiId: '',
        jumlah: formData.jumlah,
        tanggal: formData.tanggalPinjaman,
        deskripsi: `Pinjaman dari ${ag?.nama || '-'}`,
      });
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
      hariTerlambat: data.hariTerlambat || 0,
      kolektibilitas: data.kolektibilitas || 'lancar',
      kategoriKesehatan: data.kategoriKesehatan || 'sehat',
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
        tanggal: '2024-01-01',
        deskripsi: `Pembayaran cicilan pinjaman`,
      });
      setShowBayar(null);
      setJumlahBayar(0);
    }
  };

  const handleHitungKolek = () => {
    const kolek = hitungKolektibilitas(hariTerlambatInput);
    const npl = hitungNPL();
    const kesehatan = hitungKesehatan(npl);
    setFormData({
      ...formData,
      hariTerlambat: hariTerlambatInput,
      kolektibilitas: kolek,
      kategoriKesehatan: kesehatan,
    });
    setShowHitung(null);
  };

  const hitungKesehatan = (npl: number): 'sehat' | 'cukup_sehat' | 'kurang_sehat' | 'tidak_sehat' => {
    if (npl < 5) return 'sehat';
    if (npl <= 10) return 'cukup_sehat';
    if (npl <= 15) return 'kurang_sehat';
    return 'tidak_sehat';
  };

  const resetForm = () => {
    setFormData({
      anggotaId: '',
      jumlah: 0,
      bunga: 12,
      tenor: 12,
      tanggalPinjaman: '2024-01-01',
      status: 'aktif',
      cicilanPerBulan: 0,
      totalPembayaran: 0,
      sudahDibayar: 0,
      hariTerlambat: 0,
      kolektibilitas: 'lancar',
      kategoriKesehatan: 'sehat',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const anggotaAktif = anggota.filter(a => a.status === 'aktif');
  const npl = hitungNPL();
  const kesehatan = hitungNPL() > 0 ? hitungKategoriKesehatan(hitungNPL()) : { nilai: 1, kategori: 'Sehat' };

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

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold mb-2">Kesehatan Pinjaman (NPL)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-slate-500">Total Pinjaman Aktif</p>
            <p className="font-bold">{formatRupiah(pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0))}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-slate-500">NPL (%)</p>
            <p className="font-bold text-red-600">{npl.toFixed(2)}%</p>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-slate-500">Nilai</p>
            <p className="font-bold">{kesehatan.nilai}</p>
          </div>
          <div className={`p-2 rounded ${kesehatan.kategori === 'Sehat' ? 'bg-green-100' : kesehatan.kategori === 'Cukup Sehat' ? 'bg-blue-100' : kesehatan.kategori === 'Kurang Sehat' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            <p className="text-slate-500">Kategori</p>
            <p className="font-bold">{kesehatan.kategori}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Pinjaman' : 'Ajukan Pinjaman Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            </div>
            {formData.jumlah > 0 && formData.bunga > 0 && formData.tenor > 0 && (
              <div className="mt-3 p-3 bg-slate-100 rounded">
                <p>Estimasi Cicilan per Bulan: <strong>{formatRupiah(hitungCicilan(formData.jumlah, formData.bunga, formData.tenor))}</strong></p>
                <p>Total Pembayaran: <strong>{formatRupiah(hitungCicilan(formData.jumlah, formData.bunga, formData.tenor) * formData.tenor)}</strong></p>
              </div>
            )}
          </form>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">Hitung Kolektibilitas & Kesehatan Pinjaman</h4>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Hari Terlambat"
                value={hariTerlambatInput || ''}
                onChange={e => setHariTerlambatInput(Number(e.target.value))}
                className="border p-2 rounded w-40"
              />
              <button
                type="button"
                onClick={handleHitungKolek}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Hitung
              </button>
              {formData.hariTerlambat > 0 && (
                <span className="ml-2 text-sm">
                  Kolektibilitas: <strong>{formData.kolektibilitas === 'lancar' ? 'Lancar' : formData.kolektibilitas === 'kurang_lancar' ? 'Kurang Lancar' : formData.kolektibilitas === 'diragukan' ? 'Diragukan' : 'Macet'}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kolektibilitas: Lancar (0-90 hari), Kurang Lancar (91-120 hari), Diragukan (121-180 hari), Macet ({'>'}180 hari)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-center p-2 w-12">No</th>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Nama Anggota</th>
              <th className="text-right p-2">Jumlah Pinjaman</th>
              <th className="text-right p-2">Bunga</th>
              <th className="text-right p-2">Tenor</th>
              <th className="text-right p-2">Cicilan/Bulan</th>
              <th className="text-right p-2">Dibayar</th>
              <th className="text-left p-2">Kolek</th>
              <th className="text-left p-2">Status</th>
              <th className="text-center p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pinjamans.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4 text-slate-500">Belum ada pinjaman</td>
              </tr>
            ) : (
              pinjamans.map((p, index) => {
                const ag = anggota.find(a => a.id === p.anggotaId);
                const kolekLabel = p.kolektibilitas === 'lancar' ? 'Lancar' : p.kolektibilitas === 'kurang_lancar' ? 'Kurang Lancar' : p.kolektibilitas === 'diragukan' ? 'Diragukan' : 'Macet';
                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 text-center text-slate-500">{index + 1}</td>
                    <td className="p-2">{formatDate(p.tanggalPinjaman)}</td>
                    <td className="p-2 font-medium">{ag?.nama || '-'}</td>
                    <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                    <td className="p-2 text-right">{p.bunga}%</td>
                    <td className="p-2 text-right">{p.tenor} bln</td>
                    <td className="p-2 text-right">{formatRupiah(p.cicilanPerBulan)}</td>
                    <td className="p-2 text-right">{formatRupiah(p.sudahDibayar)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.kolektibilitas === 'lancar' ? 'bg-green-100 text-green-800' :
                        p.kolektibilitas === 'kurang_lancar' ? 'bg-yellow-100 text-yellow-800' :
                        p.kolektibilitas === 'diragukan' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {kolekLabel}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'aktif' ? 'bg-blue-100 text-blue-800' : 
                        p.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">
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