import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, json } from 'drizzle-orm/pg-core';

// Define users table (Firebase Auth uid as unique reference)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define company settings table
export const companySettings = pgTable('company_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  name: text('name').notNull(),
  address: text('address'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  bankName: text('bank_name'),
  bankBranch: text('bank_branch'),
  bankAccountNo: text('bank_account_no'),
  bankAccountName: text('bank_account_name'),
  taxRate: integer('tax_rate').default(11).notNull(),
  signatureName: text('signature_name'),
  signaturePosition: text('signature_position'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  companyName: text('company_name').notNull(),
  address: text('address'),
  email: text('email'),
  phone: text('phone'),
  picName: text('pic_name'),
  picPosition: text('pic_position'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define offerings table
export const offerings = pgTable('offerings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  offeringNumber: text('offering_number').notNull(),
  date: text('date').notNull(),
  validUntil: text('valid_until').notNull(),
  clientId: integer('client_id')
    .references(() => clients.id, { onDelete: 'cascade' })
    .notNull(),
  discount: doublePrecision('discount').default(0).notNull(),
  taxRate: integer('tax_rate').default(11).notNull(),
  status: text('status').notNull(), // 'Draft' | 'Dikirim' | 'Disetujui' | 'Ditolak'
  terms: json('terms'), // list of strings
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define offering items table
export const offeringItems = pgTable('offering_items', {
  id: serial('id').primaryKey(),
  offeringId: integer('offering_id')
    .references(() => offerings.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
});

// Define invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  offeringId: integer('offering_id')
    .references(() => offerings.id, { onDelete: 'set null' }),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  clientId: integer('client_id')
    .references(() => clients.id, { onDelete: 'cascade' })
    .notNull(),
  discount: doublePrecision('discount').default(0).notNull(),
  taxRate: integer('tax_rate').default(11).notNull(),
  status: text('status').notNull(), // 'Belum Lunas' | 'Dibayar Sebagian' | 'Lunas' | 'Jatuh Tempo'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define invoice items table
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .references(() => invoices.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
});

// Define payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .references(() => invoices.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(),
  amount: doublePrecision('amount').notNull(),
  method: text('method').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  companySettings: one(companySettings, {
    fields: [users.id],
    references: [companySettings.userId],
  }),
  clients: many(clients),
  offerings: many(offerings),
  invoices: many(invoices),
}));

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  user: one(users, {
    fields: [companySettings.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  offerings: many(offerings),
  invoices: many(invoices),
}));

export const offeringsRelations = relations(offerings, ({ one, many }) => ({
  user: one(users, {
    fields: [offerings.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [offerings.clientId],
    references: [clients.id],
  }),
  items: many(offeringItems),
}));

export const offeringItemsRelations = relations(offeringItems, ({ one }) => ({
  offering: one(offerings, {
    fields: [offeringItems.offeringId],
    references: [offerings.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  offering: one(offerings, {
    fields: [invoices.offeringId],
    references: [offerings.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));
