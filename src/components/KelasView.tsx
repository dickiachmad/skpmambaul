/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, X, Users, Download, Upload, FileText, Search } from 'lucide-react';
import { Kelas, Santri } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface KelasViewProps {
  kelas: Kelas[];
  santri: Santri[];
  onAddKelas: (k: Omit<Kelas, 'id'>) => void;
  onEditKelas: (k: Kelas) => void;
  onDeleteKelas: (id: string) => void;
  onImportKelasBulk: (k: Omit<Kelas, 'id'>[]) => void;
}

export default function KelasView({ kelas, santri, onAddKelas, onEditKelas, onDeleteKelas, onImportKelasBulk }: KelasViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentKelas, setCurrentKelas] = useState<Kelas | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState('ALL'); // ALL, FULL (>80%), AVAILABLE (<80%)

  // Form states
  const [nama, setNama] = useState('');
  const [waliKelas, setWaliKelas] = useState('');
  const [kapasitas, setKapasitas] = useState<number>(30);

  const getSantriCount = (kelasId: string) => {
    return santri.filter((s) => s.kelasId === kelasId && s.status === 'Aktif').length;
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setNama('');
    setWaliKelas('');
    setKapasitas(30);
    setShowModal(true);
  };

  const handleOpenEditModal = (k: Kelas) => {
    setIsEditing(true);
    setCurrentKelas(k);
    setNama(k.nama);
    setWaliKelas(k.waliKelas);
    setKapasitas(k.kapasitas);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !waliKelas) {
      alert('Harap isi nama kelas dan wali kelas!');
      return;
    }

    if (isEditing && currentKelas) {
      onEditKelas({
        id: currentKelas.id,
        nama,
        waliKelas,
        kapasitas: Number(kapasitas),
      });
    } else {
      onAddKelas({
        nama,
        waliKelas,
        kapasitas: Number(kapasitas),
      });
    }
    setShowModal(false);
  };

  // Export Data Kelas
  const handleExportCSV = () => {
    const headers = ['nama', 'waliKelas', 'kapasitas'];
    const rows = filteredKelas.map(k => [
      `"${k.nama.replace(/"/g, '""')}"`,
      `"${k.waliKelas.replace(/"/g, '""')}"`,
      k.kapasitas
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Export_Kelas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredKelas, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Export_Kelas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = ['nama', 'waliKelas', 'kapasitas'];
    const sampleRow = ['10A', 'Ustadz Mansur', '35'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Kelas.csv');
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
              nama: String(item.nama || ''),
              waliKelas: String(item.waliKelas || ''),
              kapasitas: Number(item.kapasitas || 30)
            }));
            onImportKelasBulk(sanitized);
            alert(`Berhasil mengimpor ${sanitized.length} data Kelas dari JSON.`);
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
              waliKelas: obj.waliKelas || '',
              kapasitas: Number(obj.kapasitas || 30)
            });
          }
          onImportKelasBulk(list);
          alert(`Berhasil mengimpor ${list.length} data Kelas dari CSV.`);
        }
      } catch (err) {
        alert('Gagal mengimpor berkas. Pastikan format data benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtering Kelas
  const filteredKelas = kelas.filter((k) => {
    const matchesSearch =
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.waliKelas.toLowerCase().includes(searchTerm.toLowerCase());
    
    const count = getSantriCount(k.id);
    const percent = k.kapasitas > 0 ? (count / k.kapasitas) * 100 : 0;
    
    if (occupancyFilter === 'FULL') {
      return matchesSearch && percent >= 80;
    }
    if (occupancyFilter === 'AVAILABLE') {
      return matchesSearch && percent < 80;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Manajemen Basis Data</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Data Kelas Mamba'ul Hidayah</h2>
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
            <Plus className="h-4.5 w-4.5 text-amber-300" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kelas atau wali kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>

          <div>
            <select
              value={occupancyFilter}
              onChange={(e) => setOccupancyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Kepadatan</option>
              <option value="FULL">Hampir Penuh (&gt;= 80%)</option>
              <option value="AVAILABLE">Tersedia Banyak (&lt; 80%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredKelas.map((k) => {
          const count = getSantriCount(k.id);
          const percent = Math.min(100, Math.round((count / k.kapasitas) * 100));
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              
              {/* Card top banner style */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-700 to-teal-600" />
              
              <div className="flex justify-between items-start pt-1">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <BookOpen className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Kelas {k.nama}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Wali: {k.waliKelas}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(k)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-50 cursor-pointer"
                    title="Ubah Kelas"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirm({ isOpen: true, id: k.id, name: k.nama });
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-50 cursor-pointer"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar and details */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    Jumlah Santri Aktif
                  </span>
                  <span className="font-bold text-slate-700 font-mono">
                    {count} / {k.kapasitas} <span className="text-slate-300">({percent}%)</span>
                  </span>
                </div>

                {/* Progress bar track */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${percent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      percent > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Class Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#002D21] text-white">
              <span className="font-bold text-sm tracking-wide">
                {isEditing ? 'Ubah Kelas' : 'Tambah Kelas Baru'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Nama Kelas */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: VII A, VIII B, dsb"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Wali Kelas */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Nama Wali Kelas (Gelar)</label>
                <input
                  type="text"
                  required
                  value={waliKelas}
                  onChange={(e) => setWaliKelas(e.target.value)}
                  placeholder="Contoh: Ustadz Mansur, S.Pd.I"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Kapasitas Kelas */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase">Kapasitas Maksimal Santri</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={kapasitas}
                  onChange={(e) => setKapasitas(Number(e.target.value))}
                  placeholder="30"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-500 focus:bg-white"
                />
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
                  Simpan Kelas
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
            onDeleteKelas(deleteConfirm.id);
          }
        }}
        title="Hapus Kelas"
        message={`Apakah Anda yakin ingin menghapus kelas "${deleteConfirm?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
