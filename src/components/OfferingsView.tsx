import React, { useState, useEffect } from 'react';
import { Client, CompanySettings, Offering, LineItem, OfferingStatus } from '../types';
import { formatRupiah, formatIndonesianDate, formatTerbilangRupiah } from '../utils';
import { Search, Plus, Trash2, Edit2, FileText, Printer, CheckCircle2, RefreshCw, X, ArrowLeft, Send, Landmark } from 'lucide-react';

interface OfferingsViewProps {
  clients: Client[];
  companySettings: CompanySettings;
  offerings: Offering[];
  activeOfferingId: string | null;
  onAddOffering: (offering: Omit<Offering, 'id' | 'createdAt'>) => Promise<Offering>;
  onUpdateOffering: (offering: Offering) => void;
  onDeleteOffering: (id: string) => void;
  onConvertOfferingToInvoice: (offering: Offering) => void;
  getTotals: (items: any[], discount: number, taxRate: number) => { subtotal: number; taxAmount: number; grandTotal: number };
  onClearActiveId: () => void;
}

export default function OfferingsView({
  clients,
  companySettings,
  offerings,
  activeOfferingId,
  onAddOffering,
  onUpdateOffering,
  onDeleteOffering,
  onConvertOfferingToInvoice,
  getTotals,
  onClearActiveId
}: OfferingsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [viewingOffering, setViewingOffering] = useState<Offering | null>(null);

  // Check if routed with active ID
  useEffect(() => {
    if (activeOfferingId) {
      const found = offerings.find(o => o.id === activeOfferingId);
      if (found) {
        setViewingOffering(found);
      }
      onClearActiveId(); // Clear once loaded
    }
  }, [activeOfferingId, offerings]);

  // Form states
  const [clientId, setClientId] = useState('');
  const [offeringNumber, setOfferingNumber] = useState('');
  const [date, setDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(companySettings.taxRate !== undefined && companySettings.taxRate !== null ? companySettings.taxRate : 11);
  const [status, setStatus] = useState<OfferingStatus>('Draft');
  const [terms, setTerms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Item form state
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  // Term input helper
  const [newTerm, setNewTerm] = useState('');

  // Auto-generate invoice number based on company standard
  const generateOfferingNumber = () => {
    const year = new Date().getFullYear();
    const monthsRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const monthIndex = new Date().getMonth();
    const monthRomawi = monthsRomawi[monthIndex];
    const sequence = Math.floor(100 + Math.random() * 900); // Random sequence to mimic real numbers
    return `${sequence}/ITN-PNW/${monthRomawi}/${year}`;
  };

  const openAddForm = () => {
    setEditingOffering(null);
    setClientId(clients[0]?.id || '');
    setOfferingNumber(generateOfferingNumber());
    
    const todayStr = new Date().toISOString().split('T')[0];
    setDate(todayStr);
    
    const validStr = new Date();
    validStr.setDate(validStr.getDate() + 30);
    setValidUntil(validStr.toISOString().split('T')[0]);

    setItems([]);
    setDiscount(0);
    setTaxRate(companySettings.taxRate);
    setStatus('Draft');
    setTerms([
      "Pembayaran uang muka (DP) sebesar 30% setelah penawaran disetujui oleh kedua belah pihak.",
      "Pembayaran Termin ke-2 sebesar 40% setelah sistem selesai dikembangkan.",
      "Pelunasan sebesar 30% setelah masa uji terima (UAT) dan pelatihan selesai.",
      "Harga sudah termasuk pajak PPN sesuai tarif yang berlaku."
    ]);
    setNotes("Penawaran harga di atas mencakup dukungan teknis (maintenance) gratis selama 6 bulan pasca serah terima.");
    setIsFormOpen(true);
    setViewingOffering(null);
  };

  const openEditForm = (off: Offering) => {
    setEditingOffering(off);
    setClientId(off.clientId);
    setOfferingNumber(off.offeringNumber);
    setDate(off.date);
    setValidUntil(off.validUntil);
    setItems(off.items);
    setDiscount(off.discount);
    setTaxRate(off.taxRate);
    setStatus(off.status);
    setTerms(off.terms || []);
    setNotes(off.notes || '');
    setIsFormOpen(true);
    setViewingOffering(null);
  };

  const addItemRow = () => {
    if (!itemDesc.trim() || itemQty <= 0 || itemPrice <= 0) {
      alert('Isi keterangan barang/jasa, kuantitas, dan harga satuan dengan benar.');
      return;
    }
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: itemDesc,
      qty: itemQty,
      unitPrice: itemPrice
    };
    setItems(prev => [...prev, newItem]);
    setItemDesc('');
    setItemQty(1);
    setItemPrice(0);
  };

  const removeItemRow = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addTerm = () => {
    if (newTerm.trim()) {
      setTerms(prev => [...prev, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const removeTerm = (index: number) => {
    setTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOffering(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Silakan pilih klien terlebih dahulu.');
      return;
    }
    if (items.length === 0) {
      alert('Paling sedikit harus ada 1 item penawaran.');
      return;
    }

    const payload = {
      clientId,
      offeringNumber,
      date,
      validUntil,
      items,
      discount,
      taxRate,
      status,
      terms,
      notes
    };

    try {
      if (editingOffering) {
        await onUpdateOffering({
          ...editingOffering,
          ...payload
        });
      } else {
        const created = await onAddOffering(payload);
        setViewingOffering(created); // Auto show on success
      }
      handleCloseForm();
    } catch (error: any) {
      alert('Gagal menyimpan penawaran: ' + (error?.message || 'Silakan coba lagi.'));
    }
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus penawaran ${num}?`)) {
      onDeleteOffering(id);
      if (viewingOffering?.id === id) {
        setViewingOffering(null);
      }
    }
  };

  const handleConvert = (off: Offering) => {
    if (confirm(`Konversi penawaran ${off.offeringNumber} ke invoice baru secara otomatis?`)) {
      onConvertOfferingToInvoice(off);
      alert('Penawaran berhasil dikonversi menjadi Invoice baru!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filters
  const filteredOfferings = offerings.filter(o => {
    const client = clients.find(c => c.id === o.clientId);
    const clientName = client ? client.companyName : '';
    const matchSearch = o.offeringNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6" id="offerings-container">
      {/* Dynamic Navigation back for A4 Preview mode */}
      {viewingOffering ? (
        <div className="space-y-6">
          {/* Top view controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm no-print">
            <button
              onClick={() => setViewingOffering(null)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950 transition cursor-pointer"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Penawaran
            </button>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 font-medium mr-1">Status Penawaran:</span>
              <select
                value={viewingOffering.status}
                onChange={(e) => {
                  const updated: Offering = { ...viewingOffering, status: e.target.value as OfferingStatus };
                  onUpdateOffering(updated);
                  setViewingOffering(updated);
                }}
                className="text-xs border border-slate-200 px-2.5 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="Draft">Draft</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>

              <button
                onClick={() => openEditForm(viewingOffering)}
                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md text-xs flex items-center gap-1 transition cursor-pointer bg-white"
              >
                <Edit2 size={13} /> Edit
              </button>
              
              <button
                onClick={() => handleConvert(viewingOffering)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-md text-xs flex items-center gap-1 transition border border-emerald-100/40 cursor-pointer"
              >
                <RefreshCw size={13} /> Konversi Ke Invoice
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Printer size={14} /> Cetak / PDF
              </button>
            </div>
          </div>

          <div className="no-print bg-amber-50 border border-amber-200/50 rounded-md p-3 text-xs text-amber-800 flex items-center gap-2">
            <span>💡 <strong>Tips Ekspor PDF:</strong> Klik tombol "Cetak / PDF", ubah pilihan printer menjadi "Save as PDF" di browser Anda. Centang opsi "Background graphics" jika ada, lalu atur ukuran kertas ke A4 untuk hasil cetak formal terbaik.</span>
          </div>

          {/* Formatted A4 Paper Sheet rendering */}
          <div className="bg-slate-100/50 py-8 px-2 md:px-6 rounded-xl border border-slate-200/60 flex justify-center shadow-inner overflow-x-auto">
            {(() => {
              const client = clients.find(c => c.id === viewingOffering.clientId);
              const { subtotal, taxAmount, grandTotal } = getTotals(viewingOffering.items, viewingOffering.discount, viewingOffering.taxRate);
              return (
                <div className="a4-page print-target" id={`offering-document-${viewingOffering.id}`}>
                  {/* Company Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
                    <div className="space-y-1 text-slate-700">
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-serif">{companySettings.name}</h2>
                      <p className="text-xs leading-relaxed max-w-lg mt-1 font-sans">{companySettings.address}</p>
                      <div className="text-[10px] text-slate-500 font-mono space-y-0.5 pt-1">
                        <p>Email: {companySettings.email} | Telp: {companySettings.phone}</p>
                        <p>Website: {companySettings.website}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between h-full">
                      <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest font-serif border-b-2 border-indigo-600 pb-1 inline-block">PENAWARAN</h1>
                      <div className="text-[10px] text-slate-400 font-mono mt-4">
                        <p>No: {viewingOffering.offeringNumber}</p>
                        <p>Tanggal: {formatIndonesianDate(viewingOffering.date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Document Body */}
                  <div className="mt-8 grid grid-cols-2 gap-8 text-xs text-slate-700">
                    {/* To client details */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Kepada Yth.</span>
                      {client ? (
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-slate-900">{client.companyName}</p>
                          <p className="font-semibold text-slate-600">Up. {client.picName} ({client.picPosition || 'PIC'})</p>
                          <p className="leading-relaxed text-slate-500 max-w-sm">{client.address || '-'}</p>
                          <p className="text-slate-500">Email: {client.email}</p>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">Data klien tidak ditemukan</p>
                      )}
                    </div>
                    {/* Info details */}
                    <div className="text-right space-y-1 flex flex-col justify-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Masa Berlaku</span>
                      <p className="text-slate-800 font-medium">Berlaku Hingga: <span className="font-bold text-slate-900">{formatIndonesianDate(viewingOffering.validUntil)}</span></p>
                      <p className="text-slate-400 text-[10px] italic">Harap merespon sebelum tenggat berakhir</p>
                    </div>
                  </div>

                  {/* Polite Intro */}
                  <div className="mt-8 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold">Dengan hormat,</p>
                    <p className="mt-2 text-justify">
                      Sehubungan dengan rincian kebutuhan pekerjaan yang telah dikoordinasikan sebelumnya, bersama surat ini kami dari <strong>{companySettings.name}</strong> mengajukan proposal penawaran harga pekerjaan/layanan jasa dengan rincian sebagai berikut:
                    </p>
                  </div>

                  {/* Items Table */}
                  <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-semibold">
                          <th className="py-2.5 px-3 text-center w-12">No</th>
                          <th className="py-2.5 px-3">Deskripsi Produk / Layanan Jasa</th>
                          <th className="py-2.5 px-3 text-center w-16">Qty</th>
                          <th className="py-2.5 px-3 text-right w-36">Harga Satuan</th>
                          <th className="py-2.5 px-3 text-right w-36">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {viewingOffering.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/40">
                            <td className="py-2 px-3 text-center font-medium">{idx + 1}</td>
                            <td className="py-2 px-3 text-slate-800 font-medium">{item.description}</td>
                            <td className="py-2 px-3 text-center">{item.qty}</td>
                            <td className="py-2 px-3 text-right">{formatRupiah(item.unitPrice)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-800">{formatRupiah(item.qty * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-72 text-xs text-slate-700 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
                      </div>
                      
                      {viewingOffering.discount > 0 && (
                        <div className="flex justify-between font-medium text-red-600">
                          <span>Potongan Harga (Diskon)</span>
                          <span className="font-semibold">-{formatRupiah(viewingOffering.discount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">PPN ({viewingOffering.taxRate}%)</span>
                        <span className="font-semibold text-slate-800">{formatRupiah(taxAmount)}</span>
                      </div>

                      <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 text-slate-900">
                        <span>Grand Total</span>
                        <span className="text-indigo-600 font-sans">{formatRupiah(grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terbilang Translation */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-md text-xs italic text-slate-600 font-medium">
                    Terbilang: <span className="font-bold text-slate-900 font-sans not-italic">{formatTerbilangRupiah(grandTotal)}</span>
                  </div>

                  {/* Terms & Conditions */}
                  {viewingOffering.terms && viewingOffering.terms.length > 0 && (
                    <div className="mt-8 text-xs text-slate-700 leading-relaxed">
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase tracking-wide">Syarat & Ketentuan Pembayaran:</h3>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-600 font-medium">
                        {viewingOffering.terms.map((term, i) => (
                          <li key={i}>{term}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Closing sentence */}
                  <div className="mt-8 text-xs text-slate-600 leading-relaxed text-justify">
                    Demikian penawaran harga ini kami ajukan. Besar harapan kami untuk dapat menjalin kerja sama yang baik dengan instansi Bapak/Ibu. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
                  </div>

                  {/* Signatures */}
                  <div className="mt-12 flex justify-end text-xs text-slate-700">
                    <div className="text-center w-56 space-y-16">
                      <div>
                        <p className="font-semibold">Hormat Kami,</p>
                        <p className="font-bold text-slate-900">{companySettings.name}</p>
                      </div>
                      
                      <div>
                        <p className="font-bold text-slate-900 underline">{companySettings.signatureName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{companySettings.signaturePosition}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        // Standard Listings view
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Penawaran Perusahaan (Quotation)</h1>
              <p className="text-sm text-slate-500 mt-1">Buat draft proposal komersial, terbitkan penawaran, dan kelola dokumen ekspor PDF.</p>
            </div>
            <button
              id="btn-add-offering"
              onClick={openAddForm}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Buat Penawaran Baru
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-offerings-input"
                type="text"
                placeholder="Cari berdasarkan No. Penawaran atau Klien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          {/* List of Offerings Table */}
          {filteredOfferings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">
              <FileText size={48} className="mx-auto text-slate-300 stroke-1 mb-3" />
              <p className="text-sm">Tidak ada dokumen penawaran harga yang ditemukan.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">No. Penawaran</th>
                      <th className="py-3 px-4 font-semibold">Nama Klien</th>
                      <th className="py-3 px-4 font-semibold">Tanggal Buat</th>
                      <th className="py-3 px-4 font-semibold text-right">Masa Berlaku</th>
                      <th className="py-3 px-4 font-semibold text-right">Nilai Proyek</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOfferings.map(off => {
                      const client = clients.find(c => c.id === off.clientId);
                      const { grandTotal } = getTotals(off.items, off.discount, off.taxRate);
                      return (
                        <tr key={off.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{off.offeringNumber}</td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="font-medium block">{client ? client.companyName : 'Klien Tidak Dikenal'}</span>
                            <span className="text-[10px] text-slate-400">PIC: {client?.picName || '-'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{formatIndonesianDate(off.date)}</td>
                          <td className="py-3.5 px-4 text-right text-slate-500">{formatIndonesianDate(off.validUntil)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatRupiah(grandTotal)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              off.status === 'Disetujui' 
                                ? 'bg-emerald-100 text-emerald-800 font-semibold' 
                                : off.status === 'Ditolak'
                                  ? 'bg-red-100 text-red-800'
                                  : off.status === 'Dikirim'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-slate-100 text-slate-800'
                            }`}>
                              {off.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setViewingOffering(off)}
                                title="Lihat & Cetak PDF"
                                className="px-2 py-1 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 bg-white shadow-xs rounded cursor-pointer text-[11px]"
                              >
                                Lihat PDF
                              </button>
                              <button
                                onClick={() => openEditForm(off)}
                                title="Edit Dokumen"
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(off.id, off.offeringNumber)}
                                title="Hapus Dokumen"
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-semibold text-slate-900">
                {editingOffering ? `Edit Dokumen Penawaran: ${offeringNumber}` : 'Buat Proposal Penawaran Baru'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs text-slate-600">
              
              {/* Row 1: Client Selection & Offering Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Klien (Penerima) <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs"
                  >
                    <option value="" disabled>-- Pilih Klien / Customer --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName} ({c.picName})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Surat Penawaran <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 015/ITN-PNW/VI/2026"
                      value={offeringNumber}
                      onChange={(e) => setOfferingNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setOfferingNumber(generateOfferingNumber())}
                      className="px-2.5 py-2 border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 text-[10px] shrink-0 font-medium cursor-pointer"
                    >
                      Acak No
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Date and Valid Until & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tanggal Terbit</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Masa Berlaku Penawaran</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status Awal</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OfferingStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Dikirim">Dikirim</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Daftar Barang & Layanan Jasa</span>
                
                {/* Current Items List */}
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Belum ada rincian item, isi formulir di bawah ini untuk menambahkan rincian pekerjaan.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-100 shadow-3xs gap-3">
                        <div className="flex-1 space-y-0.5">
                          <p className="font-bold text-slate-800 text-xs">{item.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.qty} Unit x {formatRupiah(item.unitPrice)} = <span className="font-semibold text-slate-700">{formatRupiah(item.qty * item.unitPrice)}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline item input form */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-slate-200">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400 block">Keterangan Barang / Jasa Pekerjaan</label>
                    <input
                      type="text"
                      placeholder="Misal: Pengembangan Modul Akuntansi ERP"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400 block">Kuantitas (Qty)</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400 block">Harga Satuan (Rp)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Harga"
                        value={itemPrice || ''}
                        onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addItemRow}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Discount & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Potongan Harga Diskon Khusus (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Masukkan nominal jika ada diskon"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tarif PPN (%)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 11"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Terms and Conditions Section */}
              <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Syarat & Ketentuan Pembayaran</span>
                
                {terms.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {terms.map((term, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs">
                        <span className="flex-1 font-medium text-slate-600">{index + 1}. {term}</span>
                        <button
                          type="button"
                          onClick={() => removeTerm(index)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer shrink-0 ml-2"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tambahkan syarat pembayaran baru, misal: Pekerjaan dimulai 3 hari setelah DP diterima..."
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={addTerm}
                    className="px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Tambahan (Closing / Garansi)</label>
                <textarea
                  placeholder="Masukkan garansi, cakupan pemeliharaan, dsb..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none text-xs resize-none"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md transition shadow-sm cursor-pointer text-xs"
                >
                  {editingOffering ? 'Simpan Perubahan' : 'Terbitkan Penawaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
