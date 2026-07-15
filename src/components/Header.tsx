/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Menu, User, LogOut, CheckCircle, Clock } from 'lucide-react';
import { Transaksi, Pengguna } from '../types';

interface HeaderProps {
  activeTab: string;
  setIsOpen: (isOpen: boolean) => void;
  recentTransactions: Transaksi[];
  onLogout: () => void;
  currentUser?: Pengguna | null;
}

export default function Header({ activeTab, setIsOpen, recentTransactions, onLogout, currentUser }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get current tab title nicely in Indonesian
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentUser?.role === 'Santri' ? 'Dashboard Santri' : 'Dashboard Utama';
      case 'santri':
        return 'Kelola Data Santri';
      case 'kelas':
        return 'Kelola Data Kelas';
      case 'pembayaran':
        return currentUser?.role === 'Santri' ? 'Riwayat Pembayaran Saya' : 'Portal Pembayaran';
      case 'tunggakan':
        return currentUser?.role === 'Santri' ? 'Tunggakan Pembayaran Saya' : 'Informasi Tunggakan Santri';
      case 'laporan':
        return 'Laporan Keuangan & Statistik';
      case 'pengguna':
        return 'Manajemen Pengguna Sistem';
      case 'pengaturan':
        return 'Pengaturan Sistem & Gateway';
      case 'password':
        return 'Ubah Kata Sandi';
      default:
        return 'Dashboard Utama';
    }
  };

  // Get only pending transactions to show in notifications
  const pendingTransactions = recentTransactions.filter(t => t.status === 'Pending').slice(0, 5);

  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 px-6 flex items-center justify-between z-30 shadow-xs">
      <div className="flex items-center space-x-3">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
            SISTEM INFORMASI PESANTREN
          </span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
            {getTabTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 relative transition-all cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {pendingTransactions.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {pendingTransactions.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-fade-in z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Tunggakan / Pending</span>
                <span className="text-[10px] font-semibold text-emerald-600">Simulasi Otomatis</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {pendingTransactions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-xs">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    Tidak ada pembayaran pending saat ini
                  </div>
                ) : (
                  pendingTransactions.map((t) => (
                    <div key={t.id} className="p-3 hover:bg-slate-50 transition-colors text-left flex gap-2.5">
                      <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-slate-700">{t.jenisPembayaran}</p>
                        <p className="text-[11px] text-slate-400">Nominal: Rp {t.nominal.toLocaleString('id-ID')}</p>
                        <span className="inline-block mt-1 text-[9px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                          PENDING
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-[1px] bg-slate-200" />

        {/* User Profile Info & Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden shadow-xs">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-700">{currentUser?.nama || 'Admin'}</p>
              <p className="text-[10px] font-semibold text-slate-400">{currentUser?.role || 'Super Admin'}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser?.nama || 'Admin Ponpes'}</p>
                <p className="text-[10px] text-slate-400">{currentUser?.email || 'admin@ponpesmambada.sch.id'}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
