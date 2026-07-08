import React, { useState } from 'react';
import { Client, Offering, Invoice } from '../types';
import { formatRupiah } from '../utils';
import { Search, Plus, Edit2, Trash2, Mail, Phone, MapPin, User, Building, X, Briefcase, FileText } from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  offerings: Offering[];
  invoices: Invoice[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  getTotals: (items: any[], discount: number, taxRate: number) => { subtotal: number; taxAmount: number; grandTotal: number };
}

export default function ClientsView({
  clients,
  offerings,
  invoices,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  getTotals
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');

  const openAddForm = () => {
    setEditingClient(null);
    setName('');
    setCompanyName('');
    setAddress('');
    setEmail('');
    setPhone('');
    setPicName('');
    setPicPosition('');
    setIsFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompanyName(client.companyName);
    setAddress(client.address);
    setEmail(client.email);
    setPhone(client.phone);
    setPicName(client.picName);
    setPicPosition(client.picPosition);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !picName.trim() || !email.trim()) {
      alert('Nama Perusahaan, Nama PIC, dan Email wajib diisi.');
      return;
    }

    const clientPayload = {
      name: picName, // contact person
      companyName,
      address,
      email,
      phone,
      picName,
      picPosition
    };

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        ...clientPayload
      });
    } else {
      onAddClient(clientPayload);
    }
    handleCloseForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus klien "${name}"? Seluruh data riwayat cetak penawaran/invoice yang merujuk klien ini akan kehilangan referensi profil.`)) {
      onDeleteClient(id);
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.picName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate client statistics (Total offerings, total invoiced, total paid)
  const getClientStats = (clientId: string) => {
    const clientOfferings = offerings.filter(o => o.clientId === clientId);
    const clientInvoices = invoices.filter(i => i.clientId === clientId);

    let totalInvoicedAmount = 0;
    let totalPaidAmount = 0;

    clientInvoices.forEach(inv => {
      const { grandTotal } = getTotals(inv.items, inv.discount, inv.taxRate);
      totalInvoicedAmount += grandTotal;
      totalPaidAmount += inv.payments.reduce((sum, p) => sum + p.amount, 0);
    });

    return {
      offeringsCount: clientOfferings.length,
      invoicesCount: clientInvoices.length,
      totalInvoiced: totalInvoicedAmount,
      totalPaid: totalPaidAmount,
      remaining: Math.max(0, totalInvoicedAmount - totalPaidAmount)
    };
  };

  return (
    <div className="space-y-6" id="clients-container">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Manajemen Mitra Klien</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola direktori pelanggan, detail kontak, dan pantau status transaksi mereka.</p>
        </div>
        <button
          id="btn-add-client"
          onClick={openAddForm}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Tambah Klien Baru
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-clients-input"
            type="text"
            placeholder="Cari berdasarkan nama perusahaan, PIC, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">
          <Building size={48} className="mx-auto text-slate-300 stroke-1 mb-3" />
          <p className="text-sm">Tidak ada klien yang cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map(client => {
            const stats = getClientStats(client.id);
            return (
              <div key={client.id} className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition hover:shadow-sm" id={`client-card-${client.id}`}>
                {/* Card Top / Details */}
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{client.companyName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Terdaftar sejak {client.createdAt}</p>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-1.5 no-print">
                      <button
                        onClick={() => openEditForm(client)}
                        title="Edit Klien"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.companyName)}
                        title="Hapus Klien"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <span>{client.picName} <span className="text-slate-400">({client.picPosition || 'PIC'})</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <a href={`mailto:${client.email}`} className="hover:underline text-indigo-600">{client.email}</a>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Client Trade stats */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <div className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Total Penagihan</div>
                      <div className="font-bold text-slate-800 font-sans mt-0.5">{formatRupiah(stats.totalInvoiced)}</div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{stats.invoicesCount} Invoices</span>
                    </div>
                    <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100/30">
                      <div className="text-emerald-700/70 font-medium text-[10px] uppercase tracking-wider">Sudah Dibayar</div>
                      <div className="font-bold text-emerald-600 font-sans mt-0.5">{formatRupiah(stats.totalPaid)}</div>
                      {stats.remaining > 0 ? (
                        <span className="text-[10px] text-amber-600 block mt-0.5">Sisa: {formatRupiah(stats.remaining)}</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 block mt-0.5">Lunas Sepenuhnya</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer / Document Count summary */}
                <div className="bg-slate-50/60 px-5 py-3 border-t border-slate-100 rounded-b-lg flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" />
                    <span>{stats.offeringsCount} Penawaran</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={12} className="text-slate-400" />
                    <span>{stats.invoicesCount} Invoices</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-semibold text-slate-900">
                {editingClient ? 'Edit Detail Mitra Klien' : 'Tambah Klien Baru'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Perusahaan / Institusi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sejahtera Makmur Abadi"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Lengkap PIC <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siti Rahma"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Jabatan PIC</label>
                  <input
                    type="text"
                    placeholder="Contoh: Head of Procurement"
                    value={picPosition}
                    onChange={(e) => setPicPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Alamat Email Korespondensi <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: siti.rahma@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Contoh: +62 811-XXXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Alamat Lengkap Perusahaan</label>
                <textarea
                  placeholder="Masukkan jalan, blok, gedung, kecamatan, kota, provinsi, dan kode pos..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
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
                  {editingClient ? 'Simpan Perubahan' : 'Simpan Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
