/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, ArrowRight, Wallet, CheckCircle, Clock, AlertTriangle, Eye, Trash2, Plus, Calendar, Settings, X, Edit2, Printer, Download, Upload, FileText, Save } from 'lucide-react';
import { Santri, Kelas, Transaksi, Pengguna, KategoriPembayar, JenisPembayaran } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PembayaranViewProps {
  santri: Santri[];
  kelas: Kelas[];
  transaksi: Transaksi[];
  kategori: KategoriPembayar[];
  paymentTypes: JenisPembayaran[];
  onUpdatePaymentTypes: (pt: JenisPembayaran[]) => void;
  onUpdateKategori: (cats: KategoriPembayar[]) => void;
  onAddTransaction: (t: Omit<Transaksi, 'id' | 'invoiceNo' | 'tanggal'>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenMidtransSimulator: (t: Transaksi) => void;
  currentUser?: Pengguna | null;
  onImportTransaksiBulk: (t: Omit<Transaksi, 'id' | 'invoiceNo' | 'tanggal'>[]) => void;
}

export default function PembayaranView({
  santri,
  kelas,
  transaksi,
  kategori,
  paymentTypes,
  onUpdatePaymentTypes,
  onUpdateKategori,
  onAddTransaction,
  onDeleteTransaction,
  onOpenMidtransSimulator,
  currentUser,
  onImportTransaksiBulk,
}: PembayaranViewProps) {
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [jenisPembayaran, setJenisPembayaran] = useState('Syahriyah');
  const [nominal, setNominal] = useState(30000);
  const [metode, setMetode] = useState<'Cash' | 'Transfer Bank Manual' | 'Midtrans (VA BCA)'>('Midtrans (VA BCA)');
  const [catatan, setCatatan] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('CAT001');

  // Jenis Pembayaran CRUD States
  const [showJenisPembayaranModal, setShowJenisPembayaranModal] = useState(false);

  const [isEditingType, setIsEditingType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeNominal, setTypeNominal] = useState(50000);
  const [typeDesc, setTypeDesc] = useState('');

  // Custom Notifications and Confirmation Dialog States (Replacing native alert/confirm to work inside sandboxed iframe)
  const [confirmDeleteTypeId, setConfirmDeleteTypeId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  const [deleteTxConfirm, setDeleteTxConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Kategori CRUD States
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catSpp, setCatSpp] = useState(500000);
  const [catDaftarUlang, setCatDaftarUlang] = useState(750000);
  const [catDesc, setCatDesc] = useState('');

  const [selectedReceipt, setSelectedReceipt] = useState<Transaksi | null>(null);

  // Role check
  const canManage = currentUser?.role === 'Super Admin' || currentUser?.role === 'Bendahara';

  // History search/filter states
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Export Data Pembayaran
  const handleExportCSV = () => {
    const headers = ['santriId', 'invoiceNo', 'jenisPembayaran', 'nominal', 'metode', 'status', 'tanggal', 'catatan', 'kategoriPembayar'];
    const rows = filteredTransactions.map(t => [
      `"${t.santriId}"`,
      `"${t.invoiceNo}"`,
      `"${t.jenisPembayaran.replace(/"/g, '""')}"`,
      t.nominal,
      `"${t.metode}"`,
      `"${t.status}"`,
      `"${t.tanggal}"`,
      `"${(t.catatan || '').replace(/"/g, '""')}"`,
      `"${t.kategoriPembayar || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Export_Pembayaran_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Export_Pembayaran_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = ['santriId', 'jenisPembayaran', 'nominal', 'metode', 'status', 'catatan', 'kategoriPembayar'];
    const sampleRow = [santri[0]?.id || 'S001', 'SPP Bulan Mei 2025', '500000', 'Cash', 'Lunas', 'Uang SPP', 'Reguler'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Pembayaran.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map(item => ({
              santriId: String(item.santriId || santri[0]?.id || ''),
              jenisPembayaran: String(item.jenisPembayaran || 'SPP Bulan Mei 2025'),
              nominal: Number(item.nominal || 500000),
              metode: (item.metode || 'Cash') as any,
              status: (item.status || 'Pending') as any,
              catatan: String(item.catatan || ''),
              kategoriPembayar: String(item.kategoriPembayar || 'Reguler')
            }));
            onImportTransaksiBulk(sanitized);
            setSuccessMessage(`Berhasil mengimpor ${sanitized.length} data Pembayaran dari JSON.`);
          } else {
            setErrorMessage('Format berkas JSON harus berupa Array objek!');
          }
        } else {
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const list: any[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((header, idx) => {
              obj[header] = values[idx] || '';
            });
            list.push({
              santriId: obj.santriId || santri[0]?.id || '',
              jenisPembayaran: obj.jenisPembayaran || 'SPP Bulan Mei 2025',
              nominal: Number(obj.nominal || 500000),
              metode: (obj.metode || 'Cash') as any,
              status: (obj.status || 'Pending') as any,
              catatan: obj.catatan || '',
              kategoriPembayar: obj.kategoriPembayar || 'Reguler'
            });
          }
          onImportTransaksiBulk(list);
          setSuccessMessage(`Berhasil mengimpor ${list.length} data Pembayaran dari CSV.`);
        }
      } catch (err) {
        setErrorMessage('Gagal mengimpor berkas. Pastikan format berkas benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Change nominal automatically based on selection and category
  const handleJenisChange = (val: string, catId: string = selectedCategoryId) => {
    setJenisPembayaran(val);
    const cat = kategori.find(c => c.id === catId);
    
    // Find matching custom/dynamic payment type
    const matchedType = paymentTypes.find(pt => pt.nama === val);
    
    if (val.includes('SPP') && cat) {
      setNominal(cat.nominalSpp);
    } else if (val.includes('Daftar Ulang') && cat) {
      setNominal(cat.nominalDaftarUlang);
    } else if (matchedType) {
      setNominal(matchedType.nominalDefault);
    } else {
      // Fallbacks
      if (val.includes('Syahriyah')) {
        setNominal(30000);
      } else if (val.includes('Madin')) {
        setNominal(30000);
      } else if (val.includes('Kos makan')) {
        setNominal(240000);
      } else if (val.includes('Infaq')) {
        setNominal(200000);
      } else if (val.includes('Pembayaran lainnya')) {
        setNominal(50000);
      } else if (val.includes('Uang Gedung')) {
        setNominal(1000000);
      } else {
        setNominal(50000);
      }
    }
  };

  // Jenis Pembayaran CRUD Handlers
  const handleResetTypeForm = () => {
    setIsEditingType(false);
    setEditingTypeId('');
    setTypeName('');
    setTypeNominal(50000);
    setTypeDesc('');
  };

  const handleEditTypeClick = (type: { id: string; nama: string; nominalDefault: number; keterangan?: string }) => {
    setIsEditingType(true);
    setEditingTypeId(type.id);
    setTypeName(type.nama);
    setTypeNominal(type.nominalDefault);
    setTypeDesc(type.keterangan || '');
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      setErrorMessage('Nama jenis pembayaran wajib diisi!');
      return;
    }

    if (isEditingType && editingTypeId) {
      const updated = paymentTypes.map(pt => pt.id === editingTypeId ? {
        ...pt,
        nama: typeName,
        nominalDefault: Number(typeNominal),
        keterangan: typeDesc
      } : pt);
      onUpdatePaymentTypes(updated);
      setSuccessMessage('Berhasil mengubah jenis pembayaran.');
    } else {
      const newId = 'PT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const newType = {
        id: newId,
        nama: typeName,
        nominalDefault: Number(typeNominal),
        keterangan: typeDesc
      };
      onUpdatePaymentTypes([...paymentTypes, newType]);
      setSuccessMessage('Berhasil menambah jenis pembayaran baru.');
    }
    handleResetTypeForm();
  };

  const handleDeleteType = (id: string) => {
    const type = paymentTypes.find(pt => pt.id === id);
    if (!type) return;
    setConfirmDeleteTypeId(id);
  };

  const executeDeleteType = () => {
    if (!confirmDeleteTypeId) return;
    const type = paymentTypes.find(pt => pt.id === confirmDeleteTypeId);
    if (type) {
      const filtered = paymentTypes.filter(pt => pt.id !== confirmDeleteTypeId);
      onUpdatePaymentTypes(filtered);
      setSuccessMessage(`Berhasil menghapus jenis pembayaran "${type.nama}".`);
    }
    setConfirmDeleteTypeId(null);
  };

  const handleSantriChange = (id: string) => {
    setSelectedSantriId(id);
    if (!id) return;
    
    const s = santri.find(st => st.id === id);
    if (s) {
      const catId = s.kategoriPembayarId || 'CAT001';
      setSelectedCategoryId(catId);
      handleJenisChange(jenisPembayaran, catId);
    }
  };

  // Kategori CRUD Handlers
  const handleResetCatForm = () => {
    setIsEditingCat(false);
    setEditingCatId('');
    setCatName('');
    setCatSpp(500000);
    setCatDaftarUlang(750000);
    setCatDesc('');
  };

  const handleEditCatClick = (cat: KategoriPembayar) => {
    setIsEditingCat(true);
    setEditingCatId(cat.id);
    setCatName(cat.nama);
    setCatSpp(cat.nominalSpp);
    setCatDaftarUlang(cat.nominalDaftarUlang);
    setCatDesc(cat.keterangan || '');
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setErrorMessage('Nama kategori wajib diisi!');
      return;
    }

    if (isEditingCat && editingCatId) {
      const updated = kategori.map(c => c.id === editingCatId ? {
        ...c,
        nama: catName,
        nominalSpp: Number(catSpp),
        nominalDaftarUlang: Number(catDaftarUlang),
        keterangan: catDesc
      } : c);
      onUpdateKategori(updated);
    } else {
      const newId = 'CAT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const newCat: KategoriPembayar = {
        id: newId,
        nama: catName,
        nominalSpp: Number(catSpp),
        nominalDaftarUlang: Number(catDaftarUlang),
        keterangan: catDesc
      };
      onUpdateKategori([...kategori, newCat]);
    }
    handleResetCatForm();
  };

  const handleDeleteCat = (id: string) => {
    const isRestricted = ['CAT001', 'CAT002', 'CAT003'].includes(id);
    const cat = kategori.find(c => c.id === id);
    if (isRestricted) {
      setErrorMessage(`Kategori default "${cat?.nama}" tidak boleh dihapus untuk kestabilan sistem!`);
      return;
    }
    setDeleteCatConfirm({ isOpen: true, id, name: cat?.nama || '' });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      setErrorMessage('Harap pilih santri terlebih dahulu!');
      return;
    }
    if (nominal <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih dari 0!');
      return;
    }

    const catNameStr = kategori.find(c => c.id === selectedCategoryId)?.nama || 'Reguler';

    onAddTransaction({
      santriId: selectedSantriId,
      jenisPembayaran,
      nominal: Number(nominal),
      metode: metode as any,
      status: metode.startsWith('Midtrans') ? 'Pending' : 'Lunas',
      catatan,
      kategoriPembayar: catNameStr,
    });

    // Reset some inputs
    setCatatan('');
  };

  const getSantriName = (id: string) => {
    return santri.find((s) => s.id === id)?.nama || 'Santri Terhapus';
  };

  const getSantriClass = (id: string) => {
    const s = santri.find((st) => st.id === id);
    if (!s) return '-';
    return kelas.find((k) => k.id === s.kelasId)?.nama || '-';
  };

  // Filter transaction history
  const filteredTransactions = transaksi.filter((t) => {
    if (currentUser?.role === 'Santri') {
      const activeSantriId = currentUser.santriId || santri.find(s => s.nisn === currentUser.email || s.id === currentUser.santriId)?.id;
      if (t.santriId !== activeSantriId) {
        return false;
      }
    }
    const sName = getSantriName(t.santriId).toLowerCase();
    const matchesSearch = sName.includes(historySearch.toLowerCase()) || t.invoiceNo.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || t.metode === methodFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.kategoriPembayar === categoryFilter;
    return matchesSearch && matchesStatus && matchesMethod && matchesCategory;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Input payment form */}
        {canManage && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden lg:col-span-1 h-fit">
            <div className="p-5 bg-[#002D21] text-white flex items-center space-x-2.5">
              <CreditCard className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-wide">Input Transaksi Baru</h3>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 text-xs">
              
              {/* Select Santri */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Pilih Santri</label>
                <select
                  required
                  value={selectedSantriId}
                  onChange={(e) => handleSantriChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santri.filter(s => s.status === 'Aktif').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({getSantriClass(s.id)}) - NISN: {s.nisn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Santri Quick Info Badge */}
              {selectedSantriId && (
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-[11px] text-emerald-800 space-y-1">
                  <p><strong>Nama:</strong> {getSantriName(selectedSantriId)}</p>
                  <p><strong>Kelas:</strong> {getSantriClass(selectedSantriId)}</p>
                  <p><strong>Wali:</strong> {santri.find(s => s.id === selectedSantriId)?.namaWali}</p>
                  <p><strong>Kategori:</strong> <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{kategori.find(c => c.id === selectedCategoryId)?.nama || 'Reguler'}</span></p>
                </div>
              )}

              {/* Payment Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Jenis Pembayaran</label>
                <select
                  value={jenisPembayaran}
                  onChange={(e) => handleJenisChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                >
                  {paymentTypes.map((pt) => (
                    <option key={pt.id} value={pt.nama}>
                      {pt.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={nominal}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                />
              </div>

              {/* Payment Gateway Option (Midtrans Snap!) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Metode Pembayaran</label>
                <div className="grid grid-cols-1 gap-2">
                  
                  <label className="flex items-center space-x-3 p-3 rounded-xl border border-emerald-600 bg-emerald-50/20 cursor-default transition-all">
                    <input
                      type="radio"
                      name="metode_pembayaran"
                      value="Midtrans (VA BCA)"
                      checked={true}
                      readOnly
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-slate-800 text-xs">Midtrans Snap Gateway</p>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">Wajib</span>
                      </div>
                      <p className="text-[10px] text-slate-400">QRIS, GoPay, ShopeePay, VA BCA, Mandiri, BNI, KlikBCA</p>
                    </div>
                  </label>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-slate-500 font-medium leading-relaxed">
                    ⚠️ <strong>Kebijakan Sistem:</strong> Mulai tahun ajaran ini, seluruh administrasi pembayaran wajib melalui gerbang pembayaran Midtrans untuk rekonsiliasi otomatis real-time.
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Lunas bulan Mei"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{metode.startsWith('Midtrans') ? 'Proses Midtrans Snap' : 'Simpan Pembayaran'}</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        )}

        {/* Right column: List of previous transactions */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between ${
          canManage ? 'lg:col-span-2' : 'lg:col-span-3'
        }`}>
          <div>
            {/* Header with Search and Status Filter */}
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Riwayat Pembayaran & Transaksi</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Semua riwayat transaksi santri</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {canManage && (
                    <>
                      <div className="relative group">
                        <button
                          className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Download className="h-3 w-3 text-emerald-600" />
                          <span>Ekspor</span>
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 shadow-xl rounded-lg py-1 hidden group-hover:block z-20 w-24 text-[10px]">
                          <button onClick={handleExportCSV} className="w-full text-left px-2 py-1 hover:bg-slate-50 font-semibold text-slate-600">CSV</button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowKategoriModal(true)}
                        className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer"
                      >
                        <Settings className="h-3 w-3" />
                        <span>Kategori</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowJenisPembayaranModal(true)}
                        className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                        <span>Jenis Pembayaran</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 px-8 text-[11px] font-medium outline-none transition-all"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-[11px] font-semibold outline-none transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Pending">Pending</option>
                    <option value="Gagal">Gagal</option>
                  </select>
                </div>

                {/* Method Filter */}
                <div>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-[11px] font-semibold outline-none transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Metode</option>
                    <option value="Cash">Cash / Tunai</option>
                    <option value="Transfer Bank Manual">Transfer Bank Manual</option>
                    <option value="Midtrans (VA BCA)">Midtrans (VA BCA)</option>
                    <option value="Midtrans (QRIS)">Midtrans (QRIS)</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-[11px] font-semibold outline-none transition-all cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {kategori.map((c) => (
                      <option key={c.id} value={c.nama}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[#002D21] text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4 text-center">NO</th>
                    <th className="py-2.5 px-4">INVOICE / SANTRI</th>
                    <th className="py-2.5 px-4">JENIS / METODE</th>
                    <th className="py-2.5 px-4 text-right">NOMINAL</th>
                    <th className="py-2.5 px-4 text-center">STATUS</th>
                    <th className="py-2.5 px-4 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Wallet className="h-8 w-8 mx-auto opacity-30 mb-2" />
                        Tidak ada riwayat transaksi ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400 text-center">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-[10px] font-bold text-emerald-700">{t.invoiceNo}</p>
                          <p className="font-bold text-slate-700 mt-0.5">{getSantriName(t.santriId)}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold">{getSantriClass(t.santriId)}</span>
                            <span className="inline-block text-[8px] font-bold uppercase px-1 bg-slate-100 text-slate-600 rounded">
                              {t.kategoriPembayar || 'Reguler'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-700">{t.jenisPembayaran}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.metode} - {t.tanggal}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700 text-right">
                          {formatIDR(t.nominal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                              t.status === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : t.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center items-center space-x-1">
                            <button
                              onClick={() => setSelectedReceipt(t)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-50 cursor-pointer"
                              title="Lihat Kuitansi"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {t.status === 'Pending' && (
                              <button
                                onClick={() => onOpenMidtransSimulator(t)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
                                title="Bayar via Midtrans Simulator"
                              >
                                Bayar
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => {
                                  setDeleteTxConfirm({
                                    isOpen: true,
                                    id: t.id,
                                    name: `${getSantriName(t.santriId)} - ${t.jenisPembayaran}`
                                  });
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-50 cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 1. KATEGORI PEMBAYAR CRUD MODAL */}
      {showKategoriModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#002D21] text-white">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-sm tracking-wide">
                  Kelola Kategori Pembayar & Tarif Pembayaran
                </span>
              </div>
              <button onClick={() => { setShowKategoriModal(false); handleResetCatForm(); }} className="text-white hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Split view (List on left, Add/Edit form on right) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 overflow-y-auto text-xs">
              
              {/* Category List (Left Column) */}
              <div className="md:col-span-3 space-y-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">Daftar Kategori</h4>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {kategori.map((cat) => {
                    const isDefault = ['CAT001', 'CAT002', 'CAT003'].includes(cat.id);
                    return (
                      <div key={cat.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3 shadow-xs">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">{cat.nama}</span>
                            {isDefault && (
                              <span className="bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                Default Sistem
                              </span>
                            )}
                          </div>
                          {cat.keterangan && <p className="text-slate-400 mt-1 font-medium leading-relaxed">{cat.keterangan}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-400 font-sans font-semibold uppercase block text-[8px]">Tarif SPP Bulanan</span>
                            <span className="font-bold text-emerald-700">{formatIDR(cat.nominalSpp)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans font-semibold uppercase block text-[8px]">Tarif Daftar Ulang</span>
                            <span className="font-bold text-[#002D21]">{formatIDR(cat.nominalDaftarUlang)}</span>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100/50">
                          <button
                            type="button"
                            onClick={() => handleEditCatClick(cat)}
                            className="flex items-center space-x-1 text-slate-500 hover:text-emerald-700 font-bold px-2.5 py-1 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Ubah</span>
                          </button>
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCat(cat.id)}
                              className="flex items-center space-x-1 text-slate-400 hover:text-rose-600 font-bold px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form panel (Right Column) */}
              <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 h-fit space-y-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
                  {isEditingCat ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
                </h4>
                
                <form onSubmit={handleSaveCat} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Nama Kategori</label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Contoh: Beasiswa Prestasi"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Nominal SPP Bulanan (IDR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={catSpp}
                      onChange={(e) => setCatSpp(Number(e.target.value))}
                      placeholder="Tarif SPP bulanan..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Nominal Daftar Ulang (IDR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={catDaftarUlang}
                      onChange={(e) => setCatDaftarUlang(Number(e.target.value))}
                      placeholder="Tarif Daftar Ulang tahunan..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Keterangan / Deskripsi</label>
                    <textarea
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Informasi singkat kriteria penerima kategori ini..."
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    {isEditingCat && (
                      <button
                        type="button"
                        onClick={handleResetCatForm}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg cursor-pointer shadow-xs transition-colors"
                    >
                      {isEditingCat ? 'Simpan Perubahan' : 'Tambah Kategori'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => { setShowKategoriModal(false); handleResetCatForm(); }}
                className="bg-[#002D21] hover:bg-[#003d2d] text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1.5. JENIS PEMBAYARAN CRUD MODAL */}
      {showJenisPembayaranModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#002D21] text-white">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-sm tracking-wide">
                  Kelola Jenis Pembayaran Pesantren
                </span>
              </div>
              <button onClick={() => { setShowJenisPembayaranModal(false); handleResetTypeForm(); }} className="text-white hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Split view (List on left, Add/Edit form on right) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 overflow-y-auto text-xs">
              
              {/* Types List (Left Column) */}
              <div className="md:col-span-3 space-y-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">Daftar Jenis Pembayaran</h4>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {paymentTypes.map((type) => {
                    const isSystemType = ['PT001', 'PT002', 'PT003', 'PT004'].includes(type.id);
                    return (
                      <div key={type.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3 shadow-xs">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">{type.nama}</span>
                            {isSystemType && (
                              <span className="bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                Default Sistem
                              </span>
                            )}
                          </div>
                          {type.keterangan && <p className="text-slate-400 mt-1 font-medium leading-relaxed">{type.keterangan}</p>}
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-400 font-sans font-semibold uppercase block text-[8px]">Nominal Default</span>
                            <span className="font-bold text-emerald-700">{formatIDR(type.nominalDefault)}</span>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100/50">
                          <button
                            type="button"
                            onClick={() => handleEditTypeClick(type)}
                            className="flex items-center space-x-1 text-slate-500 hover:text-emerald-700 font-bold px-2.5 py-1 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteType(type.id)}
                            className="flex items-center space-x-1 text-slate-400 hover:text-rose-600 font-bold px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form panel (Right Column) */}
              <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 h-fit space-y-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
                  {isEditingType ? 'Ubah Jenis Pembayaran' : 'Tambah Jenis Pembayaran Baru'}
                </h4>
                
                <form onSubmit={handleSaveType} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Nama Jenis Pembayaran</label>
                    <input
                      type="text"
                      required
                      value={typeName}
                      onChange={(e) => setTypeName(e.target.value)}
                      placeholder="Contoh: Buku Pelajaran, Biaya Ujian"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Nominal Default (IDR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={typeNominal}
                      onChange={(e) => setTypeNominal(Number(e.target.value))}
                      placeholder="Nominal default..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase">Keterangan / Deskripsi</label>
                    <textarea
                      value={typeDesc}
                      onChange={(e) => setTypeDesc(e.target.value)}
                      placeholder="Informasi singkat kegunaan biaya ini..."
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    {isEditingType && (
                      <button
                        type="button"
                        onClick={handleResetTypeForm}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Save className="h-4 w-4 text-amber-300" />
                      <span>{isEditingType ? 'Simpan' : 'Tambah Jenis'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => { setShowJenisPembayaranModal(false); handleResetTypeForm(); }}
                className="bg-[#002D21] hover:bg-[#003d2d] text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OFFICIAL RECEIPT / KUITANSI DETAIL MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            {/* Printable Frame Area */}
            <div id="receipt-printable-area" className="p-8 space-y-6">
              
              {/* Receipt Header */}
              <div className="border-b-2 border-dashed border-slate-200 pb-5 text-center relative">
                <div className="text-emerald-700 font-black text-lg tracking-tight uppercase">
                  PONDOK PESANTREN MAMBA'UL HIDAYAH
                </div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                  SISTEM ADMINISTRASI KEUANGAN & PEMBAYARAN
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Alamat: Cipari, Cilacap, Jawa Tengah • Telp: 0812-3456-7890
                </div>
                
                {/* Official Stamp Watermark badge */}
                <div className="absolute right-0 top-0 opacity-15 pointer-events-none select-none">
                  <CreditCard className="h-12 w-12 text-emerald-700" />
                </div>
              </div>

              {/* Invoice Title */}
              <div className="text-center">
                <h3 className="font-mono font-black text-slate-700 text-sm tracking-widest uppercase">KUITANSI PEMBAYARAN</h3>
                <p className="font-mono text-[10px] font-bold text-emerald-600 mt-1">NO: {selectedReceipt.invoiceNo}</p>
              </div>

              {/* Payer Details */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-[11px] grid grid-cols-2 gap-y-2.5 gap-x-4">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Nama Santri</span>
                  <span className="font-bold text-slate-700">{getSantriName(selectedReceipt.santriId)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Kelas</span>
                  <span className="font-bold text-slate-700">Kelas {getSantriClass(selectedReceipt.santriId)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Tanggal Pembayaran</span>
                  <span className="font-bold text-slate-700">{selectedReceipt.tanggal}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Kategori Pembayar</span>
                  <span className="font-bold text-emerald-700 uppercase tracking-wide text-[9px]">
                    🏷️ {selectedReceipt.kategoriPembayar || 'Reguler'}
                  </span>
                </div>
              </div>

              {/* Receipt Item List */}
              <div className="border border-slate-100 rounded-xl overflow-hidden text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[#002D21]">
                      <th className="py-2.5 px-4">RINCIAN DESKRIPSI</th>
                      <th className="py-2.5 px-4 text-right">NOMINAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {selectedReceipt.jenisPembayaran}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 text-right">
                        {formatIDR(selectedReceipt.nominal)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="py-2.5 px-4 text-slate-500 text-right uppercase text-[9px]">Total Bayar</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-700 text-right text-sm">
                        {formatIDR(selectedReceipt.nominal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Method / Status block */}
              <div className="flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Metode Pembayaran</span>
                  <span className="font-bold text-slate-700">{selectedReceipt.metode}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Status Pembayaran</span>
                  <span className={`inline-block px-3 py-1 mt-0.5 rounded-full font-bold text-[9px] uppercase border ${
                    selectedReceipt.status === 'Lunas'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    ● {selectedReceipt.status}
                  </span>
                </div>
              </div>

              {/* Footnotes & Signature area */}
              <div className="border-t border-slate-100 pt-5 text-[10px] text-slate-400 font-medium leading-relaxed flex justify-between items-end">
                <div className="max-w-[180px]">
                  <p className="font-bold text-slate-500 uppercase text-[8px] mb-1">Catatan Keuangan</p>
                  <p className="italic">{selectedReceipt.catatan || 'Kuitansi sah dikeluarkan secara elektronik oleh bendahara Pondok Pesantren.'}</p>
                </div>
                <div className="text-center space-y-12">
                  <p className="font-bold text-slate-500 uppercase text-[8px]">Bendahara Ponpes</p>
                  <div className="font-bold text-slate-700 underline tracking-wide uppercase font-mono text-[9px]">
                    {currentUser?.nama || 'Bendahara Ponpes'}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="bg-[#002D21] hover:bg-[#004231] text-white font-bold px-5 py-2 rounded-lg cursor-pointer shadow-xs flex items-center space-x-1.5 transition-all"
              >
                <Printer className="h-4 w-4 text-amber-400" />
                <span>Cetak Kuitansi</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Success Notification Toast */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 z-[100] border border-emerald-500/30">
          <CheckCircle className="h-5 w-5 text-amber-300" />
          <span className="font-bold text-xs">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-white hover:text-slate-200 transition-colors ml-2 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Notification Toast */}
      {errorMessage && (
        <div className="fixed bottom-5 right-5 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 z-[100] border border-rose-500/30">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          <span className="font-bold text-xs">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-white hover:text-slate-200 transition-colors ml-2 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteCatConfirm?.isOpen}
        onClose={() => setDeleteCatConfirm(null)}
        onConfirm={() => {
          if (deleteCatConfirm) {
            const filtered = kategori.filter(c => c.id !== deleteCatConfirm.id);
            onUpdateKategori(filtered);
            setSuccessMessage(`Berhasil menghapus kategori "${deleteCatConfirm.name}".`);
          }
        }}
        title="Hapus Kategori Pembayar"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteCatConfirm?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={!!deleteTxConfirm?.isOpen}
        onClose={() => setDeleteTxConfirm(null)}
        onConfirm={() => {
          if (deleteTxConfirm) {
            onDeleteTransaction(deleteTxConfirm.id);
            setSuccessMessage(`Berhasil menghapus data transaksi.`);
          }
        }}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteTxConfirm?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={!!confirmDeleteTypeId}
        onClose={() => setConfirmDeleteTypeId(null)}
        onConfirm={executeDeleteType}
        title="Hapus Jenis Pembayaran"
        message={`Apakah Anda yakin ingin menghapus jenis pembayaran "${paymentTypes.find(pt => pt.id === confirmDeleteTypeId)?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
