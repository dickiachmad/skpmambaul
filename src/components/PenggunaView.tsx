/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Shield, Lock, UserCheck, KeyRound, Download, Upload, FileText, Search } from 'lucide-react';
import { Pengguna, Santri } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PenggunaViewProps {
  pengguna: Pengguna[];
  santri?: Santri[];
  onAddUser: (u: Omit<Pengguna, 'id'>) => void;
  onEditUser: (u: Pengguna) => void;
  onDeleteUser: (id: string) => void;
  onImportPenggunaBulk: (u: Omit<Pengguna, 'id'>[]) => void;
}

export default function PenggunaView({ pengguna, santri = [], onAddUser, onEditUser, onDeleteUser, onImportPenggunaBulk }: PenggunaViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Pengguna | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form states
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'Bendahara' | 'Pengasuh Pesantren' | 'Santri'>('Bendahara');
  const [status, setStatus] = useState<'Aktif' | 'Non-aktif'>('Aktif');
  const [selectedSantriId, setSelectedSantriId] = useState('');

  // Filtered list
  const filteredPengguna = pengguna.filter(u => {
    const matchesSearch = u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Export
  const handleExportCSV = () => {
    const headers = ['nama', 'email', 'password', 'role', 'status', 'santriId'];
    const rows = filteredPengguna.map(u => [
      `"${u.nama.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.password || ''}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.santriId || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Export_Pengguna_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredPengguna, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Export_Pengguna_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const headers = ['nama', 'email', 'password', 'role', 'status', 'santriId'];
    const sampleRow = ['Ahmad Syarif', 'ahmadsyarif@test.com', 'sandi123', 'Bendahara', 'Aktif', ''];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Pengguna.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import
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
              nama: String(item.nama || ''),
              email: String(item.email || ''),
              password: String(item.password || 'sandi123'),
              role: (item.role || 'Bendahara') as any,
              status: (item.status || 'Aktif') as any,
              santriId: String(item.santriId || '')
            }));
            onImportPenggunaBulk(sanitized);
            alert(`Berhasil mengimpor ${sanitized.length} Pengguna dari JSON.`);
          } else {
            alert('Format berkas JSON harus berupa Array objek!');
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
              nama: obj.nama || '',
              email: obj.email || '',
              password: obj.password || 'sandi123',
              role: (obj.role || 'Bendahara') as any,
              status: (obj.status || 'Aktif') as any,
              santriId: obj.santriId || ''
            });
          }
          onImportPenggunaBulk(list);
          alert(`Berhasil mengimpor ${list.length} Pengguna dari CSV.`);
        }
      } catch (err) {
        alert('Gagal mengimpor berkas. Pastikan format berkas benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setNama('');
    setEmail('');
    setPassword('sandi123'); // Default password for new accounts
    setRole('Bendahara');
    setStatus('Aktif');
    setSelectedSantriId('');
    setShowModal(true);
  };

  const handleOpenEditModal = (u: Pengguna) => {
    setIsEditing(true);
    setCurrentUser(u);
    setNama(u.nama);
    setEmail(u.email);
    setPassword(u.password || '');
    setRole(u.role);
    setStatus(u.status);
    setSelectedSantriId(u.santriId || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email) {
      alert('Harap isi nama dan email/NISN!');
      return;
    }
    if (!password) {
      alert('Harap isi kata sandi!');
      return;
    }

    const userData: Omit<Pengguna, 'id'> = {
      nama,
      email,
      role,
      status,
      password,
      ...(role === 'Santri' && selectedSantriId ? { santriId: selectedSantriId } : {}),
    };

    if (isEditing && currentUser) {
      onEditUser({
        id: currentUser.id,
        ...userData,
      });
    } else {
      onAddUser(userData);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header and action button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <p className="text-xs text-slate-400 font-medium">Sistem Keamanan & Otorisasi</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Daftar Pengguna & Akses Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan portal ini untuk mengelola hak akses akun, mengubah kata sandi, serta membuat akun wali/santri secara manual.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer">
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Impor</span>
            <input type="file" accept=".csv,.json" onChange={handleImportFile} className="hidden" />
          </label>
          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Unduh Template CSV"
          >
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Unduh Template</span>
          </button>
          <div className="relative group">
            <button
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Ekspor</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 shadow-xl rounded-lg py-1 hidden group-hover:block z-20 w-32 text-xs">
              <button onClick={handleExportCSV} className="w-full text-left px-3 py-2 hover:bg-slate-50 font-semibold text-slate-600">Ekspor CSV</button>
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama atau username/ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 px-8 text-xs font-medium outline-none transition-all"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="ALL">Semua Jabatan / Role</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Bendahara">Bendahara</option>
            <option value="Pengasuh Pesantren">Pengasuh Pesantren</option>
            <option value="Santri">Santri</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-aktif">Non-aktif</option>
          </select>
        </div>
      </div>

      {/* Info Card banner */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4.5 text-left text-xs text-emerald-800 flex items-start space-x-3">
        <UserCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">💡 Otomatisasi Akun Santri</p>
          <p className="leading-relaxed">
            Setiap kali Anda mendaftarkan santri baru di menu <strong>Kelola Data Santri</strong>, sistem akan secara otomatis membuatkan akun santri dengan username berupa <strong>NISN</strong> dan kata sandi default <strong>santri123</strong>. Anda dapat mengedit, melihat, atau mereset kata sandi mereka di halaman ini.
          </p>
        </div>
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPengguna.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow flex flex-col justify-between h-fit min-h-[170px] text-left">
            
            {/* Top accent border based on Role */}
            <div className={`absolute top-0 inset-x-0 h-1.5 ${
              u.role === 'Super Admin' ? 'bg-amber-400' : 
              u.role === 'Bendahara' ? 'bg-emerald-600' : 
              u.role === 'Santri' ? 'bg-sky-500' : 'bg-slate-400'
            }`} />

            <div>
              <div className="flex justify-between items-start pt-1">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${
                    u.role === 'Super Admin' ? 'bg-amber-50 text-amber-600' : 
                    u.role === 'Bendahara' ? 'bg-emerald-50 text-[#059669]' : 
                    u.role === 'Santri' ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="max-w-[150px] md:max-w-[180px]">
                    <h3 className="text-xs font-extrabold text-slate-800 truncate" title={u.nama}>{u.nama}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate" title={u.email}>
                      ID: <span className="font-mono text-slate-700">{u.email}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-50 cursor-pointer"
                    title="Ubah Akses / Sandi"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirm({ isOpen: true, id: u.id, name: u.nama });
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-50 cursor-pointer"
                    title="Hapus Akses"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Password details box */}
              <div className="mt-4 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center space-x-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  <span>Sandi: </span>
                  <strong className="font-mono text-slate-800 tracking-wide bg-white px-1.5 py-0.5 rounded border border-slate-100">{u.password || '—'}</strong>
                </span>
                {u.role === 'Santri' && (
                  <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Siswa / Wali
                  </span>
                )}
              </div>
            </div>

            {/* Bottom details block */}
            <div className="mt-4 border-t border-slate-50 pt-3 flex justify-between items-center text-xs">
              <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                u.role === 'Super Admin' ? 'bg-amber-50 text-amber-700' : 
                u.role === 'Bendahara' ? 'bg-emerald-50 text-emerald-700' : 
                u.role === 'Santri' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {u.role}
              </span>

              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                u.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {u.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit User Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 text-left">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#002D21] text-white">
              <span className="font-bold text-sm tracking-wide">
                {isEditing ? 'Ubah Hak Akses / Kata Sandi' : 'Daftarkan Akun Baru'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Role / Level Otorisasi */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Level Otorisasi</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    setRole(newRole);
                    if (newRole !== 'Santri') {
                      setSelectedSantriId('');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold cursor-pointer"
                >
                  <option value="Super Admin">Super Admin (Akses Penuh)</option>
                  <option value="Bendahara">Bendahara (Kelola Transaksi & Laporan)</option>
                  <option value="Pengasuh Pesantren">Pengasuh Pesantren (Lihat Saja)</option>
                  <option value="Santri">Santri / Siswa (Lihat Keuangan Mandiri)</option>
                </select>
              </div>

              {/* If Role is Santri, show Santri Link picker */}
              {role === 'Santri' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Hubungkan dengan Data Santri</label>
                  <select
                    required
                    value={selectedSantriId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setSelectedSantriId(sId);
                      const sObj = santri.find(s => s.id === sId);
                      if (sObj) {
                        setNama(sObj.nama);
                        setEmail(sObj.nisn); // Use NISN as the login username/email
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold cursor-pointer"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {santri.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} (NISN: {s.nisn})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-sky-700 leading-relaxed italic bg-sky-50 p-2 rounded-lg border border-sky-100">
                    * Memilih santri akan otomatis mengisi nama dan menetapkan nomor NISN sebagai Username login.
                  </p>
                </div>
              )}

              {/* Nama */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Nama Pengguna</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Ustadzah Aminah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                />
              </div>

              {/* Email / Username */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">
                  {role === 'Santri' ? 'Username Login (NISN Santri)' : 'Alamat Email (Akses Login)'}
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'Santri' ? "Masukkan NISN santri" : "Contoh: admin@ponpesmambada.sch.id"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                />
              </div>

              {/* Kata Sandi (Password) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Kata Sandi (Password)</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi login"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Status Akun</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-aktif">Non-aktif / Bekukan</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg cursor-pointer shadow-xs"
                >
                  Simpan Akses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm?.isOpen}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            onDeleteUser(deleteConfirm.id);
          }
        }}
        title="Hapus Akses Pengguna"
        message={`Apakah Anda yakin ingin menghapus akses akun "${deleteConfirm?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
