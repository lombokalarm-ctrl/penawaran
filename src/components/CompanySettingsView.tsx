import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { Shield, Building, Landmark, Save, FileSignature, Settings, Info, Percent } from 'lucide-react';

interface CompanySettingsViewProps {
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
}

export default function CompanySettingsView({ settings, onUpdateSettings }: CompanySettingsViewProps) {
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [website, setWebsite] = useState(settings.website);
  
  // Bank fields
  const [bankName, setBankName] = useState(settings.bankName);
  const [bankBranch, setBankBranch] = useState(settings.bankBranch);
  const [bankAccountNo, setBankAccountNo] = useState(settings.bankAccountNo);
  const [bankAccountName, setBankAccountName] = useState(settings.bankAccountName);

  // Policy & signee
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate);
  const [signatureName, setSignatureName] = useState(settings.signatureName);
  const [signaturePosition, setSignaturePosition] = useState(settings.signaturePosition);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !bankAccountNo.trim()) {
      alert('Nama Perusahaan, Email, dan Nomor Rekening Bank wajib diisi.');
      return;
    }

    onUpdateSettings({
      name,
      address,
      email,
      phone,
      website,
      bankName,
      bankBranch,
      bankAccountNo,
      bankAccountName,
      taxRate,
      signatureName,
      signaturePosition
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6" id="settings-container">
      {/* Header section */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2 bg-slate-900 text-white rounded-lg">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pengaturan Profil Perusahaan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola detail identitas legal, instruksi transfer pembayaran, dan parameter dokumen formal Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs text-slate-600">
        
        {/* Left/Middle Column (Inputs) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Box 1: Legal Identity */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building size={16} className="text-slate-600" /> Profil & Identitas Perusahaan
            </h2>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama Resmi Perusahaan (Legal Name) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: PT Inovasi Teknologi Nusantara"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Alamat Kantor Pusat</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan jalan, kavling, gedung, kota, provinsi, dan kode pos secara lengkap..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Resmi <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: info@perusahaan.co.id"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">No. Telepon / Kantor</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: +62 21-XXX-XXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Website Perusahaan</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Contoh: www.perusahaan.co.id"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Box 2: Payment Gateway / Banking Details */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Landmark size={16} className="text-slate-600" /> Detail Rekening Bank Penerima
            </h2>
            <p className="text-[11px] text-slate-500 italic mt-0.5">Informasi bank ini akan dicetak secara otomatis di bagian kaki (footer) setiap dokumen invoice penagihan.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: Bank Mandiri, BCA, BRI, dsb."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kantor Cabang Bank</label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="Contoh: KC Jakarta Sudirman"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Rekening <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="Contoh: 1240098765432"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Atas Nama Rekening (Beneficiary Name)</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Contoh: PT Inovasi Teknologi Nusantara"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Box 3: Signatory Block & Policies */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileSignature size={16} className="text-slate-600" /> Penandatangan Dokumen Formal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap Penandatangan</label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Contoh: Budi Hermawan, S.Kom."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jabatan Struktural</label>
                <input
                  type="text"
                  value={signaturePosition}
                  onChange={(e) => setSignaturePosition(e.target.value)}
                  placeholder="Contoh: Direktur Utama / CEO"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                  <Percent size={12} className="text-slate-400" /> Tarif Default PPN (%)
                </label>
                <input
                  type="number"
                  min={0}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                  placeholder="Contoh: 11"
                  className="w-32 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">PPN default di Indonesia saat ini adalah 11%.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information Card & Saving Trigger */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Info size={14} className="text-indigo-400" /> Panduan Pengaturan
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed text-justify">
              Pastikan seluruh rincian nama legal, no. rekening bank, dan direktur penandatangan diisi secara akurat. Informasi ini dimuat di bagian tanda tangan basah dan instruksi kirim dana untuk klien Anda.
            </p>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-[10px] text-slate-400">Copyright © 2026 Sistem Administrasi Finansial Perusahaan Nusantara. Hak Cipta Dilindungi.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center gap-4">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Save size={14} /> Simpan Semua Perubahan
            </button>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-medium text-center w-full animate-pulse">
                ✓ Profil perusahaan berhasil disimpan!
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
