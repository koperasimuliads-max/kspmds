'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Anggota, Pinjaman, Simpanan, Transaksi, Pengeluaran, Pendapatan, LaporanKeuangan, AuditLog } from '@/types';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return defaultValue;
  }
};

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { anggota: [], pinjamans: [], simpanans: [], transactions: [], pengeluarans: [], pendapatans: [], auditLogs: [] };
  }
  return {
    anggota: loadFromStorage<Anggota[]>('ksp_anggota', []),
    pinjamans: loadFromStorage<Pinjaman[]>('ksp_pinjamans', []),
    simpanans: loadFromStorage<Simpanan[]>('ksp_simpanans', []),
    transactions: loadFromStorage<Transaksi[]>('ksp_transactions', []),
    pengeluarans: loadFromStorage<Pengeluaran[]>('ksp_pengeluarans', []),
    pendapatans: loadFromStorage<Pendapatan[]>('ksp_pendapatans', []),
    auditLogs: loadFromStorage<AuditLog[]>('ksp_audit_logs', []),
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
  deleteAllSimpananByJenis: (jenis: Simpanan['jenis']) => void;
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
  fixCorruptedDates: () => void;
  getRawSimpananDates: () => void;
  resetAllSimpananDates: () => void;
  hitungBungaBulanan: () => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, tableName: string, recordId: string, details: string) => void;
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const addAuditLog = useCallback((action: string, tableName: string, recordId: string, details: string) => {
    try {
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action,
        tableName,
        recordId,
        timestamp: new Date().toISOString(),
        details,
      };
      setAuditLogs(prev => {
        const updated = [...prev, newLog];
        try {
          localStorage.setItem('ksp_audit_logs', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving audit logs:', e);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  }, []);

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
    try {
      localStorage.setItem('ksp_anggota', JSON.stringify(anggota));
    } catch (e) {
      console.error('Error saving ks p_anggota:', e);
    }
  }, [anggota, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ksp_pinjamans', JSON.stringify(pinjamans));
    } catch (e) {
      console.error('Error saving ksp_pinjamans:', e);
    }
  }, [pinjamans, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ksp_simpanans', JSON.stringify(simpanans));
    } catch (e) {
      console.error('Error saving ksp_simpanans:', e);
    }
  }, [simpanans, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ksp_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving ksp_transactions:', e);
    }
  }, [transactions, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ksp_pengeluarans', JSON.stringify(pengeluarans));
    } catch (e) {
      console.error('Error saving ksp_pengeluarans:', e);
    }
  }, [pengeluarans, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ksp_pendapatans', JSON.stringify(pendapatans));
    } catch (e) {
      console.error('Error saving ksp_pendapatans:', e);
    }
  }, [pendapatans, isHydrated]);

  const addAnggota = useCallback((data: Omit<Anggota, 'id'>) => {
    const newId = generateId();
    setAnggota(prev => [...prev, { ...data, id: newId }]);
    addAuditLog('CREATE', 'anggota', newId, `Anggota baru: ${data.nama}`);
  }, [addAuditLog]);

  const updateAnggota = useCallback((id: string, data: Partial<Anggota>) => {
    setAnggota(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    // Note: Cannot access current anggota state here due to closure
    addAuditLog('UPDATE', 'anggota', id, `Update anggota: ${Object.keys(data).join(', ')}`);
  }, [addAuditLog]);

  const deleteAnggota = useCallback((id: string) => {
    setAnggota(prev => prev.filter(a => a.id !== id));
    setSimpanans(prev => prev.filter(s => s.anggotaId !== id));
    setPinjamans(prev => prev.filter(p => p.anggotaId !== id));
    setPendapatans(prev => prev.filter(p => {
      const isUangBuku = p.jenis === 'uang_buku' && p.deskripsi?.includes('Uang Buku -');
      return !isUangBuku || !p.deskripsi?.includes(id);
    }));
    addAuditLog('DELETE', 'anggota', id, `Delete anggota`);
  }, [addAuditLog]);

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
    const newId = generateId();
    setSimpanans(prev => [...prev, { ...data, id: newId }]);
    addAuditLog('CREATE', 'simpanans', newId, `Simpanan ${data.jenis} sebesar ${data.jumlah} untuk anggota ${data.anggotaId}`);
  }, [addAuditLog]);

  const updateSimpanan = useCallback((id: string, data: Partial<Simpanan>) => {
    setSimpanans(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    addAuditLog('UPDATE', 'simpanans', id, `Update simpanan: ${Object.keys(data).join(', ')}`);
  }, [addAuditLog]);

  const deleteSimpanan = useCallback((id: string) => {
    const simpanan = simpanans.find(s => s.id === id);
    setSimpanans(prev => prev.filter(s => s.id !== id));
    if (simpanan) {
      addAuditLog('DELETE', 'simpanans', id, `Delete simpanan ${simpanan.jenis} sebesar ${simpanan.jumlah}`);
    }
  }, [simpanans, addAuditLog]);

  const deleteAllSimpananByJenis = useCallback((jenis: Simpanan['jenis']) => {
    setSimpanans(prev => prev.filter(s => s.jenis !== jenis));
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

  // Fix corrupted dates - use join date as base
  const fixCorruptedDates = useCallback(() => {
    if (!confirm('PERINGATAN!\n\nIni akan memperbaiki tanggal simpanan yang korup.\nTanggal akan diset ke tanggal join anggota.\n\nLanjutkan?')) return;
    
    setSimpanans(prev => prev.map(s => {
      // Only fix if date looks corrupted (all same or 2024-01-01)
      const isCorrupted = s.tanggalSimpan === '2024-01-01' || s.tanggalSimpan.startsWith('2024-01-01');
      if (!isCorrupted) return s;
      
      const ag = anggota.find(a => a.id === s.anggotaId);
      if (ag && ag.tanggalJoin) {
        return { ...s, tanggalSimpan: ag.tanggalJoin };
      }
      return s;
    }));
    alert('Tanggal simpanan telah diperbaiki!');
  }, [anggota]);

  // Show raw dates for debugging - opens alert with all dates
  const getRawSimpananDates = useCallback(() => {
    const data = simpanans.map(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      return {
        nama: ag?.nama || 'Unknown',
        jenis: s.jenis,
        tanggal: s.tanggalSimpan,
        jumlah: s.jumlah
      };
    });
    // Group by nama and show first 10
    const grouped = data.slice(0, 50).map((d, i) => `${i+1}. ${d.nama} | ${d.jenis} | ${d.tanggal} | ${d.jumlah}`);
    alert('DEBUG - Tanggal Simpanan (50 pertama):\n\n' + grouped.join('\n'));
    return data;
  }, [simpanans, anggota]);

  // Reset ALL simpanan dates to match anggota join date - MOST AGGRESSIVE
  const resetAllSimpananDates = useCallback(() => {
    if (!confirm('PERINGATAN MENDENGAR!\n\nIni akan RESET SEMUA tanggal simpanan ke tanggal join anggota.\n\nSEMUA record akan受到影响!\n\nYakin mau melanjutkan?')) return;
    
    setSimpanans(prev => prev.map(s => {
      const ag = anggota.find(a => a.id === s.anggotaId);
      if (ag && ag.tanggalJoin) {
        return { ...s, tanggalSimpan: ag.tanggalJoin };
      }
      return s;
    }));
    alert('SEMUA tanggal simpanan telah di-reset ke tanggal join!');
  }, [anggota]);

  const hitungBungaBulanan = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    setSimpanans(prev => prev.map(s => {
      if (s.status !== 'aktif') return s;
      
      let bungaTahunan = 0;
      if (s.jenis === 'sibuhar') bungaTahunan = 0.03;
      else if (s.jenis === 'simapan') bungaTahunan = 0.05;
      else if (s.jenis === 'sihat') bungaTahunan = 0.06;
      else return s;
      
      const bungaBulanan = s.jumlah * (bungaTahunan / 12);
      const baru = {
        ...s,
        jumlah: s.jumlah + Math.round(bungaBulanan),
        lastBungaMonth: currentMonth,
        lastBungaYear: currentYear,
      };
      return baru;
    }));
    
    const totalBunga = simpanans
      .filter(s => s.status === 'aktif' && ['sibuhar', 'simapan', 'sihat'].includes(s.jenis))
      .reduce((sum, s) => {
        let bungaTahunan = s.jenis === 'sibuhar' ? 0.03 : s.jenis === 'simapan' ? 0.05 : 0.06;
        return sum + (s.jumlah * (bungaTahunan / 12));
      }, 0);
    
    addPengeluaran({
      jenis: 'bunga_simpanan',
      jumlah: Math.round(totalBunga),
      tanggal: now.toISOString().split('T')[0],
      tahun: currentYear,
      bulan: currentMonth + 1,
      deskripsi: `Bunga simpanan bulan ${now.toLocaleString('id-ID', { month: 'long' })} ${currentYear}`,
    });
  }, [simpanans, addPengeluaran]);

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
      deleteAllSimpananByJenis,
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
      fixCorruptedDates,
      getRawSimpananDates,
      resetAllSimpananDates,
      hitungBungaBulanan,
      auditLogs,
      addAuditLog,
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