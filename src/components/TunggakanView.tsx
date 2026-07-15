/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Calendar, Phone, Share2, Send, Check, Download, Upload, FileText } from 'lucide-react';
import { Tunggakan, Santri, Kelas, Pengguna, JenisPembayaran } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface TunggakanViewProps {
  tunggakan: Tunggakan[];
  santri: Santri[];
  kelas: Kelas[];
  paymentTypes?: JenisPembayaran[];
  onAddTunggakan: (tg: Omit<Tunggakan, 'id'>) => void;
  onResolveTunggakan: (id: string) => void;
  currentUser?: Pengguna | null;
  onImportTunggakanBulk: (tg: Omit<Tunggakan, 'id'>[]) => void;
}

export default function TunggakanView({ tunggakan, santri, kelas, paymentTypes = [], onAddTunggakan, onResolveTunggakan, currentUser, onImportTunggakanBulk }: TunggakanViewProps) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [nominalFilter, setNominalFilter] = useState('ALL'); // ALL, GT_500, LT_500
  const [jenisFilter, setJenisFilter] = useState('ALL'); // ALL, SPP, NON_SPP
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolveConfirm, setResolveConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Role check
  const canManage = currentUser?.role === 'Super Admin' || currentUser?.role === 'Bendahara';

  // Form state for adding custom tunggakan
  const [showForm, setShowForm] = useState(false);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [jenisTunggakan, setJenisTunggakan] = useState('SPP Bulan Juni 2025');
  const [nominal, setNominal] = useState(500000);
  const [jatuhTempo, setJatuhTempo] = useState('10 Juni 2025');

  // Set default jenis and nominal based on paymentTypes when they are available
  useEffect(() => {
    if (paymentTypes && paymentTypes.length > 0) {
      const defaultType = paymentTypes.find(pt => pt.nama.includes('SPP Bulan Juni 2025')) || paymentTypes[0];
      if (defaultType) {
        setJenisTunggakan(defaultType.nama);
        setNominal(defaultType.nominalDefault);
      }
    }
  }, [paymentTypes]);

  const getSantriName = (id: string) => {
    return santri.find((s) => s.id === id)?.nama || 'Santri Terhapus';
  };

  const getSantriClass = (id: string) => {
    const s = santri.find((st) => st.id === id);
    if (!s) return '-';
    return kelas.find((k) => k.id === s.kelasId)?.nama || '-';
  };

  const getSantriPhone = (id: string) => {
    return santri.find((s) => s.id === id)?.noHpWali || '';
  };

  const getSantriWali = (id: string) => {
    return santri.find((s) => s.id === id)?.namaWali || '';
  };

  // Filtered tunggakan
  const filteredTunggakan = tunggakan.filter((t) => {
    if (currentUser?.role === 'Santri') {
      const activeSantriId = currentUser.santriId || santri.find(s => s.nisn === currentUser.email || s.id === currentUser.santriId)?.id;
      if (t.santriId !== activeSantriId) {
        return false;
      }
    }
    const sName = getSantriName(t.santriId).toLowerCase();
    const s = santri.find((st) => st.id === t.santriId);
    const matchesSearch = sName.includes(search.toLowerCase()) || t.jenisTunggakan.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || (s && s.kelasId === selectedClass);
    
    let matchesNominal = true;
    if (nominalFilter === 'GT_500') {
      matchesNominal = t.nominal > 500000;
    } else if (nominalFilter === 'LT_500') {
      matchesNominal = t.nominal <= 500000;
    }

    let matchesJenis = true;
    if (jenisFilter === 'SPP') {
      matchesJenis = t.jenisTunggakan.toLowerCase().includes('spp');
    } else if (jenisFilter === 'NON_SPP') {
      matchesJenis = !t.jenisTunggakan.toLowerCase().includes('spp');
    }

    return matchesSearch && matchesClass && matchesNominal && matchesJenis;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Export
  const handleExportCSV = () => {
    const headers = ['santriId', 'jenisTunggakan', 'nominal', 'jatuhTempo'];
    const rows = filteredTunggakan.map(t => [
      `"${t.santriId}"`,
      `"${t.jenisTunggakan.replace(/"/g, '""')}"`,
      t.nominal,
      `"${t.jatuhTempo}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Export_Tunggakan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTunggakan, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Export_Tunggakan_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const headers = ['santriId', 'jenisTunggakan', 'nominal', 'jatuhTempo'];
    const sampleRow = [santri[0]?.id || 'S001', 'SPP Bulan Juni 2025', '500000', '10 Juni 2025'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Tunggakan.csv');
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
              santriId: String(item.santriId || santri[0]?.id || ''),
              jenisTunggakan: String(item.jenisTunggakan || 'SPP Bulan Juni 2025'),
              nominal: Number(item.nominal || 500000),
              jatuhTempo: String(item.jatuhTempo || '10 Juni 2025')
            }));
            onImportTunggakanBulk(sanitized);
            alert(`Berhasil mengimpor ${sanitized.length} data Tunggakan dari JSON.`);
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
              santriId: obj.santriId || santri[0]?.id || '',
              jenisTunggakan: obj.jenisTunggakan || 'SPP Bulan Juni 2025',
              nominal: Number(obj.nominal || 500000),
              jatuhTempo: obj.jatuhTempo || '10 Juni 2025'
            });
          }
          onImportTunggakanBulk(list);
          alert(`Berhasil mengimpor ${list.length} data Tunggakan dari CSV.`);
        }
      } catch (err) {
        alert('Gagal mengimpor berkas. Pastikan format berkas benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleShareWhatsApp = (tg: Tunggakan) => {
    const s = santri.find((st) => st.id === tg.santriId);
    const sName = s?.nama || '';
    const waliName = s?.namaWali || '';
    const phone = s?.noHpWali || '';

    const message = `Assalamualaikum Wr. Wb. Bapak/Ibu ${waliName}, kami dari Pengelola Administrasi Pondok Pesantren Mamba'ul Hidayah Cipari menginfokan bahwa terdapat tunggakan pembayaran atas nama santri: *${sName}* berupa *${tg.jenisTunggakan}* sebesar *${formatIDR(tg.nominal)}* yang jatuh tempo pada *${tg.jatuhTempo}*. Pembayaran dapat dilakukan via transfer Bank, Cash di Kantor Bendahara, atau online via Link Midtrans. Terima kasih atas perhatiannya. Wassalamualaikum Wr. Wb.`;
    
    // Copy to clipboard simulation
    navigator.clipboard.writeText(message);
    setCopiedId(tg.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Open WhatsApp Web
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmitTunggakan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      alert('Harap pilih santri!');
      return;
    }
    onAddTunggakan({
      santriId: selectedSantriId,
      jenisTunggakan,
      nominal: Number(nominal),
      jatuhTempo,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header and Add Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <p className="text-xs text-slate-400 font-medium">Informasi & Penagihan</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Data Tunggakan Pembayaran Santri</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <div className="relative group">
                <button
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4 text-rose-600" />
                  <span>Ekspor</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 shadow-xl rounded-lg py-1 hidden group-hover:block z-20 w-32 text-xs">
                  <button onClick={handleExportCSV} className="w-full text-left px-3 py-2 hover:bg-slate-50 font-semibold text-slate-600">Ekspor CSV</button>
                </div>
              </div>
            </>
          )}
          {canManage && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <AlertCircle className="h-4.5 w-4.5 text-amber-300" />
              <span>Buat Surat Tagihan / Tunggakan</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Tunggakan Form (Collapsible) */}
      {showForm && (
        <form onSubmit={handleSubmitTunggakan} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 uppercase">Pilih Santri</label>
            <select
              required
              value={selectedSantriId}
              onChange={(e) => setSelectedSantriId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold cursor-pointer"
            >
              <option value="">-- Pilih Santri --</option>
              {santri.filter(s => s.status === 'Aktif').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({getSantriClass(s.id)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 uppercase">Jenis Tunggakan</label>
            <select
              required
              value={jenisTunggakan}
              onChange={(e) => {
                const selectedVal = e.target.value;
                setJenisTunggakan(selectedVal);
                const matchedType = paymentTypes.find((pt) => pt.nama === selectedVal);
                if (matchedType) {
                  setNominal(matchedType.nominalDefault);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold cursor-pointer"
            >
              <option value="">-- Pilih Jenis Tunggakan --</option>
              {paymentTypes.map((pt) => (
                <option key={pt.id} value={pt.nama}>
                  {pt.nama} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pt.nominalDefault)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 uppercase">Nominal Tunggakan (Rp)</label>
            <input
              type="number"
              required
              value={nominal}
              onChange={(e) => setNominal(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="font-bold text-slate-500 uppercase">Jatuh Tempo</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(e.target.value)}
                placeholder="10 Jun 2025"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium flex-1"
              />
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 rounded-xl cursor-pointer shadow-xs"
              >
                Kirim
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-1">
          <input
            type="text"
            placeholder="Cari santri / tunggakan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl py-2 px-8 text-xs font-medium outline-none transition-all"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Class Filter */}
        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="ALL">Semua Kelas</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Nominal Filter */}
        <div>
          <select
            value={nominalFilter}
            onChange={(e) => setNominalFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="ALL">Semua Nominal</option>
            <option value="GT_500">&gt; Rp 500.000</option>
            <option value="LT_500">&le; Rp 500.000</option>
          </select>
        </div>

        {/* Jenis Filter */}
        <div>
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="SPP">Khusus SPP</option>
            <option value="NON_SPP">Selain SPP</option>
          </select>
        </div>
      </div>

      {/* Table representing students who owe bills */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500">
            Daftar Tagihan Tunggakan ({filteredTunggakan.length} Tagihan)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#002D21] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-5 text-center">NO</th>
                <th className="py-3 px-5">SANTRI</th>
                <th className="py-3 px-5">KELAS</th>
                <th className="py-3 px-5">WALI SANTRI</th>
                <th className="py-3 px-5">JENIS TUNGGAKAN</th>
                <th className="py-3 px-5">JATUH TEMPO</th>
                <th className="py-3 px-5 text-right">NOMINAL</th>
                {canManage && <th className="py-3 px-5 text-center">AKSI PENAGIHAN</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTunggakan.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    Tidak ada santri menunggak. Alhamdulillah semua lunas!
                  </td>
                </tr>
              ) : (
                filteredTunggakan.map((tg, idx) => (
                  <tr key={tg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-4 px-5 font-bold text-slate-700">{getSantriName(tg.santriId)}</td>
                    <td className="py-4 px-5">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold">
                        {getSantriClass(tg.santriId)}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-700">{getSantriWali(tg.santriId)}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{getSantriPhone(tg.santriId)}</p>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-600">{tg.jenisTunggakan}</td>
                    <td className="py-4 px-5">
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-semibold flex items-center gap-1 w-fit">
                        <Calendar className="h-3 w-3" />
                        {tg.jatuhTempo}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-rose-600 text-right">
                      {formatIDR(tg.nominal)}
                    </td>
                    {canManage && (
                      <td className="py-4 px-5 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => handleShareWhatsApp(tg)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedId === tg.id ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                <span>Tagih WA</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setResolveConfirm({
                                isOpen: true,
                                id: tg.id,
                                name: `${getSantriName(tg.santriId)} - ${tg.jenisTunggakan}`
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Selesaikan"
                          >
                            <Check className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!resolveConfirm?.isOpen}
        onClose={() => setResolveConfirm(null)}
        onConfirm={() => {
          if (resolveConfirm) {
            onResolveTunggakan(resolveConfirm.id);
          }
        }}
        title="Selesaikan Tagihan"
        message={`Apakah Anda yakin ingin menyelesaikan secara manual tagihan "${resolveConfirm?.name}"? Tagihan ini akan dihapus dari daftar tunggakan.`}
        confirmText="Ya, Selesaikan"
        cancelText="Batal"
        type="warning"
      />
    </div>
  );
}
