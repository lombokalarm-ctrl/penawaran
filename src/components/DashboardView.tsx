import { Client, Offering, Invoice } from '../types';
import { formatRupiah } from '../utils';
import { Shield, FileText, CheckCircle, TrendingUp, Users, AlertCircle, Clock, ChevronRight } from 'lucide-react';

interface DashboardViewProps {
  clients: Client[];
  offerings: Offering[];
  invoices: Invoice[];
  getTotals: (items: any[], discount: number, taxRate: number) => { subtotal: number; taxAmount: number; grandTotal: number };
  onNavigate: (tab: string, detailId?: string) => void;
}

export default function DashboardView({ clients, offerings, invoices, getTotals, onNavigate }: DashboardViewProps) {
  // Financial Calculations
  let totalRevenue = 0; // Total payments received
  let totalInvoiced = 0; // Total grand total of all invoices
  let totalOutstanding = 0; // Remaining unpaid amount across all invoices
  let totalDraftInvoiced = 0; // Invoiced not yet lunas

  invoices.forEach(inv => {
    const { grandTotal } = getTotals(inv.items, inv.discount, inv.taxRate);
    totalInvoiced += grandTotal;
    
    const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    totalRevenue += paid;
    totalOutstanding += Math.max(0, grandTotal - paid);
  });

  const totalOfferingsCount = offerings.length;
  const approvedOfferingsCount = offerings.filter(o => o.status === 'Disetujui').length;
  const sentOfferingsCount = offerings.filter(o => o.status === 'Dikirim').length;
  
  // Calculate acceptance rate
  const acceptanceRate = totalOfferingsCount > 0 
    ? Math.round((approvedOfferingsCount / totalOfferingsCount) * 100) 
    : 0;

  // Invoice Status Counts
  const unpaidCount = invoices.filter(i => i.status === 'Belum Lunas').length;
  const partialPaidCount = invoices.filter(i => i.status === 'Dibayar Sebagian').length;
  const paidCount = invoices.filter(i => i.status === 'Lunas').length;
  const overdueCount = invoices.filter(i => i.status === 'Jatuh Tempo').length;

  // Get active and upcoming pending invoices
  const pendingInvoices = invoices
    .filter(i => i.status === 'Belum Lunas' || i.status === 'Dibayar Sebagian' || i.status === 'Jatuh Tempo')
    .map(inv => {
      const { grandTotal } = getTotals(inv.items, inv.discount, inv.taxRate);
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = grandTotal - paid;
      const client = clients.find(c => c.id === inv.clientId);
      return {
        ...inv,
        remaining,
        clientName: client ? client.companyName : 'Klien Tidak Dikenal'
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Recent offerings
  const recentOfferings = offerings
    .map(off => {
      const { grandTotal } = getTotals(off.items, off.discount, off.taxRate);
      const client = clients.find(c => c.id === off.clientId);
      return {
        ...off,
        grandTotal,
        clientName: client ? client.companyName : 'Klien Tidak Dikenal'
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard Finansial & Operasional</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status penawaran, penagihan invoice, dan pelacakan arus kas pembayaran secara real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            id="quick-btn-offering"
            onClick={() => onNavigate('penawaran')}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            + Buat Penawaran
          </button>
          <button 
            id="quick-btn-invoice"
            onClick={() => onNavigate('invoices')}
            className="px-4 py-2 text-sm font-medium bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
          >
            + Buat Invoice
          </button>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between" id="kpi-revenue">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan (Lunas)</span>
            <div className="text-2xl font-bold text-emerald-600 font-sans tracking-tight">
              {formatRupiah(totalRevenue)}
            </div>
            <p className="text-xs text-slate-400">Arus kas masuk yang telah diterima</p>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between" id="kpi-outstanding">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sisa Piutang (Unpaid)</span>
            <div className="text-2xl font-bold text-amber-600 font-sans tracking-tight">
              {formatRupiah(totalOutstanding)}
            </div>
            <p className="text-xs text-slate-400">Dana tertunda yang harus ditagih</p>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between" id="kpi-offerings">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Penyetujuan</span>
            <div className="text-2xl font-bold text-indigo-600 font-sans tracking-tight">
              {acceptanceRate}%
            </div>
            <p className="text-xs text-slate-400">{approvedOfferingsCount} dari {totalOfferingsCount} penawaran disetujui</p>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between" id="kpi-clients">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mitra Klien Aktif</span>
            <div className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              {clients.length} Perusahaan
            </div>
            <p className="text-xs text-slate-400">Jumlah klien terdaftar di sistem</p>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Graphs & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Collections Progress (SVG-based donut chart & Status details) */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Status Penagihan Invoice</h2>
            
            {/* Custom SVG Gauge */}
            <div className="flex justify-center my-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress Circle (Paid %) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={totalInvoiced > 0 ? 251.2 - (251.2 * (totalRevenue / totalInvoiced)) : 251.2}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">
                    {totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Tertagih</span>
                </div>
              </div>
            </div>

            {/* Status counts with color codes */}
            <div className="space-y-2.5 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Lunas ({paidCount})
                </span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(invoices.filter(i => i.status === 'Lunas').reduce((sum, i) => sum + getTotals(i.items, i.discount, i.taxRate).grandTotal, 0))}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  Dibayar Sebagian ({partialPaidCount})
                </span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(invoices.filter(i => i.status === 'Dibayar Sebagian').reduce((sum, i) => sum + getTotals(i.items, i.discount, i.taxRate).grandTotal, 0))}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  Belum Lunas ({unpaidCount})
                </span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(invoices.filter(i => i.status === 'Belum Lunas').reduce((sum, i) => sum + getTotals(i.items, i.discount, i.taxRate).grandTotal, 0))}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Jatuh Tempo ({overdueCount})
                </span>
                <span className="font-semibold text-slate-800 text-red-600">
                  {formatRupiah(invoices.filter(i => i.status === 'Jatuh Tempo').reduce((sum, i) => sum + getTotals(i.items, i.discount, i.taxRate).grandTotal, 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total Nilai Tagihan:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(totalInvoiced)}</span>
            </div>
          </div>
        </div>

        {/* Realtime Outstanding Actions (Invoices nearing due date / unpaid) */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-slate-900">Pelacakan Pembayaran Terkini</h2>
              <button 
                onClick={() => onNavigate('invoices')}
                className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Lihat Semua Invoice <ChevronRight size={14} />
              </button>
            </div>

            {pendingInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Shield size={40} className="stroke-1 mb-2 text-slate-300" />
                <p className="text-sm">Semua tagihan berjalan dalam status lunas!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvoices.map(inv => {
                  const percentPaid = Math.round(((getTotals(inv.items, inv.discount, inv.taxRate).grandTotal - inv.remaining) / getTotals(inv.items, inv.discount, inv.taxRate).grandTotal) * 100);
                  
                  return (
                    <div 
                      key={inv.id} 
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-800">{inv.invoiceNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            inv.status === 'Jatuh Tempo' 
                              ? 'bg-red-100 text-red-700' 
                              : inv.status === 'Dibayar Sebagian'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-700'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600">{inv.clientName}</p>
                        <p className="text-[11px] text-slate-400">Tenggat: {inv.dueDate}</p>
                      </div>

                      <div className="sm:text-right space-y-1 flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto">
                        <div className="text-xs text-slate-500 sm:text-right">
                          Sisa Tagihan: <span className="font-bold text-sm text-slate-800 block sm:inline">{formatRupiah(inv.remaining)}</span>
                        </div>
                        {inv.status === 'Dibayar Sebagian' && (
                          <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full" 
                              style={{ width: `${percentPaid}%` }}
                              title={`Terbayar ${percentPaid}%`}
                            ></div>
                          </div>
                        )}
                        <button 
                          onClick={() => onNavigate('invoices', inv.id)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded transition cursor-pointer"
                        >
                          Catat Bayar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            Sistem mencatat piutang jatuh tempo secara otomatis berdasarkan tanggal batas akhir invoice.
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Offerings */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-slate-900">Penawaran Harga Terbaru</h2>
          <button 
            onClick={() => onNavigate('penawaran')}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Lihat Semua Penawaran <ChevronRight size={14} />
          </button>
        </div>

        {recentOfferings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FileText size={40} className="stroke-1 mb-2 text-slate-300" />
            <p className="text-sm">Belum ada penawaran perusahaan yang dibuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">No. Penawaran</th>
                  <th className="py-2.5 px-3 font-semibold">Nama Klien</th>
                  <th className="py-2.5 px-3 font-semibold">Tanggal Pembuatan</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Nilai Penawaran</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOfferings.map(off => (
                  <tr key={off.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">{off.offeringNumber}</td>
                    <td className="py-3 px-3 text-slate-600">{off.clientName}</td>
                    <td className="py-3 px-3 text-slate-500">{off.date}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">{formatRupiah(off.grandTotal)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        off.status === 'Disetujui' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : off.status === 'Ditolak'
                            ? 'bg-red-100 text-red-800'
                            : off.status === 'Dikirim'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-800'
                      }`}>
                        {off.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button 
                        onClick={() => onNavigate('penawaran', off.id)}
                        className="px-2 py-1 text-xs text-slate-600 hover:text-indigo-600 border border-slate-200 rounded hover:border-indigo-200 bg-white shadow-xs cursor-pointer"
                      >
                        Pratinjau / Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
