/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Settings, ShieldCheck, Check, Building, Key, Wallet, HelpCircle, Database, Download, Upload, RefreshCw } from 'lucide-react';
import { PengaturanSistem } from '../types';

interface PengaturanViewProps {
  settings: PengaturanSistem;
  onUpdateSettings: (s: PengaturanSistem) => void;
  onSaveFullDatabase?: () => Promise<boolean>;
  fullDatabaseState?: any;
  onRestoreFullDatabase?: (state: any) => Promise<boolean>;
}

export default function PengaturanView({ 
  settings, 
  onUpdateSettings,
  onSaveFullDatabase,
  fullDatabaseState,
  onRestoreFullDatabase
}: PengaturanViewProps) {
  const [namaPesantren, setNamaPesantren] = useState(settings.namaPesantren);
  const [alamatPesantren, setAlamatPesantren] = useState(settings.alamatPesantren);
  const [emailPesantren, setEmailPesantren] = useState(settings.emailPesantren);
  const [teleponPesantren, setTeleponPesantren] = useState(settings.teleponPesantren);
  
  const [nominalSpp, setNominalSpp] = useState(settings.nominalSpp);
  const [nominalDaftarUlang, setNominalDaftarUlang] = useState(settings.nominalDaftarUlang);

  const [midtransClientKey, setMidtransClientKey] = useState(settings.midtransClientKey);
  const [midtransSandboxMode, setMidtransSandboxMode] = useState(settings.midtransSandboxMode);
  
  // Custom logo state with self-healing fallback options
  const [logoType, setLogoType] = useState<'text' | 'image'>(settings.logoType || 'text');
  const [logoText, setLogoText] = useState(settings.logoText || 'MH');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbSavingSuccess, setDbSavingSuccess] = useState(false);
  const [dbRestoreSuccess, setDbRestoreSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSaveDb = async () => {
    if (!onSaveFullDatabase) return;
    setDbSaving(true);
    const success = await onSaveFullDatabase();
    setDbSaving(false);
    if (success) {
      setDbSavingSuccess(true);
      setTimeout(() => setDbSavingSuccess(false), 3000);
    }
  };

  const handleExportFullJSON = () => {
    if (!fullDatabaseState) {
      alert('Data database tidak ditemukan.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDatabaseState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'MambaulHidayah_Full_Database_Backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFullJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          if (onRestoreFullDatabase) {
            const success = await onRestoreFullDatabase(parsed);
            if (success) {
              setDbRestoreSuccess(true);
              setTimeout(() => setDbRestoreSuccess(false), 3000);
            }
          }
        } else {
          alert('Format berkas JSON tidak valid!');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON!');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      namaPesantren,
      alamatPesantren,
      emailPesantren,
      teleponPesantren,
      nominalSpp: Number(nominalSpp),
      nominalDaftarUlang: Number(nominalDaftarUlang),
      midtransClientKey,
      midtransSandboxMode,
      logoType,
      logoText,
      logoUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Settings Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Konfigurasi Aplikasi</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pengaturan Parameter Sistem</h2>
        </div>
      </div>

      {/* Save indicator banner */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center space-x-2 animate-pulse">
          <Check className="h-5 w-5 text-emerald-600" />
          <span>Pengaturan dan kunci API Midtrans berhasil disimpan dan diperbarui!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Pesantren profile card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center space-x-2.5">
            <Building className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">Profil & Identitas Pesantren</h3>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase">Nama Resmi Pondok Pesantren</label>
              <input
                type="text"
                required
                value={namaPesantren}
                onChange={(e) => setNamaPesantren(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase">Alamat Operasional Lengkap</label>
              <textarea
                required
                value={alamatPesantren}
                onChange={(e) => setAlamatPesantren(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Email Resmi</label>
                <input
                  type="email"
                  required
                  value={emailPesantren}
                  onChange={(e) => setEmailPesantren(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Nomor Telepon Kantor</label>
                <input
                  type="text"
                  required
                  value={teleponPesantren}
                  onChange={(e) => setTeleponPesantren(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo & Visual Identity config */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center space-x-2.5">
            <Settings className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">Logo & Identitas Visual Sistem</h3>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Preview Column */}
            <div className="flex flex-col items-center justify-center border border-slate-100 p-4 bg-slate-50/45 rounded-xl space-y-3">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Preview Logo Sistem</span>
              
              {/* Gold & Green Emblem Container */}
              <div className="relative h-20 w-20 rounded-full bg-emerald-900 border-2 border-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 flex items-center justify-center overflow-hidden">
                  {logoType === 'image' && logoUrl ? (
                    <img src={logoUrl} className="h-full w-full object-cover rounded-full animate-fade-in" alt="Logo Preview" />
                  ) : (
                    <span className="text-amber-400 font-extrabold text-2xl select-none">{logoText || 'MH'}</span>
                  )}
                </div>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              </div>
              
              <p className="text-[10px] text-slate-400 text-center font-medium">Tampilan logo di sidebar & halaman login</p>
            </div>

            {/* Config Fields Column */}
            <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
              <div className="space-y-2">
                <label className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">Tipe Logo Utama</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center space-x-2.5 cursor-pointer font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/60 transition-all">
                    <input
                      type="radio"
                      name="logoType"
                      value="text"
                      checked={logoType === 'text'}
                      onChange={() => setLogoType('text')}
                      className="accent-emerald-600 h-4.5 w-4.5 cursor-pointer"
                    />
                    <span>Emblem Huruf / Inisial</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/60 transition-all">
                    <input
                      type="radio"
                      name="logoType"
                      value="image"
                      checked={logoType === 'image'}
                      onChange={() => setLogoType('image')}
                      className="accent-emerald-600 h-4.5 w-4.5 cursor-pointer"
                    />
                    <span>Unggah Gambar / Logo Custom</span>
                  </label>
                </div>
              </div>

              {logoType === 'text' ? (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">Inisial Emblem (Maks. 3 Huruf)</label>
                  <input
                    type="text"
                    maxLength={3}
                    required={logoType === 'text'}
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    placeholder="Contoh: MH"
                    className="w-full max-w-[120px] bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-black uppercase text-center text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2.5 animate-fade-in">
                  <label className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">File Gambar Logo</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-rose-600 hover:text-rose-800 font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Direkomendasikan gambar persegi (ratio 1:1) dengan resolusi minimal 150x150 px.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment amounts config */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center space-x-2.5">
            <Wallet className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">Tarif & Biaya Pembayaran Pokok</h3>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase">Nominal SPP Bulanan (Rp)</label>
              <input
                type="number"
                required
                value={nominalSpp}
                onChange={(e) => setNominalSpp(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase">Nominal Daftar Ulang Tahunan (Rp)</label>
              <input
                type="number"
                required
                value={nominalDaftarUlang}
                onChange={(e) => setNominalDaftarUlang(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Midtrans Snap API Credentials config */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center space-x-2.5">
            <Key className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">Midtrans Payment Gateway Credentials</h3>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-800 flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Panduan Integrasi Midtrans Snap:</p>
                <p className="mt-1">
                  Daftarkan akun di <a href="https://midtrans.com" target="_blank" rel="noreferrer" className="underline font-bold">dashboard.midtrans.com</a>, dapatkan Client Key Anda di menu Settings {`>`} Access Keys, lalu tempel di kolom bawah ini. Mode Sandbox aman digunakan untuk uji coba pembayaran tanpa uang riil.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase">Midtrans Client Key (Sandbox / Production)</label>
              <input
                type="text"
                required
                value={midtransClientKey}
                onChange={(e) => setMidtransClientKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg p-2.5 font-mono"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sandbox_mode"
                checked={midtransSandboxMode}
                onChange={(e) => setMidtransSandboxMode(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
              />
              <label htmlFor="sandbox_mode" className="font-bold text-slate-700 cursor-pointer">
                Aktifkan Midtrans Sandbox Mode (Direkomendasikan untuk Pengujian)
              </label>
            </div>
          </div>
        </div>

        {/* Database Management & Synchronization Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Database className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">Manajemen Database & Ekspor/Impor Cadangan</h3>
            </div>
            {dbSavingSuccess && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Check className="h-3 w-3" /> Database tersimpan di server!
              </span>
            )}
            {dbRestoreSuccess && (
              <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Check className="h-3 w-3" /> Database berhasil dipulihkan!
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            <p className="text-slate-500 leading-relaxed">
              Semua perubahan data (santri, kelas, transaksi, tunggakan, pengaturan) disinkronkan secara otomatis secara berkala. Namun, Anda dapat memaksa penyimpanan instan ke server database atau mengunduh salinan cadangan lengkap berkas database Anda ke dalam berkas JSON untuk diimpor kembali kapan saja.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Button 1: Save All Data to Server */}
              <button
                type="button"
                onClick={handleManualSaveDb}
                disabled={dbSaving || !onSaveFullDatabase}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold p-3 rounded-xl border border-emerald-100 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-55"
              >
                <RefreshCw className={`h-4 w-4 text-emerald-600 ${dbSaving ? 'animate-spin' : ''}`} />
                <span>{dbSaving ? 'Menyimpan...' : 'Simpan Keseluruhan Data'}</span>
              </button>

              {/* Button 2: Export Database */}
              <button
                type="button"
                onClick={handleExportFullJSON}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold p-3 rounded-xl border border-slate-200/80 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="h-4 w-4 text-amber-500" />
                <span>Ekspor Database (Backup)</span>
              </button>

              {/* Button 3: Import/Restore Database */}
              <label className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold p-3 rounded-xl border border-slate-200/80 transition-all flex items-center justify-center space-x-2 cursor-pointer text-center">
                <Upload className="h-4 w-4 text-rose-500" />
                <span>Impor Database (Restore)</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportFullJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer text-xs"
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
