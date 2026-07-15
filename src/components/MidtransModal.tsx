/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Landmark, Wallet, CheckCircle, Clock, AlertTriangle, X, ArrowLeft, ChevronRight } from 'lucide-react';
import { Transaksi } from '../types';

interface MidtransModalProps {
  transaction: Transaksi;
  santriName: string;
  onSuccess: (transactionId: string) => void;
  onPending: (transactionId: string) => void;
  onFailure: (transactionId: string) => void;
  onClose: () => void;
}

export default function MidtransModal({
  transaction,
  santriName,
  onSuccess,
  onPending,
  onFailure,
  onClose,
}: MidtransModalProps) {
  const [step, setStep] = useState<'methods' | 'details' | 'success' | 'pending' | 'failed'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<{ id: string; name: string; type: 'va' | 'wallet' | 'card'; provider: string } | null>(null);
  const [seconds, setSeconds] = useState(120); // 2 minutes countdown for simulation

  // Read Midtrans Sandbox credentials from environment variables or use the user's provided keys
  const rawClientKey = (((import.meta as any).env?.VITE_MIDTRANS_CLIENT_KEY as string) || 'Mid-client-brOphFgAo2CMKyZO');
  const clientKey = rawClientKey.replace(/^["']|["']$/g, '').trim();

 const rawServerKey =
  (import.meta as any).env?.VITE_MIDTRANS_SERVER_KEY as string;
  const serverKey = rawServerKey.replace(/^["']|["']$/g, '').trim();

  const rawMerchantId = (((import.meta as any).env?.VITE_MIDTRANS_MERCHANT_ID as string) || 'M928753388');
  const merchantId = rawMerchantId.replace(/^["']|["']$/g, '').trim();

  // Real Midtrans Sandbox state
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [isSnapLoading, setIsSnapLoading] = useState(false);
  const [snapError, setSnapError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load Midtrans Snap JS dynamically
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    let script = document.querySelector(`script[src="${snapScriptUrl}"]`) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      script.onerror = (e) => {
        console.error('[Midtrans] Gagal memuat script:', e);
        setSnapError('Pustaka Midtrans Snap gagal dimuat di dalam penampil Sandbox ini. Silakan buka aplikasi Anda di tab baru (gunakan tombol "Open in new tab") untuk melakukan transaksi dengan lancar.');
      };
      document.body.appendChild(script);
    } else {
      script.setAttribute('data-client-key', clientKey);
    }

    // 2. Automatically request real Snap Token from Express backend API
    const generateRealToken = async () => {
      setIsSnapLoading(true);
      setSnapError(null);
      try {
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
        const response = await fetch(`${BASE_URL}/midtrans/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: transaction.invoiceNo,
            gross_amount: transaction.nominal,
            customer_name: santriName,
          }),
        });

        // Verify Content-Type is JSON
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Server API tidak ditemukan');
        }

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.token) {
          setSnapToken(data.token);
          console.log('[Midtrans] Successfully retrieved token:', data.token);
        } else {
          let errMsg = 'Gagal generate token dari server';
          if (data.error) {
            if (Array.isArray(data.error)) {
              errMsg = data.error.join(', ');
            } else if (typeof data.error === 'object') {
              errMsg = data.error.error_messages ? data.error.error_messages.join(', ') : JSON.stringify(data.error);
            } else {
              errMsg = String(data.error);
            }
          }
          setSnapError(errMsg);
        }
      } catch (err: any) {
        setSnapError(err.message || 'Gagal terhubung ke endpoint token backend');
      } finally {
        setIsSnapLoading(false);
      }
    };

    generateRealToken();
  }, [transaction.id, clientKey, santriName, transaction.invoiceNo, transaction.nominal]);

  // Auto trigger real Midtrans Snap once token is available
  useEffect(() => {
    if (snapToken) {
      handleTriggerSnap(snapToken);
    }
  }, [snapToken]);

  const handleTriggerSnap = (token: string) => {
    if (typeof (window as any).snap !== 'undefined') {
      (window as any).snap.pay(token, {
        onSuccess: (result: any) => {
          console.log('[Midtrans] Payment success:', result);
          handlePaymentSuccess();
        },
        onPending: (result: any) => {
          console.log('[Midtrans] Payment pending:', result);
          handlePaymentPending();
        },
        onError: (result: any) => {
          console.error('[Midtrans] Payment error:', result);
          handlePaymentFailed();
        },
        onClose: () => {
          console.log('[Midtrans] User closed snap popup without finishing payment');
        }
      });
    } else {
      alert('Pustaka Midtrans Snap JS belum terisi dengan benar. Mohon tunggu beberapa detik atau muat ulang halaman.');
    }
  };

  useEffect(() => {
    if (step === 'details') {
      const timer = setInterval(() => {
        setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const paymentMethods = [
    { id: 'bca_va', name: 'BCA Virtual Account', type: 'va', provider: 'BCA', desc: 'Bayar dari ATM BCA atau internet banking' },
    { id: 'mandiri_va', name: 'Mandiri Virtual Account', type: 'va', provider: 'Mandiri', desc: 'Bayar dari ATM Mandiri atau Livin\' by Mandiri' },
    { id: 'bni_va', name: 'BNI Virtual Account', type: 'va', provider: 'BNI', desc: 'Bayar dari ATM BNI atau mobile banking BNI' },
    { id: 'gopay', name: 'GoPay', type: 'wallet', provider: 'GoPay', desc: 'Bayar instant dengan aplikasi Gojek' },
    { id: 'shopeepay', name: 'ShopeePay', type: 'wallet', provider: 'ShopeePay', desc: 'Bayar menggunakan saldo ShopeePay' },
    { id: 'cc', name: 'Kartu Kredit / Debit', type: 'card', provider: 'Visa/Mastercard', desc: 'Mendukung Visa, Mastercard, JCB, dan Amex' },
  ] as const;

  const handleSelectMethod = (method: typeof paymentMethods[number]) => {
    setSelectedMethod(method);
    setStep('details');
  };

  const handlePaymentSuccess = () => {
    setStep('success');
    setTimeout(() => {
      onSuccess(transaction.id);
    }, 2000);
  };

  const handlePaymentPending = () => {
    setStep('pending');
    setTimeout(() => {
      onPending(transaction.id);
    }, 2000);
  };

  const handlePaymentFailed = () => {
    setStep('failed');
    setTimeout(() => {
      onFailure(transaction.id);
    }, 2000);
  };

  // Format IDR helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Midtrans Header Bar */}
        <div className="bg-[#1D2939] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-sky-500 flex items-center justify-center font-bold text-xs tracking-wider text-white">M</div>
            <div>
              <span className="font-bold tracking-tight text-sm">midtrans</span>
              <span className="text-sky-400 font-medium text-xs ml-1">snap</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Secure Checkout</span>
            <button onClick={onClose} className="hover:text-white ml-2 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sandbox Client Key Connection Banner */}
        <div className="bg-[#101F1B] text-emerald-300 text-[9px] font-semibold py-2 px-4 flex flex-col gap-1 border-b border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-emerald-400">Sandbox Terkoneksi</span>
            </div>
            <span className="font-mono text-[9px] bg-emerald-950 px-2 py-0.5 rounded text-slate-300">
              Merchant ID: {merchantId}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 font-mono text-[8px]">
            <span>Client Key:</span>
            <span className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300">{clientKey}</span>
          </div>
        </div>

        {/* Store Detail Banner */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-400 uppercase tracking-wider font-semibold">Penerima</p>
            <p className="font-semibold text-slate-700">Ponpes Mamba'ul Hidayah Cipari</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 uppercase tracking-wider font-semibold">Total Pembayaran</p>
            <p className="font-bold text-base text-emerald-600">{formatIDR(transaction.nominal)}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'methods' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Metode Pembayaran Resmi</h3>
                <p className="text-slate-500 text-xs mt-1">Selesaikan pembayaran Anda menggunakan gateway resmi Midtrans Snap.</p>
              </div>

              {/* Order Quick Summary */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">No. Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">{transaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Nama Santri:</span>
                  <span className="font-bold text-slate-800">{santriName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Jenis Pembayaran:</span>
                  <span className="font-bold text-slate-800">{transaction.jenisPembayaran}</span>
                </div>
              </div>

              {/* Real Midtrans Snap Payment Trigger */}
              <div className="border border-sky-100 bg-sky-50/30 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                    </span>
                    <span className="font-extrabold text-sky-950 text-xs tracking-wider uppercase">Midtrans Snap Gateway</span>
                  </div>
                  <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full uppercase">Sandbox</span>
                </div>
                
                {isSnapLoading ? (
                  <button disabled className="w-full bg-sky-600 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center space-x-2.5 opacity-85">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Membuat Token Transaksi...</span>
                  </button>
                ) : snapError ? (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl text-xs font-medium leading-relaxed space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-rose-700">
                      <AlertTriangle className="h-4 w-4" />
                      Gagal Membuat Sesi Pembayaran
                    </p>
                    <p className="text-slate-600">{snapError}</p>
                    <p className="text-[10px] text-slate-500 font-normal">Pastikan kredensial Midtrans Server Key dan Client Key Anda telah diatur dengan benar di lingkungan sandbox.</p>
                  </div>
                ) : snapToken ? (
                  <button
                    onClick={() => handleTriggerSnap(snapToken)}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-sm py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer uppercase tracking-wider"
                  >
                    <CreditCard className="h-5 w-5 text-amber-300" />
                    <span>Bayar Sekarang via Midtrans</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl text-xs text-center font-medium">
                    Sesi pembayaran tidak aktif. Mohon hubungi administrator.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4 flex flex-col items-center">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-slate-800">Pembayaran Sukses!</h3>
                <p className="text-slate-500 text-xs">
                  Sistem Midtrans telah memverifikasi pembayaran Anda secara real-time.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full text-xs text-slate-600 space-y-1.5 text-left font-mono">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span className="font-semibold text-slate-800">{transaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-semibold text-slate-800">{selectedMethod?.name || 'Midtrans'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-600 uppercase">SETTLEMENT (LUNAS)</span>
                </div>
              </div>
            </div>
          )}

          {step === 'pending' && (
            <div className="py-8 text-center space-y-4 flex flex-col items-center">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 animate-pulse">
                <Clock className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-slate-800">Menunggu Pembayaran</h3>
                <p className="text-slate-500 text-xs">
                  Transaksi disimpan sebagai pending. Silakan selesaikan pembayaran sebelum kedaluwarsa.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full text-xs text-slate-600 space-y-1.5 text-left font-mono">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span className="font-semibold text-slate-800">{transaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-amber-600 uppercase">PENDING PAYMENT</span>
                </div>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="py-8 text-center space-y-4 flex flex-col items-center">
              <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-slate-800">Pembayaran Gagal</h3>
                <p className="text-slate-500 text-xs">
                  Transaksi dibatalkan atau sesi pembayaran kedaluwarsa.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full text-xs text-slate-600 space-y-1.5 text-left font-mono">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span className="font-semibold text-slate-800">{transaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-rose-600 uppercase">CANCELLED / DENIED</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-[10px] text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Didukung oleh Midtrans Payment Gateway. Koneksi Terenkripsi SSL 256-bit.</span>
        </div>
      </div>
    </div>
  );
}
