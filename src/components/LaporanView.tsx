/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileSpreadsheet, Search, Download, Printer, Filter, Calendar, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Transaksi, Santri, Kelas, PengaturanSistem } from '../types';

interface LaporanViewProps {
  transaksi: Transaksi[];
  santri: Santri[];
  kelas: Kelas[];
  settings?: PengaturanSistem;
}

export default function LaporanView({ transaksi, santri, kelas, settings }: LaporanViewProps) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const getSantriName = (id: string) => {
    return santri.find((s) => s.id === id)?.nama || 'Santri Terhapus';
  };

  const getSantriClass = (id: string) => {
    const s = santri.find((st) => st.id === id);
    if (!s) return '-';
    return kelas.find((k) => k.id === s.kelasId)?.nama || '-';
  };

  // Filter transactions
  const lunasTransactions = transaksi.filter((t) => t.status === 'Lunas');

  const filteredTransactions = lunasTransactions.filter((t) => {
    const matchesType = filterType === 'ALL' || t.jenisPembayaran.includes(filterType);
    
    // Parse Indonesian format "13 Juli 2026" or "25 Mei 2025" -> split by spaces
    const parts = t.tanggal.split(' ');
    const txMonth = parts[1] || ''; // e.g. "Juli"
    const txYear = parts[2] || '';  // e.g. "2026"

    const matchesMonth = filterMonth === 'ALL' || txMonth.toLowerCase() === filterMonth.toLowerCase();
    const matchesYear = filterYear === 'ALL' || txYear === filterYear;
    
    return matchesType && matchesMonth && matchesYear;
  });

  // Calculate stats
  const totalPemasukan = filteredTransactions.reduce((sum, t) => sum + t.nominal, 0);
  const totalTransaksiCount = filteredTransactions.length;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleExportCSV = () => {
    const headers = ['No', 'InvoiceNo', 'Nama Santri', 'Kelas', 'Kategori Pembayar', 'Jenis Pembayaran', 'Tanggal', 'Nominal', 'Metode'];
    const rows = filteredTransactions.map((t, idx) => [
      idx + 1,
      t.invoiceNo,
      `"${getSantriName(t.santriId).replace(/"/g, '""')}"`,
      `"${getSantriClass(t.santriId)}"`,
      `"${t.kategoriPembayar || 'Reguler'}"`,
      `"${t.jenisPembayaran.replace(/"/g, '""')}"`,
      `"${t.tanggal}"`,
      t.nominal,
      `"${t.metode}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pembayaran_Ponpes_Bulan_${filterMonth}_Tahun_${filterYear}_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Laporan_Pembayaran_Ponpes_Bulan_${filterMonth}_Tahun_${filterYear}_${filterType}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0">
      
      {/* Printable block header wrapper */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs text-slate-400 font-medium font-sans">Statistik & Dokumen</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Laporan Keuangan Pondok Pesantren</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / Print</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Export Alert Notification */}
      {showExportSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center space-x-2 animate-bounce print:hidden">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>Laporan berhasil diekspor ke komputer Anda sebagai file Excel/CSV!</span>
        </div>
      )}

      {/* Top statistics summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">TOTAL PEMASUKAN TERFILTER</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{formatIDR(totalPemasukan)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">JUMLAH TRANSAKSI SUKSES</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalTransaksiCount} Transaksi</h3>
          </div>
        </div>
      </div>

      {/* Filters block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        
        {/* Category type filter */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-500 uppercase text-[10px]">Filter Jenis Pembayaran</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="ALL">Semua Jenis Pembayaran</option>
            <option value="SPP">Hanya SPP Bulanan</option>
            <option value="Daftar Ulang">Hanya Daftar Ulang</option>
            <option value="Uang Gedung">Hanya Uang Gedung</option>
          </select>
        </div>

        {/* Date Month Filter */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-500 uppercase text-[10px]">Filter Bulan</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="ALL">Semua Bulan</option>
            <option value="Januari">Januari</option>
            <option value="Februari">Februari</option>
            <option value="Maret">Maret</option>
            <option value="April">April</option>
            <option value="Mei">Mei</option>
            <option value="Juni">Juni</option>
            <option value="Juli">Juli</option>
            <option value="Agustus">Agustus</option>
            <option value="September">September</option>
            <option value="Oktober">Oktober</option>
            <option value="November">November</option>
            <option value="Desember">Desember</option>
          </select>
        </div>

        {/* Date Year Filter */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-500 uppercase text-[10px]">Filter Tahun</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="ALL">Semua Tahun</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div id="laporan-printable-area" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden print:border-none print:shadow-none">
        
        {/* Print Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:bg-white">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-full bg-emerald-900 border border-amber-400 flex items-center justify-center font-bold text-amber-400 text-sm select-none overflow-hidden">
              {settings?.logoType === 'image' && settings?.logoUrl ? (
                <img src={settings.logoUrl} className="h-full w-full object-cover rounded-full" alt="Logo" />
              ) : (
                <span>{settings?.logoText || 'MH'}</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase">{settings?.namaPesantren || "PONDOK PESANTREN MAMBA'UL HIDAYAH CIPARI"}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Laporan Rekapitulasi Pembayaran Keuangan Lunas</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
            <p>Status: Lunas / Verifikasi</p>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#002D21] text-white text-[11px] font-bold uppercase tracking-wider print:bg-[#002D21]">
                <th className="py-3 px-5 text-center">NO</th>
                <th className="py-3 px-5">INVOICE</th>
                <th className="py-3 px-5">NAMA SANTRI</th>
                <th className="py-3 px-5">KELAS</th>
                <th className="py-3 px-5">JENIS PEMBAYARAN</th>
                <th className="py-3 px-5">TANGGAL</th>
                <th className="py-3 px-5">METODE</th>
                <th className="py-3 px-5 text-right">NOMINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada transaksi lunas pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 px-5 font-bold text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-3 px-5 font-mono font-bold text-emerald-800">{t.invoiceNo}</td>
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-700">{getSantriName(t.santriId)}</div>
                      <span className="inline-block mt-0.5 text-[8px] font-black uppercase px-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100/30 rounded">
                        {t.kategoriPembayar || 'Reguler'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {getSantriClass(t.santriId)}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-600">{t.jenisPembayaran}</td>
                    <td className="py-3 px-5 text-slate-400 font-medium">{t.tanggal}</td>
                    <td className="py-3 px-5 font-semibold text-slate-500">{t.metode}</td>
                    <td className="py-3 px-5 font-bold text-slate-700 text-right">
                      {formatIDR(t.nominal)}
                    </td>
                  </tr>
                ))
              )}
              {/* Grand Total Row */}
              <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                <td colSpan={7} className="py-4 px-5 text-right uppercase tracking-wider">Grand Total Pemasukan:</td>
                <td className="py-4 px-5 text-right text-emerald-600 text-sm">{formatIDR(totalPemasukan)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom signature section for official print validation */}
        <div className="hidden print:grid grid-cols-2 gap-10 mt-16 p-6 text-center text-xs">
          <div>
            <p className="text-slate-400 font-semibold mb-12">Mengetahui, Wali Kelas / Kepala Ponpes</p>
            <p className="font-bold text-slate-800 border-b border-slate-300 pb-1 w-48 mx-auto"></p>
            <p className="text-slate-400 mt-1">NIP / NIPY.</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-12">Diverifikasi oleh, Bendahara Utama</p>
            <p className="font-bold text-slate-800 border-b border-slate-300 pb-1 w-48 mx-auto">Ustadzah Aminah</p>
            <p className="text-slate-400 mt-1">Sistem Administrasi Mamba'ul Hidayah</p>
          </div>
        </div>
      </div>
    </div>
  );
}
