'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Anggota, Pinjaman, Simpanan, Transaksi, LaporanKeuangan } from '@/types';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const createInitialState = () => {
  if (typeof window === 'undefined') {
    return { anggota: [], pinjamans: [], simpanans: [], transactions: [] };
  }
  return {
    anggota: loadFromStorage<Anggota[]>('ksp_anggota', []),
    pinjamans: loadFromStorage<Pinjaman[]>('ksp_pinjamans', []),
    simpanans: loadFromStorage<Simpanan[]>('ksp_simpanans', []),
    transactions: loadFromStorage<Transaksi[]>('ksp_transactions', []),
  };
};

interface KSPContextType {
  anggota: Anggota[];
  pinjamans: Pinjaman[];
  simpanans: Simpanan[];
  transactions: Transaksi[];
  addAnggota: (anggota: Omit<Anggota, 'id'>) => void;
  updateAnggota: (id: string, anggota: Partial<Anggota>) => void;
  deleteAnggota: (id: string) => void;
  addPinjaman: (pinjaman: Omit<Pinjaman, 'id'>) => void;
  updatePinjaman: (id: string, pinjaman: Partial<Pinjaman>) => void;
  deletePinjaman: (id: string) => void;
  addSimpanan: (simpanan: Omit<Simpanan, 'id'>) => void;
  updateSimpanan: (id: string, simpanan: Partial<Simpanan>) => void;
  deleteSimpanan: (id: string) => void;
  addTransaksi: (transaksi: Omit<Transaksi, 'id'>) => void;
  getLaporanKeuangan: () => LaporanKeuangan;
  getAnggotaById: (id: string) => Anggota | undefined;
}

const KSPContext = createContext<KSPContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function KSPProvider({ children }: { children: ReactNode }) {
  const initialState = createInitialState();
  const [anggota, setAnggota] = useState<Anggota[]>(initialState.anggota);
  const [pinjamans, setPinjamans] = useState<Pinjaman[]>(initialState.pinjamans);
  const [simpanans, setSimpanans] = useState<Simpanan[]>(initialState.simpanans);
  const [transactions, setTransactions] = useState<Transaksi[]>(initialState.transactions);

  useEffect(() => {
    localStorage.setItem('ksp_anggota', JSON.stringify(anggota));
  }, [anggota]);

  useEffect(() => {
    localStorage.setItem('ksp_pinjamans', JSON.stringify(pinjamans));
  }, [pinjamans]);

  useEffect(() => {
    localStorage.setItem('ksp_simpanans', JSON.stringify(simpanans));
  }, [simpanans]);

  useEffect(() => {
    localStorage.setItem('ksp_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addAnggota = (data: Omit<Anggota, 'id'>) => {
    const newAnggota: Anggota = { ...data, id: generateId() };
    setAnggota(prev => [...prev, newAnggota]);
    
    const anggotaId = newAnggota.id;
    const today = new Date().toISOString().split('T')[0];
    
    if (data.simpananPokok > 0) {
      const newSimpanan: Simpanan = {
        id: generateId(),
        anggotaId,
        jumlah: data.simpananPokok,
        jenis: 'pokok',
        tanggalSimpan: today,
        status: 'aktif'
      };
      setSimpanans(prev => [...prev, newSimpanan]);
      setTransactions(prev => [...prev, {
        id: generateId(),
        jenis: 'simpanan',
        anggotaId,
        referensiId: newSimpanan.id,
        jumlah: data.simpananPokok,
        tanggal: today,
        deskripsi: `Simpanan Pokok - ${data.nama}`
      }]);
    }
    
    if (data.simpananWajib > 0) {
      const newSimpanan: Simpanan = {
        id: generateId(),
        anggotaId,
        jumlah: data.simpananWajib,
        jenis: 'wajib',
        tanggalSimpan: today,
        status: 'aktif'
      };
      setSimpanans(prev => [...prev, newSimpanan]);
      setTransactions(prev => [...prev, {
        id: generateId(),
        jenis: 'simpanan',
        anggotaId,
        referensiId: newSimpanan.id,
        jumlah: data.simpananWajib,
        tanggal: today,
        deskripsi: `Simpanan Wajib - ${data.nama}`
      }]);
    }
    
    if (data.uangBuku > 0) {
      const newSimpanan: Simpanan = {
        id: generateId(),
        anggotaId,
        jumlah: data.uangBuku,
        jenis: 'berjangka',
        tanggalSimpan: today,
        status: 'aktif'
      };
      setSimpanans(prev => [...prev, newSimpanan]);
      setTransactions(prev => [...prev, {
        id: generateId(),
        jenis: 'simpanan',
        anggotaId,
        referensiId: newSimpanan.id,
        jumlah: data.uangBuku,
        tanggal: today,
        deskripsi: `Uang Buku - ${data.nama}`
      }]);
    }
  };

  const updateAnggota = (id: string, data: Partial<Anggota>) => {
    setAnggota(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAnggota = (id: string) => {
    setAnggota(prev => prev.filter(a => a.id !== id));
    setPinjamans(prev => prev.filter(p => p.anggotaId !== id));
    setSimpanans(prev => prev.filter(s => s.anggotaId !== id));
  };

  const addPinjaman = (data: Omit<Pinjaman, 'id'>) => {
    const newPinjaman: Pinjaman = { ...data, id: generateId() };
    setPinjamans(prev => [...prev, newPinjaman]);
    
    const foundAnggota = anggota.find(a => a.id === data.anggotaId);
    setTransactions(prev => [...prev, {
      id: generateId(),
      jenis: 'pinjaman',
      anggotaId: data.anggotaId,
      referensiId: newPinjaman.id,
      jumlah: data.jumlah,
      tanggal: data.tanggalPinjaman,
      deskripsi: `Pinjaman untuk ${foundAnggota?.nama}`
    }]);
  };

  const updatePinjaman = (id: string, data: Partial<Pinjaman>) => {
    setPinjamans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deletePinjaman = (id: string) => {
    setPinjamans(prev => prev.filter(p => p.id !== id));
  };

  const addSimpanan = (data: Omit<Simpanan, 'id'>) => {
    const newSimpanan: Simpanan = { ...data, id: generateId() };
    setSimpanans(prev => [...prev, newSimpanan]);
    
    const foundAnggota = anggota.find(a => a.id === data.anggotaId);
    setTransactions(prev => [...prev, {
      id: generateId(),
      jenis: 'simpanan',
      anggotaId: data.anggotaId,
      referensiId: newSimpanan.id,
      jumlah: data.jumlah,
      tanggal: data.tanggalSimpan,
      deskripsi: `Simpanan ${data.jenis} - ${foundAnggota?.nama}`
    }]);
  };

  const updateSimpanan = (id: string, data: Partial<Simpanan>) => {
    setSimpanans(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteSimpanan = (id: string) => {
    setSimpanans(prev => prev.filter(s => s.id !== id));
  };

  const addTransaksi = (data: Omit<Transaksi, 'id'>) => {
    setTransactions(prev => [...prev, { ...data, id: generateId() }]);
    
    if (data.jenis === 'pembayaran') {
      setPinjamans(prev => prev.map(p => {
        if (p.id === data.referensiId) {
          const baru = p.sudahDibayar + data.jumlah;
          const lunas = baru >= p.totalPembayaran;
          return {
            ...p,
            sudahDibayar: baru,
            status: lunas ? 'lunas' : p.status
          };
        }
        return p;
      }));
    }
  };

  const getLaporanKeuangan = (): LaporanKeuangan => {
    const anggotaAktif = anggota.filter(a => a.status === 'aktif');
    const pinjamansAktif = pinjamans.filter(p => p.status === 'aktif');
    const simpanansAktif = simpanans.filter(s => s.status === 'aktif');

    return {
      totalSimpanan: simpanansAktif.reduce((sum, s) => sum + s.jumlah, 0),
      totalPinjaman: pinjamans.reduce((sum, p) => sum + p.jumlah, 0),
      totalPinjamanAktif: pinjamansAktif.reduce((sum, p) => sum + p.jumlah, 0),
      totalPinjamanLunas: pinjamans.filter(p => p.status === 'lunas').length,
      totalPembayaranPinjaman: pinjamans.reduce((sum, p) => sum + p.sudahDibayar, 0),
      jumlahAnggotaAktif: anggotaAktif.length,
      jumlahPinjamanAktif: pinjamansAktif.length,
      jumlahSimpananAktif: simpanansAktif.length,
    };
  };

  const getAnggotaById = (id: string) => anggota.find(a => a.id === id);

  return (
    <KSPContext.Provider value={{
      anggota,
      pinjamans,
      simpanans,
      transactions,
      addAnggota,
      updateAnggota,
      deleteAnggota,
      addPinjaman,
      updatePinjaman,
      deletePinjaman,
      addSimpanan,
      updateSimpanan,
      deleteSimpanan,
      addTransaksi,
      getLaporanKeuangan,
      getAnggotaById,
    }}>
      {children}
    </KSPContext.Provider>
  );
}

export function useKSP() {
  const context = useContext(KSPContext);
  if (!context) {
    throw new Error('useKSP must be used within KSPProvider');
  }
  return context;
}