# Active Context: KSP Mulia Dana Sejahtera

## Current State

**Project Status**: ✅ KSP financial management app operational

Building a KSP (Kredit Simpanan Pinjaman) financial management application called "KSP Mulia Dana Sejahtera" with automatic data linking between modules, clean UI, and reliable financial reporting.

## Recently Completed

- [x] Fixed balance sheet - Kas(Netto) = Total Simpanan - Total Pinjaman (uang yang dipinjamkan mengurangi kas)
- [x] Fixed balance sheet - removed Utang Pinjaman from liabilities
- [x] Fixed balance sheet - updated old variable references (simpananHarian, simpananBerencana, simpananBerjangka) to use simpananSukarela
- [x] Fixed laporan page - removed double counting, only counts from simpanans/pinjamans/pendapatans/pengeluarans tables
- [x] Added Pendapatan type and state to context for tracking income
- [x] Added auto-fix for simpanan dates to match anggota.tanggalJoin
- [x] Added formatter functions for currency input with thousand separators in Pinjaman and Simpanan pages
- [x] Added live search with dropdown in Anggota page - search by NBA or name, click to edit
- [x] Added "alamat sama KTP" checkbox feature for anggota form
- [x] Added "anggota keluar" feature with status change to nonaktif and tanggalKeluar tracking
- [x] Simplified laporan page - removed calculated/assumed values, only shows actual data
- [x] Removed transactions menu - not needed
- [x] Removed add buttons from Pendapatan/Pengeluaran pages - only Edit button remains
- [x] Added viewMode toggle ('data' vs 'tambah') to separate data view from input form
- [x] Fixed syntax errors in anggota/page.tsx - corrected JSX fragments and indentation
- [x] Added print functionality in Anggota page with no-print class for controls
- [x] Made simpanan pokok (100rb), wajib (25rb), uang buku (25rb) auto-filled and non-editable
- [x] Added conditional field visibility - nama pasangan & jumlah anak only show when status perkawinan != belum_kawin
- [x] Added BackButton component for navigation back to previous page
- [x] Added comprehensive anggota keluar flow: check active loans, show summary, auto-withdraw savings, add pendapatan administrasi (Rp 50.000)
- [x] Fixed date formatting - created formatDate utility to properly display dates in dd/mm/yyyy format without timezone issues
- [x] Added search column for anggota in simpanan page - search by NBA or nama
- [x] Fixed linting error in kartu-simpanan page - removed useEffect that was calling setState synchronously
- [x] Added search column for anggota in kartu-simpanan page - search by NBA or nama
- [x] Added seedSampleData function to KSPContext to restore sample data from CSV
- [x] Added "Restore Sample Data" button on Dashboard to repopulate data

## Current Focus

All main features are complete. The app now has:
- Dashboard with navigation and Restore Sample Data button
- Data Anggota with live search, print, viewMode toggle, auto-filled simpanan values
- Data Simpanan with number formatting and BackButton
- Data Pinjaman with NPL health indicator and BackButton
- Pendapatan & Pengeluaran combined view with BackButton
- Laporan Keuangan (simplified) with BackButton
- Ability to restore sample data from /contoh_import_anggota.csv

## Relevant Files

| File/Directory | Purpose |
|----------------|---------|
| `src/context/KSPContext.tsx` | All state and functions for data management |
| `src/app/laporan/page.tsx` | Financial reports - shows only actual data |
| `src/app/anggota/page.tsx` | Member management with live search, print, keluar feature |
| `src/app/simpanan/page.tsx` | Savings with number formatting |
| `src/app/pinjaman/page.tsx` | Loans with number formatting |
| `src/app/pendapatan/page.tsx` | Income/expense tracking |
| `src/components/BackButton.tsx` | Back navigation component |
| `src/utils/dateUtils.ts` | Date formatting utility for dd/mm/yyyy format |

## Key Features Implemented

1. **No double counting** - reports only count from actual transaction tables
2. **Date auto-fix** - simpanan dates automatically match anggota.tanggalJoin on import
3. **Number formatting** - thousand separators for currency inputs
4. **Live search** - find members by NBA or name quickly
5. **View separation** - Data view separate from Tambah form
6. **Alamat sama KTP** - checkbox to copy KTP address to domisili
7. **Anggota keluar** - comprehensive flow with loan check, savings auto-withdraw, Rp 50k admin fee to pendapatan
8. **Back navigation** - BackButton on all pages except dashboard
9. **Print functionality** - print table with no-print class for controls
10. **Restore Sample Data** - button on dashboard to repopulate data from CSV template

## Session History

| Date | Changes |
|------|---------|
| 2026-04-13 | KSP application development - added anggota keluar with loan check, savings auto-withdraw, admin fee to pendapatan |
| 2026-04-23 | Fixed linting error in kartu-simpanan page, improved search functionality |
| 2026-04-24 | Added seedSampleData function and Restore Sample Data button on dashboard |