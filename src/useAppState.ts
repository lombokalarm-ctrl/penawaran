import { useState, useEffect } from 'react';
import { User, Client, CompanySettings, Offering, Invoice, OfferingStatus, InvoiceStatus } from './types';

export function useAppState() {
  const [user, setUser] = useState<User | null>({ id: 1, username: 'admin', email: 'admin@apli.my.id' });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || 'admin_token');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Sync token to localStorage on startup
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', 'admin_token');
    }
  }, []);

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    bankName: '',
    bankBranch: '',
    bankAccountNo: '',
    bankAccountName: '',
    taxRate: 11,
    signatureName: '',
    signaturePosition: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Map database response to client-side model (string IDs)
  const mapClient = (c: any): Client => ({
    ...c,
    id: String(c.id),
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''
  });

  const mapOffering = (o: any): Offering => ({
    ...o,
    id: String(o.id),
    clientId: String(o.clientId),
    discount: Number(o.discount) || 0,
    taxRate: Number(o.taxRate) || 11,
    items: (o.items || []).map((item: any) => ({
      ...item,
      id: String(item.id)
    })),
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : ''
  });

  const mapInvoice = (i: any): Invoice => ({
    ...i,
    id: String(i.id),
    clientId: String(i.clientId),
    offeringId: i.offeringId ? String(i.offeringId) : undefined,
    discount: Number(i.discount) || 0,
    taxRate: Number(i.taxRate) || 11,
    items: (i.items || []).map((item: any) => ({
      ...item,
      id: String(item.id)
    })),
    payments: (i.payments || []).map((p: any) => ({
      ...p,
      id: String(p.id)
    })),
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : ''
  });

  // Helper for safe requests with Auth Token
  const request = async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) throw new Error("Not logged in");
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json();
  };

  // Check persisted auth token on startup and whenever token state changes
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token') || 'admin_token';
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || { id: 1, username: 'admin', email: 'admin@apli.my.id' });
        } else {
          setUser({ id: 1, username: 'admin', email: 'admin@apli.my.id' });
        }
      } catch (error) {
        console.error('Failed to verify session token:', error);
        setUser({ id: 1, username: 'admin', email: 'admin@apli.my.id' });
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [token]);

  // Fetch all data from backend when user logs in
  const fetchData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [settingsData, clientsData, offeringsData, invoicesData] = await Promise.all([
        request('/api/company-settings'),
        request('/api/clients'),
        request('/api/offerings'),
        request('/api/invoices')
      ]);

      if (settingsData) {
        setCompanySettings(settingsData);
      }
      setClients((clientsData || []).map(mapClient));
      setOfferings((offeringsData || []).map(mapOffering));
      setInvoices((invoicesData || []).map(mapInvoice));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setClients([]);
      setOfferings([]);
      setInvoices([]);
    }
  }, [user]);

  // Auth actions
  const loginWithGoogle = async () => {
    alert('Google login tidak didukung lagi. Silakan masuk menggunakan form Username/Email dan Password.');
  };

  const loginWithEmail = async (emailOrUsername: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: emailOrUsername, password: pass })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login gagal. Periksa kembali username dan password Anda.');
    }
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const registerWithEmail = async (email: string, pass: string, customUsername?: string) => {
    const username = customUsername || email.split('@')[0];
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registrasi gagal. Email atau Username mungkin sudah digunakan.');
    }
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  // Client actions
  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const saved = await request('/api/clients', {
        method: 'POST',
        body: JSON.stringify(client)
      });
      const mapped = mapClient(saved);
      setClients(prev => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const updateClient = async (updated: Client) => {
    try {
      const saved = await request(`/api/clients/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      const mapped = mapClient(saved);
      setClients(prev => prev.map(c => c.id === mapped.id ? mapped : c));
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await request(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  // Company Settings actions
  const updateCompanySettings = async (settings: CompanySettings) => {
    try {
      const saved = await request('/api/company-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setCompanySettings(saved);
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  };

  // Offering actions
  const addOffering = async (offering: Omit<Offering, 'id' | 'createdAt'>) => {
    try {
      const saved = await request('/api/offerings', {
        method: 'POST',
        body: JSON.stringify(offering)
      });
      const mapped = mapOffering(saved);
      setOfferings(prev => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      console.error('Error adding offering:', error);
      throw error;
    }
  };

  const updateOffering = async (updated: Offering) => {
    try {
      const saved = await request(`/api/offerings/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      const mapped = mapOffering(saved);
      setOfferings(prev => prev.map(o => o.id === mapped.id ? mapped : o));
    } catch (error) {
      console.error('Error updating offering:', error);
      throw error;
    }
  };

  const deleteOffering = async (id: string) => {
    try {
      await request(`/api/offerings/${id}`, {
        method: 'DELETE'
      });
      setOfferings(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting offering:', error);
      throw error;
    }
  };

  // Helper to calculate total amount of line items with tax & discount
  const getTotals = (items: { qty: number; unitPrice: number }[], discount: number, taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxAmount = Math.round(afterDiscount * (taxRate / 100));
    const grandTotal = afterDiscount + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  };

  // Invoice actions
  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'payments'>) => {
    try {
      const payload = {
        ...invoice,
        status: 'Belum Lunas',
        payments: []
      };
      const saved = await request('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const mapped = mapInvoice(saved);
      setInvoices(prev => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (updated: Invoice) => {
    try {
      // Recalculate status based on payments
      const { grandTotal } = getTotals(updated.items, updated.discount, updated.taxRate);
      const totalPaid = updated.payments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus: InvoiceStatus = 'Belum Lunas';
      if (totalPaid >= grandTotal) {
        newStatus = 'Lunas';
      } else if (totalPaid > 0) {
        newStatus = 'Dibayar Sebagian';
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (updated.dueDate < today) {
          newStatus = 'Jatuh Tempo';
        }
      }

      const finalInvoice = {
        ...updated,
        status: newStatus
      };

      const saved = await request(`/api/invoices/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(finalInvoice)
      });
      const mapped = mapInvoice(saved);
      setInvoices(prev => prev.map(i => i.id === mapped.id ? mapped : i));
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await request(`/api/invoices/${id}`, {
        method: 'DELETE'
      });
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  // Convert Offering to Invoice directly (Automated flow)
  const convertOfferingToInvoice = async (offering: Offering) => {
    const yearMonth = new Date().toISOString().split('T')[0].substring(0, 7).replace('-', '/');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `INV/${yearMonth}/${randomNum}`;

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const dueDate = thirtyDaysLater.toISOString().split('T')[0];

    const payload = {
      invoiceNumber,
      offeringId: offering.id,
      date: today,
      dueDate: dueDate,
      clientId: offering.clientId,
      items: [...offering.items],
      discount: offering.discount,
      taxRate: offering.taxRate,
      status: 'Belum Lunas',
      payments: [],
      notes: `Invoice ini dikonversi secara otomatis dari penawaran ${offering.offeringNumber}.`
    };

    try {
      const savedInvoice = await request('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const mappedInvoice = mapInvoice(savedInvoice);
      setInvoices(prev => [mappedInvoice, ...prev]);

      // Also update offering status to 'Disetujui' (Approved) if it wasn't already
      if (offering.status !== 'Disetujui') {
        await updateOffering({
          ...offering,
          status: 'Disetujui'
        });
      }

      return mappedInvoice;
    } catch (error) {
      console.error('Error converting offering to invoice:', error);
      throw error;
    }
  };

  // Add payment to invoice (Incremental payment feature)
  const addPayment = async (invoiceId: string, paymentAmount: number, method: string, note: string, date: string) => {
    const invoice = invoices.find(i => String(i.id) === String(invoiceId));
    if (!invoice) return;

    const newPayment = {
      date: date || new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      method,
      note
    };

    const updatedPayments = [...(invoice.payments || []), newPayment];
    const { grandTotal } = getTotals(invoice.items, invoice.discount, invoice.taxRate);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus: InvoiceStatus = 'Belum Lunas';
    if (totalPaid >= grandTotal) {
      newStatus = 'Lunas';
    } else if (totalPaid > 0) {
      newStatus = 'Dibayar Sebagian';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (invoice.dueDate < today) {
        newStatus = 'Jatuh Tempo';
      }
    }

    const updatedInvoice = {
      ...invoice,
      payments: updatedPayments,
      status: newStatus
    };

    try {
      const saved = await request(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedInvoice)
      });
      setInvoices(prev => prev.map(i => String(i.id) === String(invoiceId) ? mapInvoice(saved) : i));
    } catch (err) {
      console.error("Error saving payment:", err);
    }
  };

  // Delete a single partial payment
  const deletePayment = async (invoiceId: string, paymentId: string) => {
    const invoice = invoices.find(i => String(i.id) === String(invoiceId));
    if (!invoice) return;

    const updatedPayments = (invoice.payments || []).filter(p => String(p.id) !== String(paymentId));
    const { grandTotal } = getTotals(invoice.items, invoice.discount, invoice.taxRate);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus: InvoiceStatus = 'Belum Lunas';
    if (totalPaid >= grandTotal) {
      newStatus = 'Lunas';
    } else if (totalPaid > 0) {
      newStatus = 'Dibayar Sebagian';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (invoice.dueDate < today) {
        newStatus = 'Jatuh Tempo';
      }
    }

    const updatedInvoice = {
      ...invoice,
      payments: updatedPayments,
      status: newStatus
    };

    try {
      const saved = await request(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedInvoice)
      });
      setInvoices(prev => prev.map(i => String(i.id) === String(invoiceId) ? mapInvoice(saved) : i));
    } catch (err) {
      console.error("Error deleting payment:", err);
    }
  };

  return {
    user,
    authLoading,
    dataLoading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
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
    getTotals
  };
}
