/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Santri {
  id: string;
  nisn: string;
  nama: string;
  kelasId: string;
  gender: 'Laki-laki' | 'Perempuan';
  alamat: string;
  namaWali: string;
  noHpWali: string;
  status: 'Aktif' | 'Non-Aktif';
  kategoriPembayarId?: string; // Links to KategoriPembayar
}

export interface Kelas {
  id: string;
  nama: string;
  waliKelas: string;
  kapasitas: number;
}

export interface KategoriPembayar {
  id: string;
  nama: string;
  nominalSpp: number;
  nominalDaftarUlang: number;
  keterangan?: string;
}

export interface Transaksi {
  id: string;
  invoiceNo: string;
  santriId: string;
  jenisPembayaran: string;
  tanggal: string;
  nominal: number;
  metode: 'Cash' | 'Midtrans (VA BCA)' | 'Midtrans (VA Mandiri)' | 'Midtrans (GoPay)' | 'Midtrans (ShopeePay)' | 'Transfer Bank Manual';
  status: 'Lunas' | 'Pending' | 'Gagal';
  catatan?: string;
  kategoriPembayar?: string; // Store name of category at transaction time
}

export interface Tunggakan {
  id: string;
  santriId: string;
  jenisTunggakan: string;
  jatuhTempo: string;
  nominal: number;
}

export interface Pengguna {
  id: string;
  nama: string;
  email: string;
  role: 'Super Admin' | 'Bendahara' | 'Pengasuh Pesantren' | 'Santri';
  status: 'Aktif' | 'Non-aktif';
  password?: string;
  santriId?: string; // If role is 'Santri', link to Santri ID
}

export interface PengaturanSistem {
  namaPesantren: string;
  alamatPesantren: string;
  emailPesantren: string;
  teleponPesantren: string;
  nominalSpp: number;
  nominalDaftarUlang: number;
  midtransClientKey: string;
  midtransSandboxMode: boolean;
  logoType?: 'text' | 'image';
  logoText?: string;
  logoUrl?: string;
}

export interface JenisPembayaran {
  id: string;
  nama: string;
  nominalDefault: number;
  keterangan?: string;
}
