/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Users, UserPlus, Filter, Check, Eye, Download, Upload, FileText } from 'lucide-react';
import { Santri, Kelas, KategoriPembayar } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface SantriViewProps {
  santri: Santri[];
  kelas: Kelas[];
  kategori: KategoriPembayar[];
  onAddSantri: (s: Omit<Santri, 'id'>) => void;
  onEditSantri: (s: Santri) => void;
  onDeleteSantri: (id: string) => void;
  onImportSantriBulk: (s: Omit<Santri, 'id'>[]) => void;
}

export default function SantriView({ santri, kelas, kategori, onAddSantri, onEditSantri, onDeleteSantri, onImportSantriBulk }: SantriViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSantri, setCurrentSantri] = useState<Santri | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Form states
  const [nisn, setNisn] = useState('');
  const [nama, setNama] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [alamat, setAlamat] = useState('');
  const [namaWali, setNamaWali] = useState('');
  const [noHpWali, setNoHpWali] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Non-Aktif'>('Aktif');
  const [kategoriPembayarId, setKategoriPembayarId] = useState('');

  // Filtered santri list
  const filteredSantri = santri.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.namaWali.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'ALL' || s.kelasId === selectedClassFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || s.status === selectedStatusFilter;
    const matchesGender = selectedGenderFilter === 'ALL' || s.gender === selectedGenderFilter;
    const matchesCategory = selectedCategoryFilter === 'ALL' || s.kategoriPembayarId === selectedCategoryFilter;
    return matchesSearch && matchesClass && matchesStatus && matchesGender && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setNisn('');
    setNama('');
    setKelasId(kelas[0]?.id || '');
    setGender('Laki-laki');
    setAlamat('');
    setNamaWali('');
    setNoHpWali('');
    setStatus('Aktif');
    setKategoriPembayarId(kategori[0]?.id || '');
    setShowModal(true);
  };

  const handleOpenEditModal = (s: Santri) => {
    setIsEditing(true);
    setCurrentSantri(s);
    setNisn(s.nisn);
    setNama(s.nama);
    setKelasId(s.kelasId);
    setGender(s.gender);
    setAlamat(s.alamat);
    setNamaWali(s.namaWali);
    setNoHpWali(s.noHpWali);
    setStatus(s.status);
    setKategoriPembayarId(s.kategoriPembayarId || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn || !nama || !kelasId || !namaWali || !noHpWali) {
      alert('Harap isi semua kolom wajib!');
      return;
    }

    if (isEditing && currentSantri) {
      onEditSantri({
        id: currentSantri.id,
        nisn,
        nama,
        kelasId,
        gender,
        alamat,
        namaWali,
        noHpWali,
        status,
        kategoriPembayarId,
      });
    } else {
      onAddSantri({
        nisn,
        nama,
        kelasId,
        gender,
        alamat,
        namaWali,
        noHpWali,
        status,
        kategoriPembayarId,
      });
    }
    setShowModal(false);
  };

  const getClassName = (id: string) => {
    return kelas.find((k) => k.id === id)?.nama || 'Tidak Diketahui';
  };

  // Export Santri data
  const handleExportCSV = () => {
    const headers = ['nisn', 'nama', 'kelasId', 'gender', 'alamat', 'namaWali', 'noHpWali', 'status', 'kategoriPembayarId'];
    const rows = filteredSantri.map(s => [
      `"${s.nisn}"`,
      `"${s.nama.replace(/"/g, '""')}"`,
      `"${s.kelasId}"`,
      `"${s.gender}"`,
      `"${s.alamat.replace(/"/g, '""')}"`,
      `"${s.namaWali.replace(/"/g, '""')}"`,
      `"${s.noHpWali}"`,
      `"${s.status}"`,
      `"${s.kategoriPembayarId || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Export_Santri_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredSantri, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Export_Santri_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = ['nisn', 'nama', 'kelasId', 'gender', 'alamat', 'namaWali', 'noHpWali', 'status', 'kategoriPembayarId'];
    const sampleRow = ['0012345678', 'Ahmad Ridwan', kelas[0]?.id || 'K001', 'Laki-laki', 'Cipari Cilacap', 'H. Solihin', '081234567890', 'Aktif', kategori[0]?.id || 'CAT001'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Santri.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV/JSON import
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
              nisn: String(item.nisn || ''),
              nama: String(item.nama || ''),
              kelasId: String(item.kelasId || kelas[0]?.id || ''),
              gender: (item.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki') as 'Laki-laki' | 'Perempuan',
              alamat: String(item.alamat || ''),
              namaWali: String(item.namaWali || ''),
              noHpWali: String(item.noHpWali || ''),
              status: (item.status === 'Non-Aktif' || item.status === 'Non-aktif' || item.status === 'Non-Aktif' ? 'Non-Aktif' : 'Aktif') as 'Aktif' | 'Non-Aktif',
              kategoriPembayarId: String(item.kategoriPembayarId || kategori[0]?.id || '')
            }));
            onImportSantriBulk(sanitized);
            alert(`Berhasil mengimpor ${sanitized.length} data Santri dari JSON.`);
          } else {
            alert('Format berkas JSON harus berupa Array objek!');
          }
        } else {
          // CSV Parser
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const list: any[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Handle basic split by comma keeping quotes in mind or simple split
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((header, idx) => {
              obj[header] = values[idx] || '';
            });
            list.push({
              nisn: obj.nisn || '',
              nama: obj.nama || '',
              kelasId: obj.kelasId || kelas[0]?.id || '',
              gender: (obj.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki') as 'Laki-laki' | 'Perempuan',
              alamat: obj.alamat || '',
              namaWali: obj.namaWali || '',
              noHpWali: obj.noHpWali || '',
              status: (obj.status === 'Non-Aktif' || obj.status === 'Non-aktif' ? 'Non-Aktif' : 'Aktif') as 'Aktif' | 'Non-Aktif',
              kategoriPembayarId: obj.kategoriPembayarId || kategori[0]?.id || ''
            });
          }
          onImportSantriBulk(list);
          alert(`Berhasil mengimpor ${list.length} data Santri dari CSV.`);
        }
      } catch (err) {
        alert('Gagal mengimpor berkas. Pastikan format data benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top action cards & title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Manajemen Basis Data</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Data Santri Ponpes Mamba'ul Hidayah</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Import file button trigger */}
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
            <UserPlus className="h-4.5 w-4.5 text-amber-300" />
            <span>Tambah Santri Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari Santri, NISN, Wali..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {kategori.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Santri Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">
            Daftar Santri ({filteredSantri.length} Hasil ditemukan)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#002D21] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-5 text-center">NO</th>
                <th className="py-3 px-5">NISN</th>
                <th className="py-3 px-5">NAMA SANTRI</th>
                <th className="py-3 px-5">KELAS</th>
                <th className="py-3 px-5">GENDER</th>
                <th className="py-3 px-5">WALI SANTRI</th>
                <th className="py-3 px-5">NO. HP WALI</th>
                <th className="py-3 px-5 text-center">STATUS</th>
                <th className="py-3 px-5 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Users className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    Tidak ada data santri ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSantri.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-600">{s.nisn}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-700">
                      <div>{s.nama}</div>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5">
                        {kategori.find((c) => c.id === s.kategoriPembayarId)?.nama || 'Reguler'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md">
                        {getClassName(s.kelasId)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">{s.gender}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-600">{s.namaWali}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono">{s.noHpWali}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[9px] uppercase border ${
                          s.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Santri"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({ isOpen: true, id: s.id, name: s.nama });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Hapus Santri"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Santri Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#002D21] text-white">
              <span className="font-bold text-sm tracking-wide">
                {isEditing ? 'Ubah Informasi Santri' : 'Tambah Santri Baru'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                
                {/* NISN */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">NISN (Wajib)</label>
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 0087654321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Nama Lengkap (Wajib)</label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Muhammad Farhan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Kelas */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Kelas (Wajib)</label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  >
                    {kelas.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Kelamin */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Nama Wali */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Nama Wali (Wajib)</label>
                  <input
                    type="text"
                    required
                    value={namaWali}
                    onChange={(e) => setNamaWali(e.target.value)}
                    placeholder="Contoh: Ahmad Sudjak"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* No HP Wali */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">No. HP Wali (Wajib)</label>
                  <input
                    type="tel"
                    required
                    value={noHpWali}
                    onChange={(e) => setNoHpWali(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Alamat Rumah */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Alamat Lengkap</label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Diponegoro No. 10 Cipari, Cilacap"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Status Keaktifan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Non-Aktif')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase">Kategori Pembayar (Wajib)</label>
                  <select
                    value={kategoriPembayarId}
                    onChange={(e) => setKategoriPembayarId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  >
                    {kategori.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
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
                  Simpan Data
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
            onDeleteSantri(deleteConfirm.id);
          }
        }}
        title="Hapus Data Santri"
        message={`Apakah Anda yakin ingin menghapus data santri "${deleteConfirm?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
