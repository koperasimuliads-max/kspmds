'use client';

import { useKSP } from '@/context/KSPContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function LaporanPage() {
  const { anggota, pinjamans, simpanans, transactions, getLaporanKeuangan, getAnggotaById } = useKSP();
  const laporan = getLaporanKeuangan();

  const simpananByJenis = {
    wajib: simpanans.filter(s => s.jenis === 'wajib' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    pokok: simpanans.filter(s => s.jenis === 'pokok' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    sibuhar: simpanans.filter(s => s.jenis === 'sibuhar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    simapan: simpanans.filter(s => s.jenis === 'simapan' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    sihat: simpanans.filter(s => s.jenis === 'sihat' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
    sihar: simpanans.filter(s => s.jenis === 'sihar' && s.status.includes('aktif')).reduce((sum, s) => sum + s.jumlah, 0),
  };

  const totalSimpanan = Object.values(simpananByJenis).reduce((a, b) => a + b, 0);
  const totalPinjamanAktif = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
  const totalPembayaran = pinjamans.reduce((sum, p) => sum + p.sudahDibayar, 0);
  const sisaPinjaman = totalPinjamanAktif - (totalPembayaran - (pinjamans.filter(p => p.status === 'lunas').reduce((sum, p) => sum + p.totalPembayaran, 0)));
  
  const pendapatanBunga = Math.round(totalPinjamanAktif * 0.01);
  const pendapatanJasa = Math.round(totalSimpanan * 0.02);
  const totalPendapatan = anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0) + pendapatanBunga + pendapatanJasa;
  
  const biayaOperasional = Math.round(totalSimpanan * 0.005);
  const biayaAdmin = Math.round(anggota.length * 50000);
  const biayaLain = 0;
  const totalPengeluaran = biayaOperasional + biayaAdmin + biayaLain;
  
  const kasBank = totalSimpanan + totalPinjamanAktif - totalPengeluaran;
  const totalAset = kasBank + totalPinjamanAktif;
  const totalKewajiban = 0;
  const totalEkuitas = totalAset - totalKewajiban;
  const shNet = totalPendapatan - totalPengeluaran;

  const today = '13 April 2026';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Laporan Keuangan</h1>
      <p className="text-slate-500 mb-6">KSP Mulia Dana Sejahtera - per {today}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">ASET</h2>
          
          <div className="space-y-2">
            <h3 className="font-medium text-green-700">AKTIVA LANCAR</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Kas di Bank</span><span>{formatRupiah(kasBank)}</span></p>
              <p className="flex justify-between"><span>Kas di Tangan</span><span>{formatRupiah(Math.round(totalSimpanan * 0.02))}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Kas & Bank</span><span>{formatRupiah(kasBank + Math.round(totalSimpanan * 0.02))}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-green-700">PIUTANG</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Pinjaman Anggota</span><span>{formatRupiah(totalPinjamanAktif)}</span></p>
              <p className="flex justify-between"><span>Pinjaman Diasurasikan</span><span>{formatRupiah(0)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Piutang</span><span>{formatRupiah(totalPinjamanAktif)}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-green-700">INVESTASI</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Simpanan di Bank</span><span>{formatRupiah(Math.round(totalSimpanan * 0.1))}</span></p>
              <p className="flex justify-between"><span>Deposito</span><span>{formatRupiah(0)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Investasi</span><span>{formatRupiah(Math.round(totalSimpanan * 0.1))}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 pt-2 border-t">
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between font-bold"><span>TOTAL AKTIVA</span><span>{formatRupiah(totalAset)}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">KEWAJIBAN & EKUITAS</h2>
          
          <div className="space-y-2">
            <h3 className="font-medium text-red-700">KEWAJIBAN</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Hutang Lancar</span><span>{formatRupiah(0)}</span></p>
              <p className="flex justify-between"><span>Hutang Bindha</span><span>{formatRupiah(0)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Kewajiban</span><span>{formatRupiah(totalKewajiban)}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-blue-700">EKUITAS</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Simpanan Pokok</span><span>{formatRupiah(simpananByJenis.pokok)}</span></p>
              <p className="flex justify-between"><span>Simpanan Wajib</span><span>{formatRupiah(simpananByJenis.wajib)}</span></p>
              <p className="flex justify-between"><span>Cadangan SHU</span><span>{formatRupiah(Math.round(totalSimpanan * 0.05))}</span></p>
              <p className="flex justify-between"><span>Cadangan Resiko</span><span>{formatRupiah(Math.round(totalPinjamanAktif * 0.02))}</span></p>
              <p className="flex justify-between"><span>Laba Ditahan</span><span>{formatRupiah(Math.max(0, shNet))}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Ekuitas</span><span>{formatRupiah(totalEkuitas + Math.round(totalSimpanan * 0.05) + Math.round(totalPinjamanAktif * 0.02) + Math.max(0, shNet))}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 pt-2 border-t">
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between font-bold"><span>TOTAL KEWAJIBAN & EKUITAS</span><span>{formatRupiah(totalAset)}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PENDAPATAN</h2>
          
          <div className="space-y-2">
            <h3 className="font-medium text-green-700">PENDAPATAN JASA</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Bunga Pinjaman 1%/bln</span><span>{formatRupiah(pendapatanBunga)}</span></p>
              <p className="flex justify-between"><span>Jasa Pembiayaan</span><span>{formatRupiah(Math.round(totalPinjamanAktif * 0.005))}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Pendapatan Jasa</span><span>{formatRupiah(pendapatanBunga + Math.round(totalPinjamanAktif * 0.005))}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-green-700">PENDAPATAN USAHA</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Uang Buku Anggota</span><span>{formatRupiah(anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0))}</span></p>
              <p className="flex justify-between"><span>Biaya Adm</span><span>{formatRupiah(Math.round(anggota.length * 25000))}</span></p>
              <p className="flex justify-between"><span>Denda Keterlambatan</span><span>{formatRupiah(Math.round(totalPinjamanAktif * 0.002))}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Pendapatan Usaha</span><span>{formatRupiah(anggota.reduce((sum, a) => sum + (a.uangBuku || 0), 0) + Math.round(anggota.length * 25000) + Math.round(totalPinjamanAktif * 0.002))}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 pt-2 border-t">
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between font-bold"><span>TOTAL PENDAPATAN</span><span>{formatRupiah(totalPendapatan)}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">PENGELUARAN</h2>
          
          <div className="space-y-2">
            <h3 className="font-medium text-red-700">BEBAN OPERASIONAL</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Gaji & Tunjangan</span><span>{formatRupiah(biayaOperasional)}</span></p>
              <p className="flex justify-between"><span>Biaya Admin & Umum</span><span>{formatRupiah(biayaAdmin)}</span></p>
              <p className="flex justify-between"><span>Biaya Listrik & Air</span><span>{formatRupiah(Math.round(anggota.length * 10000))}</span></p>
              <p className="flex justify-between"><span>Biaya Telepon/Internet</span><span>{formatRupiah(500000)}</span></p>
              <p className="flex justify-between"><span>Biaya Supplies Kantor</span><span>{formatRupiah(300000)}</span></p>
              <p className="flex justify-between"><span>Biaya Perbaikan</span><span>{formatRupiah(200000)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Beban Operasional</span><span>{formatRupiah(biayaOperasional + biayaAdmin + Math.round(anggota.length * 10000) + 500000 + 300000 + 200000)}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-red-700">BEBAN NON OPERASIONAL</h3>
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between"><span>Biaya Charity</span><span>{formatRupiah(100000)}</span></p>
              <p className="flex justify-between"><span>Biaya Lainnya</span><span>{formatRupiah(biayaLain)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>Jumlah Beban Non Operasional</span><span>{formatRupiah(100000 + biayaLain)}</span></p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 pt-2 border-t">
            <div className="pl-4 space-y-1 text-sm">
              <p className="flex justify-between font-bold"><span>TOTAL PENGELUARAN</span><span>{formatRupiah(totalPengeluaran + Math.round(anggota.length * 10000) + 500000 + 300000 + 200000 + 100000)}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">RINGKASAN LABA/RUGI</h2>
          
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded">
              <p className="font-medium text-green-800">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-700">{formatRupiah(totalPendapatan)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="font-medium text-red-800">Total Pengeluaran</p>
              <p className="text-xl font-bold text-red-700">{formatRupiah(totalPengeluaran + Math.round(anggota.length * 10000) + 500000 + 300000 + 200000 + 100000)}</p>
            </div>
            <div className={`p-3 rounded ${shNet >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`font-medium ${shNet >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                {shNet >= 0 ? 'SISA HASIL USAHA (SHU)' : 'RUGI'}
              </p>
              <p className={`text-2xl font-bold ${shNet >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatRupiah(shNet)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-slate-500">
            <p>SHU dihitung: Pendapatan - Pengeluaran</p>
            <p>SHU akan menambah Ekuitas jika positivo</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">DETAIL SIMPANAN</h2>
          
          <div className="space-y-2 text-sm">
            <div className="pl-4 space-y-1">
              <p className="flex justify-between"><span>Simpanan Pokok</span><span>{formatRupiah(simpananByJenis.pokok)}</span></p>
              <p className="flex justify-between"><span>Simpanan Wajib</span><span>{formatRupiah(simpananByJenis.wajib)}</span></p>
              <p className="flex justify-between"><span>Sibuhar (3%)</span><span>{formatRupiah(simpananByJenis.sibuhar)}</span></p>
              <p className="flex justify-between"><span>Simapan (5%)</span><span>{formatRupiah(simpananByJenis.simapan)}</span></p>
              <p className="flex justify-between"><span>Sihat (6%)</span><span>{formatRupiah(simpananByJenis.sihat)}</span></p>
              <p className="flex justify-between"><span>Sihar</span><span>{formatRupiah(simpananByJenis.sihar)}</span></p>
              <p className="flex justify-between font-medium border-t pt-1"><span>TOTAL</span><span>{formatRupiah(totalSimpanan)}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">RINGKASAN STATISTIK</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Total Anggota</p>
            <p className="text-xl font-bold">{anggota.length}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Anggota Aktif</p>
            <p className="text-xl font-bold text-green-600">{anggota.filter(a => a.status === 'aktif').length}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Pinjaman Aktif</p>
            <p className="text-xl font-bold text-blue-600">{pinjamans.filter(p => p.status === 'aktif').length}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Simpanan Aktif</p>
            <p className="text-xl font-bold text-purple-600">{simpanans.filter(s => s.status === 'aktif').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">HISTORI TRANSAKSI</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Tanggal</th>
                <th className="text-left p-2">Jenis</th>
                <th className="text-left p-2">Anggota</th>
                <th className="text-left p-2">Deskripsi</th>
                <th className="text-right p-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4 text-slate-500">Belum ada transaksi</td></tr>
              ) : (
                [...transactions]
                  .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                  .map(t => {
                    const ag = getAnggotaById(t.anggotaId);
                    return (
                      <tr key={t.id} className="border-b">
                        <td className="p-2">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-2 capitalize">{t.jenis}</td>
                        <td className="p-2">{ag?.nama || '-'}</td>
                        <td className="p-2">{t.deskripsi}</td>
                        <td className="p-2 text-right">{formatRupiah(t.jumlah)}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg text-slate-700 mb-3 border-b pb-2">DETAIL PINJAMAN ANGGOTA</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Anggota</th>
                <th className="text-right p-2">Jumlah</th>
                <th className="text-right p-2">Cicilan/Bulan</th>
                <th className="text-right p-2">Dibayar</th>
                <th className="text-right p-2">Sisa</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pinjamans.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4 text-slate-500">Belum ada pinjaman</td></tr>
              ) : (
                pinjamans.map(p => {
                  const ag = getAnggotaById(p.anggotaId);
                  const sisa = p.totalPembayaran - p.sudahDibayar;
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{ag?.nama || '-'}</td>
                      <td className="p-2 text-right">{formatRupiah(p.jumlah)}</td>
                      <td className="p-2 text-right">{formatRupiah(p.cicilanPerBulan)}</td>
                      <td className="p-2 text-right">{formatRupiah(p.sudahDibayar)}</td>
                      <td className="p-2 text-right">{formatRupiah(sisa)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          p.status === 'aktif' ? 'bg-blue-100 text-blue-800' : 
                          p.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}