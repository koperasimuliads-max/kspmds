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
  jumlahAnak: number;
  namaIbuKandung: string;
  namaSaudara: string;
  noHpSaudara: string;
  pekerjaan: string;
  pendapatanPerbulan: number;
  statusRumah: 'milik_sendiri' | 'sewa' | 'kontrak' | 'menumpang' | 'lainnya';
  namaReferensi: string;
  simpananPokok: number;
  simpananWajib: number;
  uangBuku: number;
  jenisPembayaran: 'tunai' | 'transfer' | 'potongan_gaji';
  telefon: string;
  tanggalJoin: string;
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
}

export interface Simpanan {
  id: string;
  anggotaId: string;
  jumlah: number;
  jenis: 'sukarela' | 'wajib' | 'berjangka';
  tanggalSimpan: string;
  status: 'aktif' | 'ditarik';
}

export interface Transaksi {
  id: string;
  jenis: 'pinjaman' | 'simpanan' | 'pembayaran' | 'penarikan';
  anggotaId: string;
  referensiId: string;
  jumlah: number;
  tanggal: string;
  deskripsi: string;
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