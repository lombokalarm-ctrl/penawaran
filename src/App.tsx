import { useState, FormEvent } from 'react';
import { useAppState } from './useAppState';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import OfferingsView from './components/OfferingsView';
import InvoicesView from './components/InvoicesView';
import CompanySettingsView from './components/CompanySettingsView';
import { Shield, LayoutDashboard, FileText, FileSpreadsheet, Users, Settings, Landmark as BankIcon, LogOut, User as UserIcon, Loader2 } from 'lucide-react';

export default function App() {
  const {
    user,
    authLoading,
    dataLoading,
    loginWithGoogle,
    logout,
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
    getTotals,
    loginWithEmail,
    registerWithEmail
  } = useAppState();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [routedDetailId, setRoutedDetailId] = useState<string | null>(null);

  // Custom login states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

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

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <h2 className="text-lg font-bold tracking-tight font-serif text-slate-200">Nusantara Finansial</h2>
          <p className="text-xs text-slate-400 font-mono">Memuat sistem keamanan...</p>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    const handleAuthSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      setAuthSubmitting(true);
      try {
        if (authMode === 'login') {
          // emailInput is used for either username or email in login mode
          await loginWithEmail(emailInput, passwordInput);
        } else {
          await registerWithEmail(emailInput, passwordInput, usernameInput);
        }
      } catch (err: any) {
        console.error(err);
        setAuthError(err.message || 'Terjadi kesalahan sistem');
      } finally {
        setAuthSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <BankIcon className="text-indigo-500" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight font-serif mt-4">Nusantara Finansial</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest font-mono">PT Inovasi Teknologi Nusantara</p>
          </div>

          <div className="border-t border-slate-800/60"></div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-300">
                {authMode === 'login' ? 'Masuk ke Sistem' : 'Buat Akun Baru'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {authMode === 'login' ? 'Gunakan username/email & password terdaftar' : 'Daftarkan email & username Anda sebagai administrator'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="admin_nusantara"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition-all text-white placeholder-slate-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  {authMode === 'login' ? 'Username atau Email' : 'Email'}
                </label>
                <input
                  type={authMode === 'login' ? 'text' : 'email'}
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={authMode === 'login' ? 'Masukkan username atau email' : 'nama@perusahaan.com'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition-all text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition-all text-white placeholder-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
            >
              {authSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={14} />
                  Memproses...
                </>
              ) : (
                authMode === 'login' ? 'Masuk Sekarang' : 'Daftar & Masuk'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError(null);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-4"
              >
                {authMode === 'login' ? 'Belum punya akun? Daftar gratis' : 'Sudah punya akun? Masuk di sini'}
              </button>
            </div>
          </form>

          <div className="text-center text-[10px] text-slate-500 font-mono">
            Sistem Database Cloud PostgreSQL Aktif &amp; Terlindungi
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 animate-fade-in" id="main-app-shell">
      {/* Top Main Header (Hidden on Print) */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-sm font-extrabold tracking-tight font-serif">Nusantara Finansial</h1>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest font-mono">PT Inovasi Teknologi Nusantara</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
              <UserIcon size={14} className="text-indigo-400" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs transition cursor-pointer"
            >
              <LogOut size={13} />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6 relative">
        {dataLoading && (
          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg shadow-md border border-slate-200">
              <Loader2 className="animate-spin text-indigo-600" size={18} />
              <span className="text-xs font-semibold text-slate-700">Menyinkronkan data PostgreSQL...</span>
            </div>
          </div>
        )}

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
              <span>Proteksi Cloud PostgreSQL Aktif</span>
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
          SISTEM PORTAL NUSANTARA FINANSIAL v1.4.0 • SEMUA DATA TERSIMPAN DAN TERSINKRONISASI SECARA AMAN DI CLOUD POSTGRESQL
        </div>
      </footer>
    </div>
  );
}
