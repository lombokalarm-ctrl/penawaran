import React, { useState, useEffect } from 'react';
import { Client, CompanySettings, Invoice, LineItem, Payment, InvoiceStatus } from '../types';
import { formatRupiah, formatIndonesianDate, formatTerbilangRupiah } from '../utils';
import { Search, Plus, Trash2, Edit2, FileText, Printer, CheckCircle, Clock, X, ArrowLeft, CreditCard, Calendar, Landmark, Coins, Receipt } from 'lucide-react';

interface InvoicesViewProps {
  clients: Client[];
  companySettings: CompanySettings;
  invoices: Invoice[];
  activeInvoiceId: string | null;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'payments'>) => Invoice;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onAddPayment: (invoiceId: string, amount: number, method: string, note: string, date: string) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
  getTotals: (items: any[], discount: number, taxRate: number) => { subtotal: number; taxAmount: number; grandTotal: number };
  onClearActiveId: () => void;
}

export default function InvoicesView({
  clients,
  companySettings,
  invoices,
  activeInvoiceId,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddPayment,
  onDeletePayment,
  getTotals,
  onClearActiveId
}: InvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Incremental Payment Form Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [payNote, setPayNote] = useState('');
  const [payDate, setPayDate] = useState('');

  // Routing with active ID on clicks from Dashboard
  useEffect(() => {
    if (activeInvoiceId) {
      const found = invoices.find(i => i.id === activeInvoiceId);
      if (found) {
        setViewingInvoice(found);
      }
      onClearActiveId(); // Clear once routed
    }
  }, [activeInvoiceId, invoices]);

  // Sync viewing invoice when details change (e.g. on adding payments)
  useEffect(() => {
    if (viewingInvoice) {
      const fresh = invoices.find(i => i.id === viewingInvoice.id);
      if (fresh) {
        setViewingInvoice(fresh);
      }
    }
  }, [invoices]);

  // Form states
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(companySettings.taxRate || 11);
  const [notes, setNotes] = useState('');

  // Item form state
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  const generateInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const sequence = Math.floor(1000 + Math.random() * 9000); // Random series to match realistic codes
    return `INV/${year}/${month}/${sequence}`;
  };

  const openAddForm = () => {
    setEditingInvoice(null);
    setClientId(clients[0]?.id || '');
    setInvoiceNumber(generateInvoiceNumber());
    
    const todayStr = new Date().toISOString().split('T')[0];
    setDate(todayStr);
    
    const dueStr = new Date();
    dueStr.setDate(dueStr.getDate() + 30);
    setDueDate(dueStr.toISOString().split('T')[0]);

    setItems([]);
    setDiscount(0);
    setTaxRate(companySettings.taxRate);
    setNotes("Pembayaran penuh ditunggu paling lambat 30 hari dari tanggal penagihan invoice ini.");
    setIsFormOpen(true);
    setViewingInvoice(null);
  };

  const openEditForm = (inv: Invoice) => {
    setEditingInvoice(inv);
    setClientId(inv.clientId);
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date);
    setDueDate(inv.dueDate);
    setItems(inv.items);
    setDiscount(inv.discount);
    setTaxRate(inv.taxRate);
    setNotes(inv.notes || '');
    setIsFormOpen(true);
    setViewingInvoice(null);
  };

  const addItemRow = () => {
    if (!itemDesc.trim() || itemQty <= 0 || itemPrice <= 0) {
      alert('Isi rincian penagihan, kuantitas, dan harga satuan dengan benar.');
      return;
    }
    const newItem: LineItem = {
      id: `invitem-${Date.now()}`,
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

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingInvoice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Silakan pilih klien penerima invoice.');
      return;
    }
    if (items.length === 0) {
      alert('Paling sedikit harus ada 1 rincian item penagihan.');
      return;
    }

    const payload = {
      clientId,
      invoiceNumber,
      date,
      dueDate,
      items,
      discount,
      taxRate,
      notes
    };

    if (editingInvoice) {
      onUpdateInvoice({
        ...editingInvoice,
        ...payload
      });
    } else {
      const created = onAddInvoice(payload);
      setViewingInvoice(created); // Auto open viewing mode
    }
    handleCloseForm();
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus invoice ${num}? Semua catatan cicilan pembayaran akan ikut terhapus.`)) {
      onDeleteInvoice(id);
      if (viewingInvoice?.id === id) {
        setViewingInvoice(null);
      }
    }
  };

  // Payment incremental handlers
  const openPaymentModal = () => {
    if (!viewingInvoice) return;
    const { grandTotal } = getTotals(viewingInvoice.items, viewingInvoice.discount, viewingInvoice.taxRate);
    const paid = viewingInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = grandTotal - paid;

    setPayAmount(remaining); // Default to pay full remaining
    setPayMethod('Transfer Bank');
    setPayNote('');
    setPayDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingInvoice) return;
    if (payAmount <= 0) {
      alert('Jumlah nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    const { grandTotal } = getTotals(viewingInvoice.items, viewingInvoice.discount, viewingInvoice.taxRate);
    const paid = viewingInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = grandTotal - paid;

    if (payAmount > remaining) {
      if (!confirm(`Peringatan: Nominal pembayaran (Rp ${payAmount.toLocaleString()}) melebihi sisa tagihan (Rp ${remaining.toLocaleString()}). Tetap masukkan pembayaran?`)) {
        return;
      }
    }

    onAddPayment(viewingInvoice.id, payAmount, payMethod, payNote, payDate);
    setIsPaymentModalOpen(false);
  };

  const handlePaymentDelete = (paymentId: string) => {
    if (!viewingInvoice) return;
    if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi pembayaran ini? Sisa tagihan dan status invoice akan dihitung ulang secara otomatis.')) {
      onDeletePayment(viewingInvoice.id, paymentId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filters
  const filteredInvoices = invoices.filter(i => {
    const client = clients.find(c => c.id === i.clientId);
    const clientName = client ? client.companyName : '';
    const matchSearch = i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6" id="invoices-container">
      {/* Top Navigation or Sheet Viewer */}
      {viewingInvoice ? (
        <div className="space-y-6">
          {/* Top view controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm no-print">
            <button
              onClick={() => setViewingInvoice(null)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950 transition cursor-pointer font-sans"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Invoice
            </button>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={openPaymentModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <CreditCard size={13} /> + Catat Pembayaran Bertahap
              </button>

              <button
                onClick={() => openEditForm(viewingInvoice)}
                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md text-xs flex items-center gap-1 transition bg-white cursor-pointer"
              >
                <Edit2 size={13} /> Edit
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Printer size={14} /> Cetak Invoice / PDF
              </button>
            </div>
          </div>

          {/* Formatted A4 Invoice Sheet Rendering */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* The Document A4 Sheet Paper (takes 2/3 space) */}
            <div className="xl:col-span-2 bg-slate-100/50 py-8 px-2 md:px-4 rounded-xl border border-slate-200/60 flex justify-center shadow-inner overflow-x-auto">
              {(() => {
                const client = clients.find(c => c.id === viewingInvoice.clientId);
                const { subtotal, taxAmount, grandTotal } = getTotals(viewingInvoice.items, viewingInvoice.discount, viewingInvoice.taxRate);
                const paid = viewingInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = Math.max(0, grandTotal - paid);
                return (
                  <div className="a4-page print-target" id={`invoice-document-${viewingInvoice.id}`}>
                    {/* Stamp Indicator / Formal status badge */}
                    <div className="absolute right-8 top-20 border-3 px-4 py-1 rounded text-sm font-black uppercase tracking-widest select-none -rotate-12 z-10 hidden print:block" style={{
                      color: viewingInvoice.status === 'Lunas' ? '#10b981' : viewingInvoice.status === 'Dibayar Sebagian' ? '#3b82f6' : viewingInvoice.status === 'Jatuh Tempo' ? '#ef4444' : '#64748b',
                      borderColor: viewingInvoice.status === 'Lunas' ? '#10b981' : viewingInvoice.status === 'Dibayar Sebagian' ? '#3b82f6' : viewingInvoice.status === 'Jatuh Tempo' ? '#ef4444' : '#64748b'
                    }}>
                      {viewingInvoice.status}
                    </div>

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
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest font-serif border-b-2 border-indigo-600 pb-1 inline-block">INVOICE</h1>
                        <div className="text-[10px] text-slate-400 font-mono mt-4">
                          <p>No: {viewingInvoice.invoiceNumber}</p>
                          <p>Tanggal: {formatIndonesianDate(viewingInvoice.date)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Billing address row */}
                    <div className="mt-8 grid grid-cols-2 gap-8 text-xs text-slate-700">
                      {/* Client bill to */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ditujukan Kepada:</span>
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
                      <div className="text-right space-y-1.5 flex flex-col justify-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Informasi Jatuh Tempo</span>
                        <p className="text-slate-800 font-medium">Batas Waktu: <span className="font-bold text-red-600">{formatIndonesianDate(viewingInvoice.dueDate)}</span></p>
                        {viewingInvoice.offeringId && (
                          <p className="text-[10px] text-slate-400">Referensi Penawaran ID: {viewingInvoice.offeringId.replace('offering-', '')}</p>
                        )}
                      </div>
                    </div>

                    {/* Invoice items table */}
                    <div className="mt-8 border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-semibold">
                            <th className="py-2.5 px-3 text-center w-12">No</th>
                            <th className="py-2.5 px-3">Uraian Tagihan Pekerjaan / Produk</th>
                            <th className="py-2.5 px-3 text-center w-16">Qty</th>
                            <th className="py-2.5 px-3 text-right w-36">Harga Satuan</th>
                            <th className="py-2.5 px-3 text-right w-36">Total Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {viewingInvoice.items.map((item, idx) => (
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

                    {/* Calculations breakdown & Payments breakdown */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Bank Account / Payment details (Left column) */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800 text-xs block uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <Landmark size={14} className="text-slate-500" /> Metode Pembayaran Transfer:
                        </span>
                        <div className="space-y-1 font-medium">
                          <p>Nama Bank: <span className="font-bold text-slate-800">{companySettings.bankName}</span></p>
                          <p>Cabang: <span className="text-slate-800">{companySettings.bankBranch}</span></p>
                          <p>No. Rekening: <span className="font-bold text-slate-900 font-mono text-xs">{companySettings.bankAccountNo}</span></p>
                          <p>Atas Nama: <span className="font-bold text-slate-800">{companySettings.bankAccountName}</span></p>
                        </div>
                      </div>

                      {/* Math ledger (Right column) */}
                      <div className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
                        </div>

                        {viewingInvoice.discount > 0 && (
                          <div className="flex justify-between font-medium text-red-600">
                            <span>Diskon</span>
                            <span className="font-semibold">-{formatRupiah(viewingInvoice.discount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">PPN ({viewingInvoice.taxRate}%)</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(taxAmount)}</span>
                        </div>

                        <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 text-slate-900">
                          <span>Total Tagihan (Grand Total)</span>
                          <span className="font-sans text-slate-900">{formatRupiah(grandTotal)}</span>
                        </div>

                        {/* Real-time Progressive Deductions */}
                        <div className="flex justify-between text-xs font-semibold text-emerald-600 bg-emerald-50/40 p-1.5 rounded">
                          <span>Sudah Dibayar (Bertahap)</span>
                          <span>{formatRupiah(paid)}</span>
                        </div>

                        <div className="flex justify-between text-xs font-bold text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100/30">
                          <span>SISA PEMBAYARAN</span>
                          <span className="font-sans text-amber-800 text-sm">{formatRupiah(remaining)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Indonesian "Terbilang" translate */}
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-md text-xs italic text-slate-600 font-medium">
                      Terbilang (Sisa Tagihan): <span className="font-bold text-slate-900 font-sans not-italic">{formatTerbilangRupiah(remaining)}</span>
                    </div>

                    {/* Integrated Payment installments table PRINT ONLY */}
                    {viewingInvoice.payments && viewingInvoice.payments.length > 0 && (
                      <div className="mt-8 text-xs text-slate-700 print:block">
                        <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase tracking-wide">Rincian Transaksi Pembayaran Bertahap:</h3>
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="py-1 px-1 font-bold">No</th>
                              <th className="py-1 px-1 font-bold">Tanggal</th>
                              <th className="py-1 px-1 font-bold">Metode</th>
                              <th className="py-1 px-1 font-bold">Keterangan / Catatan</th>
                              <th className="py-1 px-1 font-bold text-right">Jumlah Nominal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {viewingInvoice.payments.map((p, index) => (
                              <tr key={p.id}>
                                <td className="py-1 px-1 font-medium">{index + 1}</td>
                                <td className="py-1 px-1">{formatIndonesianDate(p.date)}</td>
                                <td className="py-1 px-1">{p.method}</td>
                                <td className="py-1 px-1 italic">{p.note || '-'}</td>
                                <td className="py-1 px-1 text-right font-bold text-slate-800">{formatRupiah(p.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Footer terms */}
                    {viewingInvoice.notes && (
                      <div className="mt-8 text-[11px] text-slate-500 leading-relaxed italic text-justify">
                        * Catatan: {viewingInvoice.notes}
                      </div>
                    )}

                    {/* Signatory */}
                    <div className="mt-12 flex justify-between items-end text-xs text-slate-700">
                      <div className="text-center w-48 space-y-16">
                        <p className="font-semibold text-slate-400">Penerima Kerja,</p>
                        <div className="border-b border-slate-200 w-36 mx-auto"></div>
                      </div>
                      
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

            {/* Sidebar Controller: payment installments input ledger (takes 1/3 space) */}
            <div className="no-print bg-white rounded-lg border border-slate-200 p-5 space-y-5 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Receipt size={16} className="text-slate-600" /> Arus Kas Masuk Bertahap
                </h2>
                <p className="text-xs text-slate-500 mt-1">Invoice ini mendukung pembayaran termin atau cicilan berulang. Catat cicilan baru di bawah ini.</p>
              </div>

              {/* Installments Ledger list */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Transaksi ({viewingInvoice.payments.length})</span>
                {viewingInvoice.payments.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded text-slate-400 text-xs italic">
                    Belum ada dana masuk untuk tagihan ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {viewingInvoice.payments.map((p, index) => (
                      <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded flex flex-col gap-1 text-xs relative group">
                        <button
                          onClick={() => handlePaymentDelete(p.id)}
                          className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Hapus pembayaran"
                        >
                          <X size={12} />
                        </button>
                        <div className="flex justify-between items-center pr-5">
                          <span className="font-bold text-slate-800 font-sans">{formatRupiah(p.amount)}</span>
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] rounded font-semibold uppercase">{p.method}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Bayar: {formatIndonesianDate(p.date)}</p>
                        {p.note && <p className="text-[11px] text-slate-500 italic mt-0.5">"{p.note}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Big Action Button to record payment */}
              <button
                onClick={openPaymentModal}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Coins size={14} /> Catat Cicilan Pembayaran
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Standard Listings view
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Sistem Invoice Penagihan</h1>
              <p className="text-sm text-slate-500 mt-1">Kelola tagihan, pantau cicilan bertahap, sisa sisa piutang, dan cetak invoice.</p>
            </div>
            <button
              id="btn-add-invoice"
              onClick={openAddForm}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Buat Invoice Baru
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-invoices-input"
                type="text"
                placeholder="Cari berdasarkan nomor invoice atau klien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                id="invoice-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="Dibayar Sebagian">Dibayar Sebagian</option>
                <option value="Lunas">Lunas</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">
              <FileText size={48} className="mx-auto text-slate-300 stroke-1 mb-3" />
              <p className="text-sm">Tidak ada dokumen invoice penagihan yang ditemukan.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">No. Invoice</th>
                      <th className="py-3 px-4 font-semibold">Nama Klien</th>
                      <th className="py-3 px-4 font-semibold">Tgl Terbit</th>
                      <th className="py-3 px-4 font-semibold text-right">Tgl Jatuh Tempo</th>
                      <th className="py-3 px-4 font-semibold text-right">Total Tagihan</th>
                      <th className="py-3 px-4 font-semibold text-right">Terbayar (Sisa)</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map(inv => {
                      const client = clients.find(c => c.id === inv.clientId);
                      const { grandTotal } = getTotals(inv.items, inv.discount, inv.taxRate);
                      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                      const remaining = Math.max(0, grandTotal - paid);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="font-medium block">{client ? client.companyName : 'Klien Tidak Dikenal'}</span>
                            <span className="text-[10px] text-slate-400">PIC: {client?.picName || '-'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{formatIndonesianDate(inv.date)}</td>
                          <td className="py-3.5 px-4 text-right text-slate-500">{formatIndonesianDate(inv.dueDate)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatRupiah(grandTotal)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-bold text-emerald-600 block">{formatRupiah(paid)}</span>
                            {remaining > 0 ? (
                              <span className="text-[10px] text-amber-600 font-semibold">Sisa: {formatRupiah(remaining)}</span>
                            ) : (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-black uppercase">Lunas</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.status === 'Lunas' 
                                ? 'bg-emerald-100 text-emerald-800 font-bold' 
                                : inv.status === 'Jatuh Tempo'
                                  ? 'bg-red-100 text-red-800'
                                  : inv.status === 'Dibayar Sebagian'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                title="Lihat & Catat Bayar"
                                className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 bg-white shadow-xs rounded cursor-pointer text-[11px]"
                              >
                                Detail / Bayar
                              </button>
                              <button
                                onClick={() => openEditForm(inv)}
                                title="Edit Dokumen"
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
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

      {/* Progressive Payment Modal form */}
      {isPaymentModalOpen && viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden flex flex-col text-sm text-slate-700">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <Coins size={16} className="text-emerald-600" /> Catat Cicilan Pembayaran
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body form */}
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200/50 p-3 rounded text-xs text-amber-800 space-y-1">
                <p>No. Invoice: <strong className="font-mono">{viewingInvoice.invoiceNumber}</strong></p>
                <p>Sisa Tagihan Maksimal: <strong>{formatRupiah(getTotals(viewingInvoice.items, viewingInvoice.discount, viewingInvoice.taxRate).grandTotal - viewingInvoice.payments.reduce((sum, p) => sum + p.amount, 0))}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nominal Pembayaran (Rp) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tanggal Bayar</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Metode Pembayaran</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="Cek / Giro">Cek / Giro</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Keterangan / Catatan Transaksi</label>
                <input
                  type="text"
                  placeholder="Misal: Pelunasan DP 30% atau Cicilan Termin 2"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Modal actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 font-medium rounded hover:bg-slate-50 transition text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition shadow-xs text-xs cursor-pointer"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Creator Form (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-semibold text-slate-900">
                {editingInvoice ? `Edit Invoice: ${invoiceNumber}` : 'Buat Invoice Baru'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs text-slate-600 text-sm">
              
              {/* Row 1: Client Selection & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Klien (Penerima Tagihan) <span className="text-red-500">*</span></label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Invoice Penagihan <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: INV/2026/06/001"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setInvoiceNumber(generateInvoiceNumber())}
                      className="px-2.5 py-2 border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 text-[10px] shrink-0 font-medium cursor-pointer"
                    >
                      Acak No
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Date and Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tanggal Terbit Invoice</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tenggat Pembayaran (Due Date)</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-4 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Daftar Item Penagihan</span>
                
                {/* Current Items List */}
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Belum ada rincian item, isi formulir di bawah ini untuk menambahkan rincian penagihan.</p>
                ) : (
                  <div className="space-y-2 max-h-42 overflow-y-auto pr-1">
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
                    <label className="text-[9px] font-semibold text-slate-400 block">Keterangan Barang / Jasa Tagihan</label>
                    <input
                      type="text"
                      placeholder="Misal: Pembayaran Uang Muka DP 30% ERP"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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

              {/* Notes */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Invoice (Catatan bank / Petunjuk lunas)</label>
                <textarea
                  placeholder="Masukkan instruksi khusus, misal: Bukti pembayaran mohon dikirimkan via email..."
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
                  {editingInvoice ? 'Simpan Perubahan' : 'Terbitkan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
