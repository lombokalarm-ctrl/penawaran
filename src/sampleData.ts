import { Client, CompanySettings, Offering, Invoice } from './types';

export const initialCompanySettings: CompanySettings = {
  name: "PT Inovasi Teknologi Nusantara",
  address: "Jl. Jenderal Sudirman No. 45, Lantai 12, Kav. 21, Jakarta Selatan, DKI Jakarta 12190",
  email: "finance@inovasiteknologi.co.id",
  phone: "+62 21-555-8902",
  website: "www.inovasiteknologi.co.id",
  bankName: "Bank Mandiri",
  bankBranch: "KCP Jakarta Sudirman Tower",
  bankAccountNo: "124-00-9876543-2",
  bankAccountName: "PT Inovasi Teknologi Nusantara",
  taxRate: 11, // PPN 11%
  signatureName: "Budi Hermawan, S.Kom.",
  signaturePosition: "Direktur Utama"
};

export const initialClients: Client[] = [
  {
    id: "client-1",
    name: "Siti Rahma",
    companyName: "PT Sejahtera Makmur Abadi",
    address: "Kawasan Industri MM2100, Blok C-3, Cikarang Barat, Bekasi, Jawa Barat 17530",
    email: "siti.rahma@sejahteramakmur.com",
    phone: "+62 811-222-3333",
    picName: "Siti Rahma",
    picPosition: "Head of Procurement",
    createdAt: "2026-06-01"
  },
  {
    id: "client-2",
    name: "Rian Wijaya",
    companyName: "CV Sinar Mandiri Elektronik",
    address: "Jl. Gajah Mada No. 112, Semarang Tengah, Kota Semarang, Jawa Tengah 50134",
    email: "rian.wijaya@sinarmandiri.co.id",
    phone: "+62 812-444-5555",
    picName: "Rian Wijaya",
    picPosition: "Manager Operasional",
    createdAt: "2026-06-15"
  },
  {
    id: "client-3",
    name: "Indra Kusuma",
    companyName: "PT Global Logistik Services",
    address: "Rukan Graha Ancol Blok B No. 8, Jl. RE Martadinata, Jakarta Utara, DKI Jakarta 14430",
    email: "indra.k@globallogistik.com",
    phone: "+62 813-888-9999",
    picName: "Indra Kusuma",
    picPosition: "VP of Logistics",
    createdAt: "2026-07-02"
  }
];

export const initialOfferings: Offering[] = [
  {
    id: "offering-1",
    offeringNumber: "015/ITN-PNW/VI/2026",
    date: "2026-06-10",
    validUntil: "2026-07-10",
    clientId: "client-1",
    items: [
      { id: "item-1", description: "Pengembangan Sistem ERP Kustom - Modul Keuangan & Inventory", qty: 1, unitPrice: 45000000 },
      { id: "item-2", description: "Lisensi Server Cloud Enterprise (Tahunan)", qty: 1, unitPrice: 12000000 },
      { id: "item-3", description: "Pelatihan Penggunaan & Onboarding Staf", qty: 5, unitPrice: 1500000 }
    ],
    discount: 5000000,
    taxRate: 11,
    status: "Disetujui",
    terms: [
      "Pembayaran uang muka (DP) sebesar 30% setelah penawaran disetujui oleh kedua belah pihak.",
      "Pembayaran Termin ke-2 sebesar 40% setelah sistem dideploy ke lingkungan Staging.",
      "Pelunasan sebesar 30% didepositkan setelah serah terima pekerjaan (UAT) dan pelatihan selesai.",
      "Waktu pengerjaan disepakati selama maksimal 60 hari kerja sejak DP diterima."
    ],
    notes: "Penawaran harga di atas sudah mencakup dukungan teknis (maintenance) gratis selama 6 bulan pertama setelah serah terima.",
    createdAt: "2026-06-10"
  },
  {
    id: "offering-2",
    offeringNumber: "016/ITN-PNW/VI/2026",
    date: "2026-06-18",
    validUntil: "2026-07-18",
    clientId: "client-2",
    items: [
      { id: "item-4", description: "Migrasi Database & Optimalisasi Query Postgres", qty: 1, unitPrice: 20000000 },
      { id: "item-5", description: "Sesi Audit Keamanan Siber Khusus Aplikasi Web", qty: 2, unitPrice: 7500000 }
    ],
    discount: 0,
    taxRate: 11,
    status: "Dikirim",
    terms: [
      "Pembayaran penuh (100%) harus dilakukan maksimal 14 hari setelah penyerahan laporan audit.",
      "Semua data klien bersifat rahasia dan akan dilindungi di bawah perjanjian Non-Disclosure Agreement (NDA)."
    ],
    notes: "Penawaran ini fleksibel dan dapat dinegosiasikan ulang sesuai dengan kompleksitas arsitektur basis data eksisting.",
    createdAt: "2026-06-18"
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: "invoice-1",
    invoiceNumber: "INV/2026/06/089",
    offeringId: "offering-1",
    date: "2026-06-12",
    dueDate: "2026-07-12",
    clientId: "client-1",
    items: [
      { id: "inv-item-1", description: "Uang Muka (DP 30%) - Pengembangan Sistem ERP Kustom Sesuai Penawaran 015/ITN-PNW/VI/2026", qty: 1, unitPrice: 17850000 }
    ],
    discount: 0,
    taxRate: 11,
    status: "Lunas",
    payments: [
      { id: "p-1", date: "2026-06-14", amount: 19813500, method: "Transfer Bank", note: "Pelunasan DP 30% Proyek ERP - Invoice #089" }
    ],
    notes: "Terima kasih atas kerja samanya. Pembayaran ini mengaktifkan tahapan desain dan analisis sistem.",
    createdAt: "2026-06-12"
  },
  {
    id: "invoice-2",
    invoiceNumber: "INV/2026/07/002",
    offeringId: "offering-1",
    date: "2026-07-01",
    dueDate: "2026-07-31",
    clientId: "client-1",
    items: [
      { id: "inv-item-2", description: "Pembayaran Termin ke-2 (40%) - Sistem ERP Kustom Sesuai Penawaran 015/ITN-PNW/VI/2026", qty: 1, unitPrice: 23800000 }
    ],
    discount: 0,
    taxRate: 11,
    status: "Dibayar Sebagian",
    payments: [
      { id: "p-2", date: "2026-07-03", amount: 15000000, method: "Transfer Bank", note: "Pembayaran cicilan awal Termin 2" }
    ],
    notes: "Pembayaran termin 2 dilakukan bertahap. Sisa tagihan harus diselesaikan sebelum serah terima kode sumber.",
    createdAt: "2026-07-01"
  },
  {
    id: "invoice-3",
    invoiceNumber: "INV/2026/07/005",
    date: "2026-07-03",
    dueDate: "2026-07-17",
    clientId: "client-3",
    items: [
      { id: "inv-item-3", description: "Audit Infrastruktur Cloud & Pengaturan CI/CD Pipeline", qty: 1, unitPrice: 15000000 },
      { id: "inv-item-4", description: "SLA Support Bulanan - SLA Silver (Juli 2026)", qty: 1, unitPrice: 5000000 }
    ],
    discount: 1000000,
    taxRate: 11,
    status: "Belum Lunas",
    payments: [],
    notes: "Batas akhir pembayaran adalah 14 hari dari penerbitan invoice.",
    createdAt: "2026-07-03"
  }
];
