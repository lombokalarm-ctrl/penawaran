import { useState } from 'react';
import { useAppState } from './useAppState';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import OfferingsView from './components/OfferingsView';
import InvoicesView from './components/InvoicesView';
import CompanySettingsView from './components/CompanySettingsView';
import { Shield, LayoutDashboard, FileText, FileSpreadsheet, Users, Settings, Landmark, Landmark as BankIcon } from 'lucide-react';

export default function App() {
  const {
    companySettings,
    clients,
    offerings,
    invoices,
    updateCompanySettings,
    addClient,
    updateClient,
    deleteClient,
    addOffering,
    updateOffering,
    deleteOffering,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    convertOfferingToInvoice,
    addPayment,
    deletePayment,
    getTotals
  } = useAppState();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [routedDetailId, setRoutedDetailId] = useState<string | null>(null);

  // Quick navigation helper to hop between tabs
  const handleNavigate = (tab: string, detailId?: string) => {
    setActiveTab(tab);
    if (detailId) {
      setRoutedDetailId(detailId);
    } else {
      setRoutedDetailId(null);
    }
  };

  const handleClearActiveId = () => {
    setRoutedDetailId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="main-app-shell">
      {/* Top Main Header (Hidden on Print) */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-sm font-extrabold tracking-tight font-serif">Nusantara Finansial</h1>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest font-mono">PT Inovasi Teknologi Nusantara</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-medium">
            <BankIcon size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">Portal Administrasi Penawaran & Invoice</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Left Side Sidebar Navigation (Hidden on Print) */}
        <aside className="w-full md:w-64 shrink-0 space-y-2 no-print">
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2 block">Menu Administrasi</span>
            
            {/* Nav 1: Dashboard */}
            <button
              id="nav-dashboard"
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard Utama
            </button>

            {/* Nav 2: Offerings */}
            <button
              id="nav-offerings"
              onClick={() => handleNavigate('penawaran')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'penawaran'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} />
                Penawaran Perusahaan
              </div>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] group-hover:bg-slate-200">
                {offerings.length}
              </span>
            </button>

            {/* Nav 3: Invoices */}
            <button
              id="nav-invoices"
              onClick={() => handleNavigate('invoices')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={16} />
                Sistem Invoice
              </div>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                {invoices.length}
              </span>
            </button>

            {/* Nav 4: Clients */}
            <button
              id="nav-clients"
              onClick={() => handleNavigate('klien')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'klien'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} />
                Manajemen Klien
              </div>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                {clients.length}
              </span>
            </button>

            <div className="border-t border-slate-100 my-2"></div>

            {/* Nav 5: Settings */}
            <button
              id="nav-settings"
              onClick={() => handleNavigate('pengaturan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={16} />
              Pengaturan Profil
            </button>
          </div>

          {/* Micro stats banner */}
          <div className="bg-indigo-900/5 border border-indigo-900/10 rounded-lg p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lisensi Keamanan</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
              <Shield size={14} className="text-indigo-600 shrink-0" />
              <span>Proteksi Data Lokal Aktif</span>
            </div>
          </div>
        </aside>

        {/* Right Workspace (Expands on Print) */}
        <main className="flex-1 print-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              clients={clients}
              offerings={offerings}
              invoices={invoices}
              getTotals={getTotals}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'penawaran' && (
            <OfferingsView
              clients={clients}
              companySettings={companySettings}
              offerings={offerings}
              activeOfferingId={routedDetailId}
              onAddOffering={addOffering}
              onUpdateOffering={updateOffering}
              onDeleteOffering={deleteOffering}
              onConvertOfferingToInvoice={convertOfferingToInvoice}
              getTotals={getTotals}
              onClearActiveId={handleClearActiveId}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              clients={clients}
              companySettings={companySettings}
              invoices={invoices}
              activeInvoiceId={routedDetailId}
              onAddInvoice={addInvoice}
              onUpdateInvoice={updateInvoice}
              onDeleteInvoice={deleteInvoice}
              onAddPayment={addPayment}
              onDeletePayment={deletePayment}
              getTotals={getTotals}
              onClearActiveId={handleClearActiveId}
            />
          )}

          {activeTab === 'klien' && (
            <ClientsView
              clients={clients}
              offerings={offerings}
              invoices={invoices}
              onAddClient={addClient}
              onUpdateClient={updateClient}
              onDeleteClient={deleteClient}
              getTotals={getTotals}
            />
          )}

          {activeTab === 'pengaturan' && (
            <CompanySettingsView
              settings={companySettings}
              onUpdateSettings={updateCompanySettings}
            />
          )}
        </main>
      </div>

      {/* Corporate Simple Footer (Hidden on Print) */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[10px] text-slate-400 font-mono font-medium">
          SISTEM PORTAL NUSANTARA FINANSIAL v1.4.0 • SEMUA DATA TERSIMPAN DAN TERSINKRONISASI SECARA LOKAL
        </div>
      </footer>
    </div>
  );
}
