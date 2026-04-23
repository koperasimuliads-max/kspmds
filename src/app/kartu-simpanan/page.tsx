'use client';

import { useState, useMemo, useEffect } from 'react';
import { useKSP } from '@/context/KSPContext';
import { formatDate, parseDate } from '@/utils/dateUtils';
import BackButton from '@/components/BackButton';

// Debug function
const debugSimpanans = (simpanans: any[], selectedAnggotaId: string) => {
  const filtered = simpanans.filter(s => s.anggotaId === selectedAnggotaId);
  console.log('Raw simpanans data for selected anggota:', filtered.map(s => ({
    id: s.id,
    jenis: s.jenis,
    tanggalSimpan: s.tanggalSimpan,
    jumlah: s.jumlah,
    status: s.status
  })));
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function KartuSimpananPage() {
  const { anggota, simpanans } = useKSP();
  const [selectedAnggotaId, setSelectedAnggotaId] = useState<string>('');
  const [searchAnggota, setSearchAnggota] = useState('');

  const selectedAnggota = anggota.find(a => a.id === selectedAnggotaId);

  // Update search text when anggota is selected
  useEffect(() => {
    if (selectedAnggota && !searchAnggota.includes(selectedAnggota.nama)) {
      setSearchAnggota(selectedAnggota.nama + ' (NBA: ' + (selectedAnggota.nomorNBA || 'N/A') + ')');
    }
  }, [selectedAnggota, searchAnggota]);

  const mutasiData = useMemo(() => {
    if (!selectedAnggotaId) return [];

    // Debug: log raw simpanans data
    debugSimpanans(simpanans, selectedAnggotaId);

    const simpananRecords = simpanans
      .filter(s => s.anggotaId === selectedAnggotaId && s.status !== 'ditarik')
      .map(s => ({
        tanggal: s.tanggalSimpan,
        uraian: `Setoran ${s.jenis}`,
        debet: s.jumlah,
        kredit: 0,
        jenis: 'simpanan',
        originalDate: s.tanggalSimpan
      }));

    console.log('Mutasi records:', simpananRecords.map(r => ({
      uraian: r.uraian,
      tanggal: r.tanggal,
      parsedDate: parseDate(r.tanggal)?.toISOString()
    })));

    return simpananRecords
      .sort((a, b) => {
        const dateA = parseDate(a.originalDate) || parseDate(a.tanggal);
        const dateB = parseDate(b.originalDate) || parseDate(b.tanggal);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });
  }, [selectedAnggotaId, simpanans]);

  const totalSaldo = useMemo(() => {
    return mutasiData.reduce((sum, item) => sum + item.debet - item.kredit, 0);
  }, [mutasiData]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Kartu Simpanan Anggota</h1>
      </div>

      {/* Cari Anggota */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 print:hidden">
        <label className="block text-sm font-medium mb-2">Cari Anggota:</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Ketik nama atau No. NBA anggota..."
            value={searchAnggota}
            onChange={e => setSearchAnggota(e.target.value)}
            className="border p-2 rounded w-full"
          />
          {searchAnggota && (
            <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
              {anggota
                .filter(a => {
                  if (!searchAnggota.trim()) return false;
                  const query = searchAnggota.toLowerCase().trim();
                  return a.nama.toLowerCase().includes(query) ||
                         (a.nomorNBA || '').toLowerCase().includes(query);
                })
                .sort((a, b) => {
                  const query = searchAnggota.toLowerCase().trim();
                  // Prioritize exact matches
                  const aExact = a.nama.toLowerCase() === query || (a.nomorNBA || '').toLowerCase() === query;
                  const bExact = b.nama.toLowerCase() === query || (b.nomorNBA || '').toLowerCase() === query;
                  if (aExact && !bExact) return -1;
                  if (!aExact && bExact) return 1;
                  // Then starts with
                  const aStarts = a.nama.toLowerCase().startsWith(query) || (a.nomorNBA || '').toLowerCase().startsWith(query);
                  const bStarts = b.nama.toLowerCase().startsWith(query) || (b.nomorNBA || '').toLowerCase().startsWith(query);
                  if (aStarts && !bStarts) return -1;
                  if (!aStarts && bStarts) return 1;
                  // Finally alphabetical by name
                  return a.nama.localeCompare(b.nama);
                })
                .slice(0, 10) // Limit to 10 results
                .map(a => (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAnggotaId(a.id);
                    setSearchAnggota(a.nama + ' (NBA: ' + (a.nomorNBA || 'N/A') + ')');
                  }}
                  className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium">{a.nama}</div>
                  <div className="text-sm text-gray-500">NBA: {a.nomorNBA || 'N/A'}</div>
                </div>
              ))}
              {anggota.filter(a => {
                const query = searchAnggota.toLowerCase().trim();
                return a.nama.toLowerCase().includes(query) || (a.nomorNBA || '').toLowerCase().includes(query);
              }).length === 0 && (
                <div className="p-2 text-gray-500">Tidak ada anggota ditemukan</div>
              )}
            </div>
          )}
          {selectedAnggotaId && (
            <button
              onClick={() => {
                setSelectedAnggotaId('');
                setSearchAnggota('');
              }}
              className="absolute right-2 top-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {selectedAnggota && (
        <>
          {/* Header Info */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
            <h2 className="text-2xl font-bold mb-2">KSP Mulia Dana Sejahtera</h2>
            <p className="text-blue-100">Kartu Mutasi Simpanan Anggota</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-blue-200">Nama Anggota</p>
                <p className="font-semibold">{selectedAnggota.nama}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Nomor NBA</p>
                <p className="font-semibold">{selectedAnggota.nomorNBA}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Tanggal Join</p>
                <p className="font-semibold">{formatDate(selectedAnggota.tanggalJoin)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Total Saldo</p>
                <p className="font-bold text-xl">{formatRupiah(totalSaldo)}</p>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <div className="mb-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              🖨️ Cetak Kartu Simpanan
            </button>
          </div>

          {/* Mutasi Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Uraian</th>
                  <th className="text-right p-3">Debet (Masuk)</th>
                  <th className="text-right p-3">Kredit (Keluar)</th>
                  <th className="text-right p-3">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {mutasiData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-slate-500">
                      Belum ada mutasi simpanan
                    </td>
                  </tr>
                ) : (
                  mutasiData.map((m, index) => {
                    const runningBalance = mutasiData
                      .slice(index)
                      .reduce((sum, item) => sum + item.debet - item.kredit, 0);
                    return (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-center">{index + 1}</td>
                        <td className="p-3">{formatDate(m.originalDate) || formatDate(m.tanggal) || '-'}</td>
                        <td className="p-3 capitalize">{m.uraian}</td>
                        <td className="p-3 text-right text-green-600">
                          {m.debet > 0 ? formatRupiah(m.debet) : '-'}
                        </td>
                        <td className="p-3 text-right text-red-600">
                          {m.kredit > 0 ? formatRupiah(m.kredit) : '-'}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatRupiah(runningBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-blue-50 font-bold">
                <tr>
                  <td colSpan={5} className="p-3 text-right">TOTAL SALDO:</td>
                  <td className="p-3 text-right text-blue-800">{formatRupiah(totalSaldo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature */}
          <div className="mt-8 grid grid-cols-3 gap-4 print:break-before-page">
            <div className="text-center">
              <p className="text-sm mb-1">Admin/Kasir</p>
              <div className="h-12"></div>
              <p className="text-slate-500">Erni Sembiring</p>
            </div>
            <div className="text-center">
              <p className="text-sm mb-1">Manager</p>
              <div className="h-12"></div>
              <p className="text-slate-500">Marwan Esra Bangun</p>
            </div>
            <div className="text-center">
              <p className="text-sm mb-1">Anggota</p>
              <div className="h-12"></div>
              <p className="border-t border-black inline-block px-8">{selectedAnggota.nama}</p>
            </div>
          </div>
        </>
      )}

      {!selectedAnggota && (
        <div className="text-center text-slate-500 py-12">
          Silakan pilih anggota untuk melihat kartu simpanan
        </div>
      )}
    </div>
  );
}