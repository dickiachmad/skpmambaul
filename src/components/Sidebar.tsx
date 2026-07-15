/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { PengaturanSistem, Pengguna } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  settings?: PengaturanSistem;
  currentUser?: Pengguna | null;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, settings, currentUser }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'santri', label: 'Data Santri', icon: Users },
    { id: 'kelas', label: 'Data Kelas', icon: BookOpen },
    { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard },
    { id: 'tunggakan', label: 'Tunggakan', icon: AlertCircle },
    { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'pengguna', label: 'Manajemen Pengguna', icon: UserCheck },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
    { id: 'password', label: 'Ubah Password', icon: Lock },
  ] as const;

  const filteredMenuItems = menuItems.filter((item) => {
    const role = currentUser?.role || 'Super Admin';
    if (role === 'Super Admin') {
      return true;
    }
    if (role === 'Bendahara') {
      return ['dashboard', 'pembayaran', 'tunggakan', 'laporan', 'password'].includes(item.id);
    }
    if (role === 'Pengasuh Pesantren') {
      return ['dashboard', 'laporan', 'password'].includes(item.id);
    }
    if (role === 'Santri') {
      return ['dashboard', 'pembayaran', 'tunggakan', 'password'].includes(item.id);
    }
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-[#002D21] to-[#011a13] text-emerald-100 flex flex-col justify-between border-r border-emerald-950 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Header */}
          <div className="p-6 border-b border-emerald-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Gold & Green Emblem */}
              <div className="relative h-12 w-12 rounded-full bg-emerald-900 border-2 border-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 flex items-center justify-center overflow-hidden">
                  {settings?.logoType === 'image' && settings?.logoUrl ? (
                    <img src={settings.logoUrl} className="h-full w-full object-cover rounded-full" alt="Logo" />
                  ) : (
                    <span className="text-amber-400 font-bold text-lg select-none">{settings?.logoText || 'MH'}</span>
                  )}
                </div>
                {/* Decorative dots to mimic the emblem look */}
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full"></div>
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full"></div>
              </div>

              <div className="flex flex-col max-w-[140px]">
                <span className="font-extrabold text-xs text-white uppercase leading-tight tracking-wide line-clamp-2">
                  {settings?.namaPesantren || "PONPES MAMBA'UL HIDAYAH CIPARI"}
                </span>
                <span className="text-[9px] text-amber-300 font-bold mt-0.5 uppercase tracking-wider">Sistem Keuangan</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md text-emerald-300 hover:text-white hover:bg-emerald-900/50 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Subtitle */}
          <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-950/40">
            <p className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
              Sistem Administrasi Pembayaran
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 flex-1 space-y-1">
            <p className="px-3 py-2 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
              Menu Utama
            </p>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-700/80 to-[#0D9488]/80 text-white shadow-md shadow-emerald-950/40 border-l-4 border-amber-400 pl-3'
                      : 'hover:bg-emerald-900/45 hover:text-white text-emerald-200/85'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-amber-300' : 'text-emerald-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-emerald-950/60 bg-emerald-950/20">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl font-semibold text-sm text-rose-300 hover:text-white hover:bg-rose-950/40 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
