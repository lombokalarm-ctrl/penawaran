export interface Client {
  id: string;
  name: string; // Contact person
  companyName: string;
  address: string;
  email: string;
  phone: string;
  picName: string;
  picPosition: string;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankAccountName: string;
  taxRate: number; // in % (e.g., PPN 11%)
  signatureName: string;
  signaturePosition: string;
}

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export type OfferingStatus = 'Draft' | 'Dikirim' | 'Disetujui' | 'Ditolak';

export interface Offering {
  id: string;
  offeringNumber: string;
  date: string;
  validUntil: string;
  clientId: string;
  items: LineItem[];
  discount: number; // in % or value, let's use fixed value
  taxRate: number; // %
  status: OfferingStatus;
  terms: string[];
  notes: string;
  createdAt: string;
}

export type InvoiceStatus = 'Belum Lunas' | 'Dibayar Sebagian' | 'Lunas' | 'Jatuh Tempo';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string; // e.g., Transfer Bank, Tunai, dll
  note: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  offeringId?: string; // Optional reference to parent offering
  date: string;
  dueDate: string;
  clientId: string;
  items: LineItem[];
  discount: number; // fixed value
  taxRate: number; // %
  status: InvoiceStatus;
  payments: Payment[];
  notes: string;
  createdAt: string;
}
