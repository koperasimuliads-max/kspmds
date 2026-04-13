export interface Anggota {
  id: string;
  nama: string;
  nik: string;
  nomorNBA: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  alamat: string;
  alamatDomisili: string;
  statusPerkawinan: 'belum_kawin' | 'kawin' | 'cerai' | 'janda' | 'duda';
  namaPasangan: string;
  jumlahAnak: string;
  namaIbuKandung: string;
  namaSaudara: string;
  noHpSaudara: string;
  pekerjaan: string;
  pendapatanPerbulan: string;
  statusRumah: 'rumah_sendiri' | 'kontrak_sewa' | 'dinas' | 'rumah_orang_tua' | 'menumpang';
  namaReferensi: string;
  simpananPokok: number;
  simpananWajib: number;
  uangBuku: number;
  jenisPembayaran: 'tunai' | 'bri_tigabinanga' | 'bri_berastagi';
  telefon: string;
  tanggalJoin: string;
  tanggalKeluar?: string;
  status: 'aktif' | 'nonaktif';
}

export interface Pinjaman {
  id: string;
  anggotaId: string;
  jumlah: number;
  bunga: number;
  tenor: number;
  tanggalPinjaman: string;
  status: 'aktif' | 'lunas' | 'macet';
  cicilanPerBulan: number;
  totalPembayaran: number;
  sudahDibayar: number;
  kolektibilitas: 'lancar' | 'kurang_lancar' | 'diragukan' | 'macet';
  hariTerlambat: number;
  kategoriKesehatan: 'sehat' | 'cukup_sehat' | 'kurang_sehat' | 'tidak_sehat';
}

export interface Simpanan {
  id: string;
  anggotaId: string;
  jumlah: number;
  jenis: 'wajib' | 'pokok' | 'sibuhar' | 'simapan' | 'sihat' | 'sihar';
  tanggalSimpan: string;
  status: 'aktif' | 'ditarik' | 'aktif_auto';
  tenor?: number;
  premi?: number;
  bunga?: number;
}

export interface Transaksi {
  id: string;
  jenis: 'pinjaman' | 'simpanan' | 'pembayaran' | 'penarikan' | 'pendapatan';
  anggotaId: string;
  referensiId: string;
  jumlah: number;
  tanggal: string;
  deskripsi: string;
}

export interface Pengeluaran {
  id: string;
  jenis: string;
  deskripsi: string;
  jumlah: number;
  tanggal: string;
}

export interface Pendapatan {
  id: string;
  jenis: string;
  deskripsi: string;
  jumlah: number;
  tanggal: string;
}

export interface LaporanKeuangan {
  totalSimpanan: number;
  totalPinjaman: number;
  totalPinjamanAktif: number;
  totalPinjamanLunas: number;
  totalPembayaranPinjaman: number;
  jumlahAnggotaAktif: number;
  jumlahPinjamanAktif: number;
  jumlahSimpananAktif: number;
}