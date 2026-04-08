'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import { Anggota } from '@/types';

const statusPerkawinanOptions = [
  { value: 'belum_kawin', label: 'Belum Kawin' },
  { value: 'kawin', label: 'Kawin' },
  { value: 'cerai', label: 'Cerai' },
  { value: 'janda', label: 'Janda' },
  { value: 'duda', label: 'Duda' },
];

const statusRumahOptions = [
  { value: 'milik_sendiri', label: 'Milik Sendiri' },
  { value: 'sewa', label: 'Sewa' },
  { value: 'kontrak', label: 'Kontrak' },
  { value: 'menumpang', label: 'Menumpang' },
  { value: 'lainnya', label: 'Lainnya' },
];

const jenisPembayaranOptions = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'potongan_gaji', label: 'Potongan Gaji' },
];

const agamaOptions = ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Budha', 'Konghucu', 'Lainnya'];

const jumlahAnakOptions = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5+' },
];

const pekerjaanOptions = [
  { value: 'pns', label: 'PNS' },
  { value: 'tni_polri', label: 'TNI/Polri' },
  { value: 'karyawan_swasta', label: 'Karyawan Swasta' },
  { value: 'karyawan_negeri', label: 'Karyawan Negeri' },
  { value: 'wiraswasta', label: 'Wiraswasta' },
  { value: 'petani', label: 'Petani' },
  { value: 'nelayan', label: 'Nelayan' },
  { value: 'pedagang', label: 'Pedagang' },
  { value: 'tukang', label: 'Tukang' },
  { value: 'sopir', label: 'Sopir' },
  { value: 'lainnya', label: 'Lainnya' },
];

const pendapatanOptions = [
  { value: 'kurang_2jt', label: 'Kurang dari Rp 2.000.000' },
  { value: '2jt_5jt', label: 'Rp 2.000.000 s/d Rp 4.999.999' },
  { value: '5jt_10jt', label: 'Rp 5.000.000 s/d Rp 9.999.999' },
  { value: '10jt_20jt', label: 'Rp 10.000.000 s/d Rp 19.999.999' },
  { value: '20jt_keatas', label: 'Rp 20.000.000 ke atas' },
];

export default function AnggotaPage() {
  const { anggota, addAnggota, updateAnggota, deleteAnggota } = useKSP();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    nomorNBA: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: '',
    tanggalLahir: '',
    agama: '',
    alamat: '',
    alamatDomisili: '',
    statusPerkawinan: 'belum_kawin' as 'belum_kawin' | 'kawin' | 'cerai' | 'janda' | 'duda',
    namaPasangan: '',
    jumlahAnak: '0',
    namaIbuKandung: '',
    namaSaudara: '',
    noHpSaudara: '',
    pekerjaan: '',
    pendapatanPerbulan: '',
    statusRumah: 'milik_sendiri' as 'milik_sendiri' | 'sewa' | 'kontrak' | 'menumpang' | 'lainnya',
    namaReferensi: '',
    simpananPokok: 0,
    simpananWajib: 0,
    uangBuku: 0,
    jenisPembayaran: 'tunai' as 'tunai' | 'transfer' | 'potongan_gaji',
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
      nomorNBA: data.nomorNBA || '',
      jenisKelamin: data.jenisKelamin || 'L',
      tempatLahir: data.tempatLahir || '',
      tanggalLahir: data.tanggalLahir || '',
      agama: data.agama || '',
      alamat: data.alamat || '',
      alamatDomisili: data.alamatDomisili || '',
      statusPerkawinan: data.statusPerkawinan || 'belum_kawin',
      namaPasangan: data.namaPasangan || '',
      jumlahAnak: data.jumlahAnak || '0',
      namaIbuKandung: data.namaIbuKandung || '',
      namaSaudara: data.namaSaudara || '',
      noHpSaudara: data.noHpSaudara || '',
      pekerjaan: data.pekerjaan || '',
      pendapatanPerbulan: data.pendapatanPerbulan || '',
      statusRumah: data.statusRumah || 'milik_sendiri',
      namaReferensi: data.namaReferensi || '',
      simpananPokok: data.simpananPokok || 0,
      simpananWajib: data.simpananWajib || 0,
      uangBuku: data.uangBuku || 0,
      jenisPembayaran: data.jenisPembayaran || 'tunai',
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
      nomorNBA: '',
      jenisKelamin: 'L',
      tempatLahir: '',
      tanggalLahir: '',
      agama: '',
      alamat: '',
      alamatDomisili: '',
      statusPerkawinan: 'belum_kawin',
      namaPasangan: '',
      jumlahAnak: '0',
      namaIbuKandung: '',
      namaSaudara: '',
      noHpSaudara: '',
      pekerjaan: '',
      pendapatanPerbulan: '',
      statusRumah: 'milik_sendiri',
      namaReferensi: '',
      simpananPokok: 0,
      simpananWajib: 0,
      uangBuku: 0,
      jenisPembayaran: 'tunai',
      telefon: '',
      tanggalJoin: new Date().toISOString().split('T')[0],
      status: 'aktif',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getLabel = (options: {value: string, label: string}[], value: string) => options.find(o => o.value === value)?.label || value;

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
        <div className="bg-white p-4 rounded-lg shadow mb-4 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Data Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Nama Lengkap" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="border p-2 rounded" required />
                <input type="text" placeholder="NIK" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="border p-2 rounded" required />
                <input type="text" placeholder="Nomor NBA" value={formData.nomorNBA} onChange={e => setFormData({ ...formData, nomorNBA: e.target.value })} className="border p-2 rounded" />
                <select value={formData.jenisKelamin} onChange={e => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })} className="border p-2 rounded">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <input type="text" placeholder="Tempat Lahir" value={formData.tempatLahir} onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })} className="border p-2 rounded" />
                <input type="date" value={formData.tanggalLahir} onChange={e => setFormData({ ...formData, tanggalLahir: e.target.value })} className="border p-2 rounded" />
                <select value={formData.agama} onChange={e => setFormData({ ...formData, agama: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Agama</option>
                  {agamaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={formData.statusPerkawinan} onChange={e => setFormData({ ...formData, statusPerkawinan: e.target.value as any })} className="border p-2 rounded">
                  {statusPerkawinanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="text" placeholder="Nama Pasangan" value={formData.namaPasangan} onChange={e => setFormData({ ...formData, namaPasangan: e.target.value })} className="border p-2 rounded" />
                <select value={formData.jumlahAnak} onChange={e => setFormData({ ...formData, jumlahAnak: e.target.value })} className="border p-2 rounded">
                  {jumlahAnakOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="text" placeholder="Nama Ibu Kandung" value={formData.namaIbuKandung} onChange={e => setFormData({ ...formData, namaIbuKandung: e.target.value })} className="border p-2 rounded" />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Alamat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Alamat (KTP)" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="border p-2 rounded" required />
                <input type="text" placeholder="Alamat Domisili" value={formData.alamatDomisili} onChange={e => setFormData({ ...formData, alamatDomisili: e.target.value })} className="border p-2 rounded" />
                <input type="tel" placeholder="Nomor Telepon" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} className="border p-2 rounded" required />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Kontak Darurat</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Nama Saudara Tidak Serumah" value={formData.namaSaudara} onChange={e => setFormData({ ...formData, namaSaudara: e.target.value })} className="border p-2 rounded" />
                <input type="tel" placeholder="No HP Saudara" value={formData.noHpSaudara} onChange={e => setFormData({ ...formData, noHpSaudara: e.target.value })} className="border p-2 rounded" />
                <input type="text" placeholder="Nama Referensi" value={formData.namaReferensi} onChange={e => setFormData({ ...formData, namaReferensi: e.target.value })} className="border p-2 rounded" />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Pekerjaan & Pendapatan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={formData.pekerjaan} onChange={e => setFormData({ ...formData, pekerjaan: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Pekerjaan</option>
                  {pekerjaanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={formData.pendapatanPerbulan} onChange={e => setFormData({ ...formData, pendapatanPerbulan: e.target.value })} className="border p-2 rounded">
                  <option value="">Pilih Pendapatan</option>
                  {pendapatanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={formData.statusRumah} onChange={e => setFormData({ ...formData, statusRumah: e.target.value as any })} className="border p-2 rounded">
                  {statusRumahOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-1">Keanggotaan</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="number" placeholder="Simpanan Pokok" value={formData.simpananPokok || ''} onChange={e => setFormData({ ...formData, simpananPokok: Number(e.target.value) })} className="border p-2 rounded" />
                <input type="number" placeholder="Simpanan Wajib" value={formData.simpananWajib || ''} onChange={e => setFormData({ ...formData, simpananWajib: Number(e.target.value) })} className="border p-2 rounded" />
                <input type="number" placeholder="Uang Buku" value={formData.uangBuku || ''} onChange={e => setFormData({ ...formData, uangBuku: Number(e.target.value) })} className="border p-2 rounded" />
                <select value={formData.jenisPembayaran} onChange={e => setFormData({ ...formData, jenisPembayaran: e.target.value as any })} className="border p-2 rounded">
                  {jenisPembayaranOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="date" value={formData.tanggalJoin} onChange={e => setFormData({ ...formData, tanggalJoin: e.target.value })} className="border p-2 rounded" required />
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })} className="border p-2 rounded">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{editingId ? 'Update' : 'Simpan'}</button>
                  <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Batal</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Nama</th>
                <th className="text-left p-2">NIK</th>
                <th className="text-left p-2">NBA</th>
                <th className="text-left p-2">JK</th>
                <th className="text-left p-2">TTL</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Pekerjaan</th>
                <th className="text-left p-2">Pendapatan</th>
                <th className="text-center p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {anggota.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-4 text-slate-500">Belum ada anggota</td></tr>
              ) : (
                anggota.map(a => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{a.nama}</td>
                    <td className="p-2">{a.nik}</td>
                    <td className="p-2">{a.nomorNBA || '-'}</td>
                    <td className="p-2">{a.jenisKelamin === 'L' ? 'L' : 'P'}</td>
                    <td className="p-2 text-xs">{a.tempatLahir ? `${a.tempatLahir}, ${a.tanggalLahir ? new Date(a.tanggalLahir).toLocaleDateString('id-ID') : '-'}` : '-'}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span></td>
                    <td className="p-2">{a.pekerjaan ? getLabel(pekerjaanOptions, a.pekerjaan) : '-'}</td>
                    <td className="p-2 text-xs">{a.pendapatanPerbulan ? getLabel(pendapatanOptions, a.pendapatanPerbulan) : '-'}</td>
                    <td className="p-2 text-center">
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
    </div>
  );
}