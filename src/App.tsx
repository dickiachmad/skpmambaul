/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SantriView from './components/SantriView';
import KelasView from './components/KelasView';
import PembayaranView from './components/PembayaranView';
import TunggakanView from './components/TunggakanView';
import LaporanView from './components/LaporanView';
import PenggunaView from './components/PenggunaView';
import PengaturanView from './components/PengaturanView';
import PasswordView from './components/PasswordView';
import MidtransModal from './components/MidtransModal';

import {
  INITIAL_SANTRI,
  INITIAL_CLASSES,
  INITIAL_TRANSACTIONS,
  INITIAL_TUNGGAKAN,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_KATEGORI,
  INITIAL_PAYMENT_TYPES,
} from './initialData';

import { Santri, Kelas, Transaksi, Tunggakan, Pengguna, PengaturanSistem, KategoriPembayar, JenisPembayaran } from './types';
import { Lock, User, CheckCircle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  // 1. Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('ponpes_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<Pengguna | null>(() => {
    const saved = localStorage.getItem('ponpes_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    const loggedIn = localStorage.getItem('ponpes_logged_in') === 'true';
    if (loggedIn) {
      return {
        id: 'U001',
        nama: 'Admin Ponpes',
        email: 'mambaulhidayah793@gmail.com',
        role: 'Super Admin',
        status: 'Aktif',
      };
    }
    return null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 2. Main System Databases (Synced to LocalStorage)
  const [santri, setSantri] = useState<Santri[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [tunggakan, setTunggakan] = useState<Tunggakan[]>([]);
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [settings, setSettings] = useState<PengaturanSistem>(INITIAL_SETTINGS);
  const [kategori, setKategori] = useState<KategoriPembayar[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<JenisPembayaran[]>([]);

  // 3. UI control states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMidtransTransaction, setActiveMidtransTransaction] = useState<Transaksi | null>(null);

  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    if (
      hostname.includes('run.app') || 
      hostname.includes('localhost') || 
      hostname.includes('127.0.0.1') || 
      hostname === ''
    ) {
      return '/api';
    }
    return 'https://skpmambaul-production.up.railway.app/api';
  };

  const BASE_URL = getBaseUrl();

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, options);
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server API tidak ditemukan');
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[API Error]', error);
      return { ok: false, error: error.message || 'Gagal terhubung ke server API' };
    }
  };

  const loadDatabase = async (isPoll = false) => {
    const result = await apiFetch('/db');
    if (result.ok && result.data && result.data.success && result.data.data) {
      const db = result.data.data;
      
      // Apply database records
      const loadedSantri = db.santri || INITIAL_SANTRI;
      const loadedKelas = db.kelas || INITIAL_CLASSES;
      const loadedTransactions = db.transaksi || INITIAL_TRANSACTIONS;
      const loadedTunggakan = db.tunggakan || INITIAL_TUNGGAKAN;
      const loadedKategori = db.kategori || INITIAL_KATEGORI;
      const loadedSettings = db.settings || INITIAL_SETTINGS;
      const loadedPaymentTypes = db.paymentTypes || INITIAL_PAYMENT_TYPES;
      
      let loadedUsers = db.pengguna || INITIAL_USERS;
      
      // Healing U001 admin email and password to user's desired credentials
      const u1Index = loadedUsers.findIndex((u: any) => u.id === 'U001');
      if (u1Index !== -1) {
        loadedUsers[u1Index] = {
          ...loadedUsers[u1Index],
          email: 'mambaulhidayah793@gmail.com',
          password: 'Mambaulhidayah01@',
          role: 'Super Admin',
          status: 'Aktif',
        };
      } else {
        loadedUsers.push({
          id: 'U001',
          nama: 'Admin Ponpes',
          email: 'mambaulhidayah793@gmail.com',
          role: 'Super Admin',
          status: 'Aktif',
          password: 'Mambaulhidayah01@',
        });
      }

      setSantri(loadedSantri);
      setKelas(loadedKelas);
      setTransaksi(loadedTransactions);
      setTunggakan(loadedTunggakan);
      setKategori(loadedKategori);
      setSettings(loadedSettings);
      setPengguna(loadedUsers);
      setPaymentTypes(loadedPaymentTypes);
      
      if (!isPoll) {
        console.log('[Database] Loaded state successfully from Server Database.');
      }
    } else {
      // If server database is empty or not initialized, seed it with initial default data
      if (!isPoll) {
        console.log('[Database] Database is empty or uninitialized. Seeding initial data onto Server Database...');
        
        const initialDbState = {
          santri: INITIAL_SANTRI,
          kelas: INITIAL_CLASSES,
          transaksi: INITIAL_TRANSACTIONS,
          tunggakan: INITIAL_TUNGGAKAN,
          kategori: INITIAL_KATEGORI,
          settings: INITIAL_SETTINGS,
          pengguna: INITIAL_USERS,
          paymentTypes: INITIAL_PAYMENT_TYPES,
        };

        // Guarantee admin is updated
        const u1Index = initialDbState.pengguna.findIndex((u: any) => u.id === 'U001');
        if (u1Index !== -1) {
          initialDbState.pengguna[u1Index] = {
            ...initialDbState.pengguna[u1Index],
            email: 'mambaulhidayah793@gmail.com',
            password: 'Mambaulhidayah01@',
          };
        }

        // Populate react states
        setSantri(initialDbState.santri);
        setKelas(initialDbState.kelas);
        setTransaksi(initialDbState.transaksi);
        setTunggakan(initialDbState.tunggakan);
        setKategori(initialDbState.kategori);
        setSettings(initialDbState.settings);
        setPengguna(initialDbState.pengguna);
        setPaymentTypes(initialDbState.paymentTypes);

        // Save to server database
        const saveRes = await apiFetch('/db/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialDbState),
        });
        if (!saveRes.ok) {
          console.error('Gagal inisialisasi database server:', saveRes.error);
        } else {
          console.log('[Database] Seeded initial data successfully to Server.');
        }
      }
    }
  };

  // Initialize and load databases from server database (database.json) with auto-polling
  useEffect(() => {
    loadDatabase();

    // Polling interval: refetch database every 4 seconds to sync in real-time across browsers
    const interval = setInterval(() => {
      loadDatabase(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Shared sync collection helper with server
  const saveCollection = async (collection: string, data: any, stateSetter: (d: any) => void) => {
    // Optimistically update state
    stateSetter(data);
    
    // Save to server
    const result = await apiFetch('/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, data })
    });
    
    if (!result.ok) {
      alert(`Gagal menyimpan data ${collection}: ${result.error}`);
    }
  };

  // Sync wrappers
  const saveSantri = (data: Santri[]) => saveCollection('santri', data, setSantri);
  const saveKelas = (data: Kelas[]) => saveCollection('kelas', data, setKelas);
  const saveTransactions = (data: Transaksi[]) => saveCollection('transaksi', data, setTransaksi);
  const saveTunggakan = (data: Tunggakan[]) => saveCollection('tunggakan', data, setTunggakan);
  const saveUsers = (data: Pengguna[]) => saveCollection('pengguna', data, setPengguna);
  const saveSettings = (data: PengaturanSistem) => saveCollection('settings', data, setSettings);
  const saveKategori = (data: KategoriPembayar[]) => saveCollection('kategori', data, setKategori);
  const savePaymentTypes = (data: JenisPembayaran[]) => saveCollection('paymentTypes', data, setPaymentTypes);

  const getFullDatabaseState = () => {
    return {
      santri,
      kelas,
      transaksi,
      tunggakan,
      kategori,
      settings,
      pengguna,
      paymentTypes
    };
  };

  const handleSaveFullDatabase = async (): Promise<boolean> => {
    const fullState = getFullDatabaseState();
    const result = await apiFetch('/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullState)
    });
    return result.ok;
  };

  const handleRestoreFullDatabase = async (fullState: any): Promise<boolean> => {
    if (!fullState || typeof fullState !== 'object') {
      alert('Format berkas cadangan tidak valid!');
      return false;
    }

    const result = await apiFetch('/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullState)
    });

    if (result.ok) {
      if (fullState.santri) setSantri(fullState.santri);
      if (fullState.kelas) setKelas(fullState.kelas);
      if (fullState.transaksi) setTransaksi(fullState.transaksi);
      if (fullState.tunggakan) setTunggakan(fullState.tunggakan);
      if (fullState.kategori) setKategori(fullState.kategori);
      if (fullState.settings) setSettings(fullState.settings);
      if (fullState.pengguna) setPengguna(fullState.pengguna);
      if (fullState.paymentTypes) setPaymentTypes(fullState.paymentTypes);
      return true;
    } else {
      alert(`Gagal memulihkan database ke server: ${result.error}`);
      return false;
    }
  };

  // 4. ACTION HANDLERS

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userList = pengguna.length > 0 ? pengguna : INITIAL_USERS;
    const cleanEmailInput = loginEmail.trim().toLowerCase();
    const cleanPasswordInput = loginPassword.trim();

    const foundUser = userList.find((u) => {
      if (!u.email || !u.password) return false;
      const cleanUserEmail = u.email.trim().toLowerCase();
      const cleanUserPassword = u.password.trim();
      
      const emailMatch = cleanUserEmail === cleanEmailInput;
      const santriNisnMatch = u.role === 'Santri' && u.email.trim() === loginEmail.trim();

      return (emailMatch || santriNisnMatch) && cleanUserPassword === cleanPasswordInput;
    });

    if (foundUser) {
      if (foundUser.status !== 'Aktif') {
        setLoginError('Akun Anda dinonaktifkan oleh administrator.');
        return;
      }
      setIsLoggedIn(true);
      setCurrentUser(foundUser);
      localStorage.setItem('ponpes_logged_in', 'true');
      localStorage.setItem('ponpes_current_user', JSON.stringify(foundUser));
      setLoginError('');
      setActiveTab('dashboard');
    } else {
      setLoginError('Alamat Email/NISN atau Kata Sandi salah!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('ponpes_logged_in');
    localStorage.removeItem('ponpes_current_user');
  };

  // Santri operations
  const handleAddSantri = (newS: Omit<Santri, 'id'>) => {
    const id = 'S' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const newSantriObj = { ...newS, id };
    saveSantri([...santri, newSantriObj]);

    // Auto-create User Account for this Santri
    const userId = 'U' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const newUserObj: Pengguna = {
      id: userId,
      nama: newS.nama,
      email: newS.nisn, // Log in using NISN as their email/username
      role: 'Santri',
      status: newS.status === 'Aktif' ? 'Aktif' : 'Non-aktif',
      password: 'santri123', // Default password for new santri accounts
      santriId: id,
    };
    saveUsers([...pengguna, newUserObj]);
  };

  const handleEditSantri = (updatedS: Santri) => {
    saveSantri(santri.map((s) => (s.id === updatedS.id ? updatedS : s)));

    // Sync to user account if exists
    const updatedUsers = pengguna.map((u) => {
      if (u.role === 'Santri' && u.santriId === updatedS.id) {
        return {
          ...u,
          nama: updatedS.nama,
          email: updatedS.nisn,
          status: updatedS.status === 'Aktif' ? ('Aktif' as const) : ('Non-aktif' as const),
        };
      }
      return u;
    });
    saveUsers(updatedUsers);
  };

  const handleDeleteSantri = (id: string) => {
    saveSantri(santri.filter((s) => s.id !== id));
    // Remove the associated Santri user account
    saveUsers(pengguna.filter((u) => !(u.role === 'Santri' && u.santriId === id)));
  };

  // Kelas operations
  const handleAddKelas = (newK: Omit<Kelas, 'id'>) => {
    const id = 'K' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    saveKelas([...kelas, { ...newK, id }]);
  };

  const handleEditKelas = (updatedK: Kelas) => {
    saveKelas(kelas.map((k) => (k.id === updatedK.id ? updatedK : k)));
  };

  const handleDeleteKelas = (id: string) => {
    saveKelas(kelas.filter((k) => k.id !== id));
  };

  // Transaksi operations
  const handleAddTransaction = (newT: Omit<Transaksi, 'id' | 'invoiceNo' | 'tanggal'>) => {
    const id = 'T' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    // Generate beautiful sequential invoice
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const rand = Math.floor(10 + Math.random() * 90);
    const invoiceNo = `INV-${dateStr}-${rand}`;
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('id-ID', options);

    const transaction: Transaksi = {
      ...newT,
      id,
      invoiceNo,
      tanggal: formattedDate,
    };

    const updatedTransactions = [transaction, ...transaksi];
    saveTransactions(updatedTransactions);

    // If payment method is Midtrans gateway, open the checkout simulation instantly!
    if (newT.metode.startsWith('Midtrans')) {
      setActiveMidtransTransaction(transaction);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    saveTransactions(transaksi.filter((t) => t.id !== id));
  };

  // Tunggakan operations
  const handleAddTunggakan = (newTg: Omit<Tunggakan, 'id'>) => {
    const id = 'TG' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    saveTunggakan([...tunggakan, { ...newTg, id }]);
  };

  const handleResolveTunggakan = (id: string) => {
    saveTunggakan(tunggakan.filter((t) => t.id !== id));
  };

  // User operations
  const handleAddUser = (newU: Omit<Pengguna, 'id'>) => {
    const id = 'U' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    saveUsers([...pengguna, { ...newU, id }]);
  };

  const handleEditUser = (updatedU: Pengguna) => {
    saveUsers(pengguna.map((u) => (u.id === updatedU.id ? updatedU : u)));
  };

  const handleDeleteUser = (id: string) => {
    saveUsers(pengguna.filter((u) => u.id !== id));
  };

  const handleImportSantriBulk = (importedList: Omit<Santri, 'id'>[]) => {
    const newSantris: Santri[] = [];
    const newUserObjs: Pengguna[] = [];

    importedList.forEach((s) => {
      const id = 'S' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      newSantris.push({ ...s, id });

      const userId = 'U' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      newUserObjs.push({
        id: userId,
        nama: s.nama,
        email: s.nisn,
        role: 'Santri',
        status: s.status === 'Aktif' ? 'Aktif' : 'Non-aktif',
        password: 'santri123',
        santriId: id,
      });
    });

    saveSantri([...santri, ...newSantris]);
    saveUsers([...pengguna, ...newUserObjs]);
  };

  const handleImportKelasBulk = (importedList: Omit<Kelas, 'id'>[]) => {
    const newKelas = importedList.map((k) => ({
      ...k,
      id: 'K' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
    }));
    saveKelas([...kelas, ...newKelas]);
  };

  const handleImportTransaksiBulk = (importedList: Omit<Transaksi, 'id' | 'invoiceNo' | 'tanggal'>[]) => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('id-ID', options);

    const newTrans = importedList.map((t, idx) => {
      const id = 'T' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      const rand = Math.floor(10 + Math.random() * 90) + idx;
      const invoiceNo = `INV-${dateStr}-${rand}`;

      return {
        ...t,
        id,
        invoiceNo,
        tanggal: formattedDate,
      };
    });

    saveTransactions([...newTrans, ...transaksi]);
  };

  const handleImportTunggakanBulk = (importedList: Omit<Tunggakan, 'id'>[]) => {
    const newTgs = importedList.map((t) => ({
      ...t,
      id: 'TG' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
    }));
    saveTunggakan([...tunggakan, ...newTgs]);
  };

  const handleImportPenggunaBulk = (importedList: Omit<Pengguna, 'id'>[]) => {
    const newUs = importedList.map((u) => ({
      ...u,
      id: 'U' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
    }));
    saveUsers([...pengguna, ...newUs]);
  };

  const handleUpdatePassword = (newPassword: string): boolean => {
    if (!currentUser) return false;
    const updatedUsers = pengguna.map((u) => {
      if (u.id === currentUser.id) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    saveUsers(updatedUsers);

    // Update current user state and local storage
    const updatedCurrentUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem('ponpes_current_user', JSON.stringify(updatedCurrentUser));
    return true;
  };

  // 5. MIDTRANS POPUP CALLBACKS
  const handleMidtransSuccess = (transactionId: string) => {
    // Update transaction status to 'Lunas'
    const updated = transaksi.map((t) => (t.id === transactionId ? { ...t, status: 'Lunas' as const } : t));
    saveTransactions(updated);
    
    // Automatically delete associated tunggakan if matched
    const transaction = transaksi.find(t => t.id === transactionId);
    if (transaction) {
      const remainingTunggakan = tunggakan.filter(tg => !(tg.santriId === transaction.santriId && transaction.jenisPembayaran.includes(tg.jenisTunggakan)));
      saveTunggakan(remainingTunggakan);
    }

    setTimeout(() => {
      setActiveMidtransTransaction(null);
    }, 2200);
  };

  const handleMidtransPending = (transactionId: string) => {
    const updated = transaksi.map((t) => (t.id === transactionId ? { ...t, status: 'Pending' as const } : t));
    saveTransactions(updated);
    setTimeout(() => {
      setActiveMidtransTransaction(null);
    }, 2200);
  };

  const handleMidtransFailure = (transactionId: string) => {
    const updated = transaksi.map((t) => (t.id === transactionId ? { ...t, status: 'Gagal' as const } : t));
    saveTransactions(updated);
    setTimeout(() => {
      setActiveMidtransTransaction(null);
    }, 2200);
  };

  // Get active santri name for Midtrans popup
  const getSantriNameForMidtrans = (id: string) => {
    return santri.find((s) => s.id === id)?.nama || 'Santri';
  };

  // If NOT logged in, show the beautiful login screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002D21] via-[#011c14] to-[#0D9488] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-950/25">
          {/* Header Card Brand */}
          <div className="bg-gradient-to-b from-[#002D21] to-[#011a13] p-8 text-center text-white relative">
            <div className="relative h-16 w-16 mx-auto rounded-full bg-emerald-900 border-2 border-amber-400 p-0.5 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/40">
              <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 flex items-center justify-center overflow-hidden">
                {settings.logoType === 'image' && settings.logoUrl ? (
                  <img src={settings.logoUrl} className="h-full w-full object-cover rounded-full" alt="Logo" />
                ) : (
                  <span className="text-amber-400 font-extrabold text-xl">{settings.logoText || 'MH'}</span>
                )}
              </div>
            </div>
            <h2 className="text-[10px] font-black tracking-widest uppercase text-emerald-300">Sistem Keuangan & Pembayaran</h2>
            <h1 className="text-md font-extrabold text-amber-300 tracking-tight leading-snug uppercase mt-1.5">{settings.namaPesantren || "Mamba'ul Hidayah Cipari"}</h1>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Portal Operator Utama</p>
          </div>

          {/* Form container */}
          <form onSubmit={handleLogin} className="p-7 space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-semibold text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wide">Alamat Email atau NISN Santri</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@ponpesmambada.sch.id atau NISN Santri"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3 pl-10 font-medium outline-none transition-all"
                />
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wide">Kata Sandi (Password)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3 pl-10 font-medium outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-700/15 hover:shadow-emerald-700/25 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <ShieldCheck className="h-4.5 w-4.5 text-amber-300" />
              <span className="text-sm font-bold tracking-wide">Masuk Sistem Informasi</span>
            </button>


          </form>
        </div>

        {/* Footer */}
        <p className="text-white/45 text-[10px] mt-6 tracking-wide text-center uppercase font-bold">
          © 2026 Ponpes Mamba'ul Hidayah Cipari • Verified Secures SSL
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
        settings={settings}
        currentUser={currentUser}
      />

      {/* 2. Main content area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setIsOpen={setIsSidebarOpen}
          recentTransactions={transaksi}
          onLogout={handleLogout}
          currentUser={currentUser}
        />

        {/* Dynamic page content */}
        <main className="flex-1 p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              santri={santri}
              kelas={kelas}
              transaksi={transaksi}
              tunggakan={tunggakan}
              onNavigate={setActiveTab}
              onOpenMidtransSimulator={setActiveMidtransTransaction}
              currentUser={currentUser}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'santri' && (
            <SantriView
              santri={santri}
              kelas={kelas}
              kategori={kategori}
              onAddSantri={handleAddSantri}
              onEditSantri={handleEditSantri}
              onDeleteSantri={handleDeleteSantri}
              onImportSantriBulk={handleImportSantriBulk}
            />
          )}

          {activeTab === 'kelas' && (
            <KelasView
              kelas={kelas}
              santri={santri}
              onAddKelas={handleAddKelas}
              onEditKelas={handleEditKelas}
              onDeleteKelas={handleDeleteKelas}
              onImportKelasBulk={handleImportKelasBulk}
            />
          )}

          {activeTab === 'pembayaran' && (
            <PembayaranView
              santri={santri}
              kelas={kelas}
              transaksi={transaksi}
              kategori={kategori}
              paymentTypes={paymentTypes}
              onUpdatePaymentTypes={savePaymentTypes}
              onUpdateKategori={saveKategori}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenMidtransSimulator={setActiveMidtransTransaction}
              currentUser={currentUser}
              onImportTransaksiBulk={handleImportTransaksiBulk}
            />
          )}

          {activeTab === 'tunggakan' && (
            <TunggakanView
              tunggakan={tunggakan}
              santri={santri}
              kelas={kelas}
              paymentTypes={paymentTypes}
              onAddTunggakan={handleAddTunggakan}
              onResolveTunggakan={handleResolveTunggakan}
              currentUser={currentUser}
              onImportTunggakanBulk={handleImportTunggakanBulk}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              transaksi={transaksi}
              santri={santri}
              kelas={kelas}
              settings={settings}
            />
          )}

          {activeTab === 'pengguna' && (
            <PenggunaView
              pengguna={pengguna}
              santri={santri}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onImportPenggunaBulk={handleImportPenggunaBulk}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              onUpdateSettings={saveSettings}
              onSaveFullDatabase={handleSaveFullDatabase}
              fullDatabaseState={getFullDatabaseState()}
              onRestoreFullDatabase={handleRestoreFullDatabase}
            />
          )}

          {activeTab === 'password' && currentUser && (
            <PasswordView
              currentUser={currentUser}
              onUpdatePassword={handleUpdatePassword}
            />
          )}
        </main>

        {/* Footer info banner */}
        <footer className="bg-white border-t border-slate-100 py-4.5 px-6 md:px-8 text-[10px] md:text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-2 print:hidden mt-auto">
          <p className="font-medium text-center md:text-left">
            © 2026 Pondok Pesantren Pembangunan Mamba'ul Hidayah Cipari. All rights reserved.
          </p>
          <p className="font-bold text-emerald-600 uppercase tracking-wider">
            Sistem Informasi Pesantren v1.0.0
          </p>
        </footer>
      </div>

      {/* 3. Midtrans Snap Simulator Gateway Modal overlay */}
      {activeMidtransTransaction && (
        <MidtransModal
          transaction={activeMidtransTransaction}
          santriName={getSantriNameForMidtrans(activeMidtransTransaction.santriId)}
          onSuccess={handleMidtransSuccess}
          onPending={handleMidtransPending}
          onFailure={handleMidtransFailure}
          onClose={() => setActiveMidtransTransaction(null)}
        />
      )}
    </div>
  );
}
