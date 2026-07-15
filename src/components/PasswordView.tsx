/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Pengguna } from '../types';

interface PasswordViewProps {
  currentUser: Pengguna;
  onUpdatePassword: (newPassword: string) => boolean;
}

export default function PasswordView({ currentUser, onUpdatePassword }: PasswordViewProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    // Attempt to update password
    const isUpdated = onUpdatePassword(newPassword);
    if (isUpdated) {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError('Gagal memperbarui kata sandi. Silakan coba lagi.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-emerald-50 rounded-2xl">
            <Lock className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Kelola Keamanan Akun</h3>
            <p className="text-[10px] text-slate-400">Ganti kata sandi demi menjaga keamanan portal Anda</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>Kata sandi Anda berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Current User Info */}
          <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 border border-slate-100 mb-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-semibold uppercase">Nama Pengguna</span>
              <span className="text-slate-700 font-bold">{currentUser.nama}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-semibold uppercase">Hak Akses / Role</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wide">Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3 pl-4 pr-10 font-medium outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wide">Konfirmasi Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3 pl-4 pr-10 font-medium outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-700/15 hover:shadow-emerald-700/25 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-4"
          >
            <Lock className="h-4.5 w-4.5" />
            <span className="text-sm font-bold tracking-wide">Perbarui Kata Sandi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
