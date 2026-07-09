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

  // Email login states
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
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
    const handleEmailAuthSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      setAuthSubmitting(true);
      try {
        if (authMode === 'login') {
          await loginWithEmail(emailInput, passwordInput);
        } else {
          await registerWithEmail(emailInput, passwordInput);
        }
      } catch (err: any) {
        console.error(err);
        let errMsg = err.message || 'Terjadi kesalahan sistem';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          errMsg = 'Email atau password salah';
        } else if (err.code === 'auth/email-already-in-use') {
          errMsg = 'Email sudah terdaftar. Silakan langsung masuk.';
        } else if (err.code === 'auth/weak-password') {
          errMsg = 'Password minimal harus 6 karakter';
        } else if (err.code === 'auth/invalid-email') {
          errMsg = 'Format email tidak valid';
        }
        setAuthError(errMsg);
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

          {/* Toggle Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => { setAuthMethod('google'); setAuthError(null); }}
              className={`py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
                authMethod === 'google' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Auth
            </button>
            <button
              onClick={() => { setAuthMethod('email'); setAuthError(null); }}
              className={`py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
                authMethod === 'email' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Email &amp; Password
            </button>
          </div>

          <div className="border-t border-slate-800/60"></div>

          {authMethod === 'google' ? (
            <div className="space-y-4">
              <div className="text-sm text-slate-300 text-center leading-relaxed">
                Selamat datang di Portal Administrasi Penawaran &amp; Invoice. Masuk menggunakan Google Auth secara instan.
              </div>

              {/* Helpful message about unauthorized-domain */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 leading-relaxed space-y-1">
                <span className="font-bold">Tips untuk Domain Kustom:</span>
                <p>
                  Jika Anda menggunakan domain kustom dan melihat error <code className="bg-amber-950/40 px-1 py-0.5 rounded text-amber-200">auth/unauthorized-domain</code>, silakan tambahkan domain Anda ke daftar "Authorized Domains" di Firebase Console, atau beralih ke tab <span className="font-semibold text-white">Email &amp; Password</span> di atas untuk langsung masuk tanpa pengaturan domain.
                </p>
              </div>

              <button
                id="google-signin-btn"
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold px-4 py-3 rounded-lg text-sm shadow-md transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Masuk dengan Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              <div className="text-center">
                <h2 className="text-sm font-bold text-slate-300">
                  {authMode === 'login' ? 'Masuk ke Sistem' : 'Buat Akun Baru'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {authMode === 'login' ? 'Gunakan email & password terdaftar' : 'Daftarkan email Anda sebagai administrator'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-medium">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@perusahaan.com"
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
          )}

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
