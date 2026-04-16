'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Anggota, Pinjaman, Simpanan, Transaksi, Pengeluaran, Pendapatan, LaporanKeuangan } from '@/types';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { anggota: [], pinjamans: [], simpanans: [], transactions: [], pengeluarans: [], pendapatans: [] };
  }
  return {
    anggota: loadFromStorage<Anggota[]>('ksp_anggota', []),
    pinjamans: loadFromStorage<Pinjaman[]>('ksp_pinjamans', []),
    simpanans: loadFromStorage<Simpanan[]>('ksp_simpanans', []),
    transactions: loadFromStorage<Transaksi[]>('ksp_transactions', []),
    pengeluarans: loadFromStorage<Pengeluaran[]>('ksp_pengeluarans', []),
    pendapatans: loadFromStorage<Pendapatan[]>('ksp_pendapatans', []),
  };
};

interface KSPContextType {
  anggota: Anggota[];
  pinjamans: Pinjaman[];
  simpanans: Simpanan[];
  transactions: Transaksi[];
  pengeluarans: Pengeluaran[];
  pendapatans: Pendapatan[];
  isHydrated: boolean;
  addAnggota: (anggota: Omit<Anggota, 'id'>) => void;
  updateAnggota: (id: string, anggota: Partial<Anggota>) => void;
  deleteAnggota: (id: string) => void;
  clearAllAnggota: () => void;
  addPinjaman: (pinjaman: Omit<Pinjaman, 'id'>) => void;
  updatePinjaman: (id: string, pinjaman: Partial<Pinjaman>) => void;
  deletePinjaman: (id: string) => void;
  addSimpanan: (simpanan: Omit<Simpanan, 'id'>) => void;
  updateSimpanan: (id: string, simpanan: Partial<Simpanan>) => void;
  deleteSimpanan: (id: string) => void;
  addTransaksi: (transaksi: Omit<Transaksi, 'id'>) => void;
  deleteTransaksi: (id: string) => void;
  addPengeluaran: (pengeluaran: Omit<Pengeluaran, 'id'>) => void;
  updatePengeluaran: (id: string, pengeluaran: Partial<Pengeluaran>) => void;
  deletePengeluaran: (id: string) => void;
  addPendapatan: (pendapatan: Omit<Pendapatan, 'id'>) => void;
  updatePendapatan: (id: string, pendapatan: Partial<Pendapatan>) => void;
  deletePendapatan: (id: string) => void;
  getLaporanKeuangan: () => LaporanKeuangan;
  getAnggotaById: (id: string) => Anggota | undefined;
  bulkUpdateTanggalJoin: (startNBA: number, endNBA: number, tanggal: string) => void;
  bulkUpdateUangBuku: (startNBA: number, endNBA: number, jumlah: number) => void;
  fixSimpananTanggal: () => void;
}

const KSPContext = createContext<KSPContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function KSPProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [pinjamans, setPinjamans] = useState<Pinjaman[]>([]);
  const [simpanans, setSimpanans] = useState<Simpanan[]>([]);
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [pengeluarans, setPengeluarans] = useState<Pengeluaran[]>([]);
  const [pendapatans, setPendapatans] = useState<Pendapatan[]>([]);

  useEffect(() => {
    const loadData = () => {
      try {
        const storedAnggota = localStorage.getItem('ksp_anggota');
        const storedPinjamans = localStorage.getItem('ksp_pinjamans');
        const storedSimpanans = localStorage.getItem('ksp_simpanans');
        const storedTransactions = localStorage.getItem('ksp_transactions');
        const storedPengeluarans = localStorage.getItem('ksp_pengeluarans');
        const storedPendapatans = localStorage.getItem('ksp_pendapatans');

        if (storedAnggota) setAnggota(JSON.parse(storedAnggota));
        if (storedPinjamans) setPinjamans(JSON.parse(storedPinjamans));
        if (storedSimpanans) setSimpanans(JSON.parse(storedSimpanans));
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedPengeluarans) setPengeluarans(JSON.parse(storedPengeluarans));
        if (storedPendapatans) setPendapatans(JSON.parse(storedPendapatans));
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
      setIsHydrated(true);
    };

    if (typeof window !== 'undefined') {
      loadData();
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('ksp_anggota', JSON.stringify(anggota));
  }, [anggota, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('ksp_pinjamans', JSON.stringify(pinjamans));
  }, [pinjamans, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('ksp_simpanans', JSON.stringify(simpanans));
  }, [simpanans, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('ksp_transactions', JSON.stringify(transactions));
  }, [transactions, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('ksp_pengeluarans', JSON.stringify(pengeluarans));
  }, [pengeluarans, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('ksp_pendapatans', JSON.stringify(pendapatans));
  }, [pendapatans, isHydrated]);

  const addAnggota = useCallback((data: Omit<Anggota, 'id'>) => {
    setAnggota(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const updateAnggota = useCallback((id: string, data: Partial<Anggota>) => {
    setAnggota(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    
    if (data.simpananPokok !== undefined || data.simpananWajib !== undefined || data.uangBuku !== undefined) {
      setTimeout(() => {
        const updated = anggota.find(a => a.id === id);
        if (!updated) return;
        
        if (data.simpananPokok !== undefined) {
          setSimpanans(prev => prev.map(s => 
            s.anggotaId === id && s.jenis === 'pokok' ? { ...s, jumlah: data.simpananPokok! } : s
          ));
        }
        if (data.simpananWajib !== undefined) {
          setSimpanans(prev => prev.map(s => 
            s.anggotaId === id && s.jenis === 'wajib' ? { ...s, jumlah: data.simpananWajib! } : s
          ));
        }
        if (data.uangBuku !== undefined) {
          setPendapatans(prev => prev.map(p => 
            p.jenis === 'uang_buku' && p.deskripsi?.includes(`Uang Buku - ${updated.nama}`) 
              ? { ...p, jumlah: data.uangBuku! } 
              : p
          ));
        }
      }, 100);
    }
  }, [anggota]);

  const deleteAnggota = useCallback((id: string) => {
    setAnggota(prev => prev.filter(a => a.id !== id));
    setSimpanans(prev => prev.filter(s => s.anggotaId !== id));
    setPinjamans(prev => prev.filter(p => p.anggotaId !== id));
    setPendapatans(prev => prev.filter(p => {
      const isUangBuku = p.jenis === 'uang_buku' && p.deskripsi?.includes('Uang Buku -');
      return !isUangBuku || !p.deskripsi?.includes(id);
    }));
  }, []);

  const clearAllAnggota = useCallback(() => {
    setAnggota([]);
    setSimpanans([]);
    setPinjamans([]);
    localStorage.removeItem('ksp_anggota');
    localStorage.removeItem('ksp_simpanans');
    localStorage.removeItem('ksp_pinjamans');
  }, []);

  const addPinjaman = useCallback((data: Omit<Pinjaman, 'id'>) => {
    setPinjamans(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const updatePinjaman = useCallback((id: string, data: Partial<Pinjaman>) => {
    setPinjamans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePinjaman = useCallback((id: string) => {
    setPinjamans(prev => prev.filter(p => p.id !== id));
  }, []);

  const addSimpanan = useCallback((data: Omit<Simpanan, 'id'>) => {
    setSimpanans(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const updateSimpanan = useCallback((id: string, data: Partial<Simpanan>) => {
    setSimpanans(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteSimpanan = useCallback((id: string) => {
    setSimpanans(prev => prev.filter(s => s.id !== id));
  }, []);

  const addTransaksi = useCallback((data: Omit<Transaksi, 'id'>) => {
    setTransactions(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const deleteTransaksi = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const addPengeluaran = useCallback((data: Omit<Pengeluaran, 'id'>) => {
    setPengeluarans(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const updatePengeluaran = useCallback((id: string, data: Partial<Pengeluaran>) => {
    setPengeluarans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePengeluaran = useCallback((id: string) => {
    setPengeluarans(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPendapatan = useCallback((data: Omit<Pendapatan, 'id'>) => {
    setPendapatans(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const updatePendapatan = useCallback((id: string, data: Partial<Pendapatan>) => {
    setPendapatans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePendapatan = useCallback((id: string) => {
    setPendapatans(prev => prev.filter(p => p.id !== id));
  }, []);

  const getLaporanKeuangan = useCallback((): LaporanKeuangan => {
    const totalSimpanan = simpanans.filter(s => s.status === 'aktif').reduce((sum, s) => sum + s.jumlah, 0);
    const totalPinjamanAktif = pinjamans.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.jumlah, 0);
    const totalPinjamanLunas = pinjamans.filter(p => p.status === 'lunas').length;
    const totalPembayaran = pinjamans.reduce((sum, p) => sum + (p.sudahDibayar || 0), 0);

    return {
      totalSimpanan,
      totalPinjaman: totalPinjamanAktif,
      totalPinjamanAktif,
      totalPinjamanLunas,
      totalPembayaranPinjaman: totalPembayaran,
      jumlahAnggotaAktif: anggota.filter(a => a.status === 'aktif').length,
      jumlahPinjamanAktif: pinjamans.filter(p => p.status === 'aktif').length,
      jumlahSimpananAktif: simpanans.filter(s => s.status === 'aktif').length,
    };
  }, [anggota, pinjamans, simpanans]);

  const getAnggotaById = useCallback((id: string) => {
    return anggota.find(a => a.id === id);
  }, [anggota]);

  const bulkUpdateTanggalJoin = useCallback((startNBA: number, endNBA: number, tanggal: string) => {
    setAnggota(prev => prev.map(a => {
      const nbaNum = parseInt(a.nomorNBA);
      if (!isNaN(nbaNum) && nbaNum >= startNBA && nbaNum <= endNBA) {
        return { ...a, tanggalJoin: tanggal };
      }
      return a;
    }));
  }, []);

  const bulkUpdateUangBuku = useCallback((startNBA: number, endNBA: number, jumlah: number) => {
    setAnggota(prev => prev.map(a => {
      const nbaNum = parseInt(a.nomorNBA);
      if (!isNaN(nbaNum) && nbaNum >= startNBA && nbaNum <= endNBA) {
        return { ...a, uangBuku: jumlah };
      }
      return a;
    }));
  }, []);

  const fixSimpananTanggal = useCallback(() => {
    setSimpanans(prev => prev.map(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      if (ag && ag.tanggalJoin && (s.jenis === 'pokok' || s.jenis === 'wajib')) {
        return { ...s, tanggalSimpan: ag.tanggalJoin };
      }
      return s;
    }));
  }, [anggota]);

  return (
    <KSPContext.Provider value={{
      anggota,
      pinjamans,
      simpanans,
      transactions,
      pengeluarans,
      pendapatans,
      isHydrated,
      addAnggota,
      updateAnggota,
      deleteAnggota,
      clearAllAnggota,
      addPinjaman,
      updatePinjaman,
      deletePinjaman,
      addSimpanan,
      updateSimpanan,
      deleteSimpanan,
      addTransaksi,
      deleteTransaksi,
      addPengeluaran,
      updatePengeluaran,
      deletePengeluaran,
      addPendapatan,
      updatePendapatan,
      deletePendapatan,
      getLaporanKeuangan,
      getAnggotaById,
      bulkUpdateTanggalJoin,
      bulkUpdateUangBuku,
      fixSimpananTanggal,
    }}>
      {children}
    </KSPContext.Provider>
  );
}

export function useKSP() {
  const context = useContext(KSPContext);
  if (!context) {
    throw new Error('useKSP must be used within a KSPProvider');
  }
  return context;
}