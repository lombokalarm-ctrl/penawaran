import { useState, useEffect } from 'react';
import { Client, CompanySettings, Offering, Invoice, Payment, OfferingStatus, InvoiceStatus } from './types';
import { initialCompanySettings, initialClients, initialOfferings, initialInvoices } from './sampleData';

export function useAppState() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('com_settings');
    return saved ? JSON.parse(saved) : initialCompanySettings;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('com_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [offerings, setOfferings] = useState<Offering[]>(() => {
    const saved = localStorage.getItem('com_offerings');
    return saved ? JSON.parse(saved) : initialOfferings;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('com_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  // Save to localstorage on changes
  useEffect(() => {
    localStorage.setItem('com_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('com_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('com_offerings', JSON.stringify(offerings));
  }, [offerings]);

  useEffect(() => {
    localStorage.setItem('com_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Client actions
  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (updated: Client) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    // Optionally clean up or alert about orphaned offerings/invoices
  };

  // Company Settings actions
  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
  };

  // Offering actions
  const addOffering = (offering: Omit<Offering, 'id' | 'createdAt'>) => {
    const newOffering: Offering = {
      ...offering,
      id: `offering-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOfferings(prev => [newOffering, ...prev]);
    return newOffering;
  };

  const updateOffering = (updated: Offering) => {
    setOfferings(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const deleteOffering = (id: string) => {
    setOfferings(prev => prev.filter(o => o.id !== id));
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
  const addInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'payments'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: `invoice-${Date.now()}`,
      status: 'Belum Lunas',
      payments: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (updated: Invoice) => {
    // Recalculate status based on payments
    const { grandTotal } = getTotals(updated.items, updated.discount, updated.taxRate);
    const totalPaid = updated.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, grandTotal - totalPaid);

    let newStatus: InvoiceStatus = 'Belum Lunas';
    if (totalPaid >= grandTotal) {
      newStatus = 'Lunas';
    } else if (totalPaid > 0) {
      newStatus = 'Dibayar Sebagian';
    } else {
      // Check if past due date
      const today = new Date().toISOString().split('T')[0];
      if (updated.dueDate < today) {
        newStatus = 'Jatuh Tempo';
      }
    }

    const finalInvoice: Invoice = {
      ...updated,
      status: newStatus
    };

    setInvoices(prev => prev.map(i => i.id === finalInvoice.id ? finalInvoice : i));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  // Convert Offering to Invoice directly (Automated flow)
  const convertOfferingToInvoice = (offering: Offering) => {
    // Generate Invoice number automatically
    const yearMonth = new Date().toISOString().split('T')[0].substring(0, 7).replace('-', '/');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `INV/${yearMonth}/${randomNum}`;

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const dueDate = thirtyDaysLater.toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: `invoice-${Date.now()}`,
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
      notes: `Invoice ini dikonversi secara otomatis dari penawaran ${offering.offeringNumber}.`,
      createdAt: today
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Also update offering status to 'Disetujui' (Approved) if it wasn't already
    if (offering.status !== 'Disetujui') {
      updateOffering({
        ...offering,
        status: 'Disetujui'
      });
    }

    return newInvoice;
  };

  // Add payment to invoice (Incremental payment feature)
  const addPayment = (invoiceId: string, paymentAmount: number, method: string, note: string, date: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      method,
      note
    };

    const updatedPayments = [...invoice.payments, newPayment];
    const { grandTotal } = getTotals(invoice.items, invoice.discount, invoice.taxRate);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, grandTotal - totalPaid);

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

    const updatedInvoice: Invoice = {
      ...invoice,
      payments: updatedPayments,
      status: newStatus
    };

    setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i));
  };

  // Delete a single partial payment
  const deletePayment = (invoiceId: string, paymentId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const updatedPayments = invoice.payments.filter(p => p.id !== paymentId);
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

    const updatedInvoice: Invoice = {
      ...invoice,
      payments: updatedPayments,
      status: newStatus
    };

    setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i));
  };

  return {
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
