'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/anggota', label: 'Anggota', icon: '👥' },
  { href: '/simpanan', label: 'Simpanan', icon: '💵' },
  { href: '/pinjaman', label: 'Pinjaman', icon: '💰' },
  { href: '/pendapatan', label: 'Pendapatan', icon: '💹' },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: '📤' },
  { href: '/shu', label: 'SHU Anggota', icon: '🎁' },
];

const laporanItems = [
  { href: '/laporan', label: 'Neraca', icon: '📊' },
  { href: '/laporan?tab=shu', label: 'SHU (Laba/Rugi)', icon: '📈' },
  { href: '/laporan?tab=ekuitas', label: 'Perubahan Ekuitas', icon: '📋' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [laporanExpanded, setLaporanExpanded] = useState(pathname.startsWith('/laporan'));

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-lg md:hidden"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block`}>
        <div className="p-4 h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-yellow-400">KSP Mulia Dana Sejahtera</h1>
            <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-yellow-500 text-slate-900 font-semibold'
                          : 'hover:bg-slate-700'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}

              {/* Laporan dengan Sub-menu */}
              <li>
                <button
                  onClick={() => setLaporanExpanded(!laporanExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/laporan')
                      ? 'bg-yellow-500 text-slate-900 font-semibold'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  <span><span className="mr-2">📈</span>Laporan</span>
                  <svg className={`w-4 h-4 transition-transform ${laporanExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {laporanExpanded && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {laporanItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`block px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-yellow-400 text-slate-900 font-semibold'
                                : 'hover:bg-slate-600'
                            }`}
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              <li>
                <Link
                  href="/kartu-simpanan"
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    pathname === '/kartu-simpanan'
                      ? 'bg-yellow-500 text-slate-900 font-semibold'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-2">📖</span>
                  Kartu Simpanan
                </Link>
              </li>
            </ul>
          </nav>

          <div className="pt-4 border-t border-slate-700 text-xs text-slate-400">
            <p className="font-semibold text-slate-300">KSP Mulia Dana Sejahtera</p>
            <p className="mt-2">Jl. Veteran No. 85</p>
            <p>Kel. Tambak Lau Mulgap I</p>
            <p>Kec. Berastagi, Kab. Karo</p>
            <p>Sumatera Utara - 22152</p>
            <p className="mt-2 text-yellow-400">📧 koperasimuliads@gmail.com</p>
            <p className="text-green-400">📱 089505117507</p>
            <div className="mt-3 pt-2 border-t border-slate-700">
              <p className="text-[10px]">NIB: 1111230014031</p>
              <p className="text-[10px]">NPWP: 99.043.935.8-128.000</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-600 text-center">
              <p className="text-[10px] text-slate-500">© 2026 MEB Tech Solutions</p>
              <p className="text-[9px] text-slate-600 mt-1">Created by Marwan Esra Bangun</p>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}