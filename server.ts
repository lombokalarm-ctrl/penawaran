import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { users, companySettings, clients, offerings, offeringItems, invoices, invoiceItems, payments } from './src/db/schema.ts';
import { eq, and, or, sql } from 'drizzle-orm';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Bootstrap Database
  try {
    console.log('Bootstrapping PostgreSQL database schema...');
    
    // Create tables in order
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT UNIQUE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        token TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        bank_name TEXT,
        bank_branch TEXT,
        bank_account_no TEXT,
        bank_account_name TEXT,
        tax_rate INTEGER DEFAULT 11 NOT NULL,
        signature_name TEXT,
        signature_position TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        address TEXT,
        email TEXT,
        phone TEXT,
        pic_name TEXT,
        pic_position TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS offerings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        offering_number TEXT NOT NULL,
        date TEXT NOT NULL,
        valid_until TEXT NOT NULL,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        discount DOUBLE PRECISION DEFAULT 0 NOT NULL,
        tax_rate INTEGER DEFAULT 11 NOT NULL,
        status TEXT NOT NULL,
        terms JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS offering_items (
        id SERIAL PRIMARY KEY,
        offering_id INTEGER NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        qty INTEGER NOT NULL,
        unit_price DOUBLE PRECISION NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invoice_number TEXT NOT NULL,
        offering_id INTEGER REFERENCES offerings(id) ON DELETE SET NULL,
        date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        discount DOUBLE PRECISION DEFAULT 0 NOT NULL,
        tax_rate INTEGER DEFAULT 11 NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        qty INTEGER NOT NULL,
        unit_price DOUBLE PRECISION NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        method TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure default admin user
    const adminPasswordHash = crypto.createHash('sha256').update('password12').digest('hex');
    await db.execute(sql`
      INSERT INTO users (username, email, password_hash, token)
      VALUES ('admin', 'admin@apli.my.id', ${adminPasswordHash}, 'admin_token')
      ON CONFLICT (username) DO UPDATE SET 
        token = EXCLUDED.token,
        password_hash = EXCLUDED.password_hash
    `);

    // Ensure default company settings
    await db.execute(sql`
      INSERT INTO company_settings (user_id, name, address, email, phone, website, bank_name, bank_branch, bank_account_no, bank_account_name, tax_rate, signature_name, signature_position)
      VALUES (1, 'PT Inovasi Teknologi Nusantara', 'Jl. Merdeka No. 123, Jakarta, Indonesia', 'admin@apli.my.id', '+62 21 555 1234', 'www.itn.co.id', 'Bank Mandiri', 'KCP Jakarta Sudirman', '123-45-67890-1', 'PT Inovasi Teknologi Nusantara', 11, 'Budi Santoso', 'Direktur Utama')
      ON CONFLICT (user_id) DO NOTHING
    `);

    console.log('Database bootstrap completed successfully!');
  } catch (err) {
    console.error('Database bootstrap failed (continuing anyway):', err);
  }

  app.use(express.json());

  // API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API: Custom Auth Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      // Check if username or email already exists
      const existingUser = await db.query.users.findFirst({
        where: (u, { or, eq }) => or(eq(u.username, username), eq(u.email, email)),
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const passwordHash = hashPassword(password);
      const token = generateToken();

      const inserted = await db.insert(users)
        .values({
          username,
          email,
          passwordHash,
          token,
        })
        .returning();

      const newUser = inserted[0];

      // Create company settings for the user
      await db.insert(companySettings)
        .values({
          userId: newUser.id,
          name: 'PT Inovasi Teknologi Nusantara',
          address: 'Jl. Merdeka No. 123, Jakarta, Indonesia',
          email: newUser.email,
          phone: '+62 21 555 1234',
          website: 'www.itn.co.id',
          bankName: 'Bank Mandiri',
          bankBranch: 'KCP Jakarta Sudirman',
          bankAccountNo: '123-45-67890-1',
          bankAccountName: 'PT Inovasi Teknologi Nusantara',
          taxRate: 11,
          signatureName: 'Budi Santoso',
          signaturePosition: 'Direktur Utama',
        })
        .onConflictDoNothing();

      res.json({
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
        token,
      });
    } catch (error: any) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Custom Auth Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user by username or email
      const userRecord = await db.query.users.findFirst({
        where: (u, { or, eq }) => or(eq(u.username, username), eq(u.email, username)),
      });

      if (!userRecord || userRecord.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid username/email or password' });
      }

      const token = generateToken();
      await db.update(users)
        .set({ token })
        .where(eq(users.id, userRecord.id));

      res.json({
        user: {
          id: userRecord.id,
          username: userRecord.username,
          email: userRecord.email,
        },
        token,
      });
    } catch (error: any) {
      console.error('Error during login:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Custom Auth Logout
  app.post('/api/auth/logout', requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.update(users)
        .set({ token: null })
        .where(eq(users.id, req.dbUser!.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error during logout:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Custom Auth Me
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      user: req.dbUser,
    });
  });

  // API: Company Settings
  app.get('/api/company-settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const settings = await db.query.companySettings.findFirst({
        where: (cs, { eq }) => eq(cs.userId, req.dbUser!.id),
      });
      res.json(settings || null);
    } catch (error: any) {
      console.error('Error fetching company settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/company-settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const updated = await db.update(companySettings)
        .set({
          name: body.name,
          address: body.address,
          email: body.email,
          phone: body.phone,
          website: body.website,
          bankName: body.bankName,
          bankBranch: body.bankBranch,
          bankAccountNo: body.bankAccountNo,
          bankAccountName: body.bankAccountName,
          taxRate: Number(body.taxRate) || 11,
          signatureName: body.signatureName,
          signaturePosition: body.signaturePosition,
        })
        .where(eq(companySettings.userId, req.dbUser!.id))
        .returning();
      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating company settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Clients
  app.get('/api/clients', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await db.query.clients.findMany({
        where: (cl, { eq }) => eq(cl.userId, req.dbUser!.id),
        orderBy: (cl, { desc }) => [desc(cl.createdAt)],
      });
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/clients', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const inserted = await db.insert(clients)
        .values({
          userId: req.dbUser!.id,
          name: body.name,
          companyName: body.companyName,
          address: body.address,
          email: body.email,
          phone: body.phone,
          picName: body.picName,
          picPosition: body.picPosition,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error: any) {
      console.error('Error creating client:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/clients/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const updated = await db.update(clients)
        .set({
          name: body.name,
          companyName: body.companyName,
          address: body.address,
          email: body.email,
          phone: body.phone,
          picName: body.picName,
          picPosition: body.picPosition,
        })
        .where(and(eq(clients.id, Number(req.params.id)), eq(clients.userId, req.dbUser!.id)))
        .returning();
      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/clients/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.delete(clients)
        .where(and(eq(clients.id, Number(req.params.id)), eq(clients.userId, req.dbUser!.id)));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Offerings
  app.get('/api/offerings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await db.query.offerings.findMany({
        where: (of, { eq }) => eq(of.userId, req.dbUser!.id),
        with: {
          items: true,
        },
        orderBy: (of, { desc }) => [desc(of.createdAt)],
      });
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching offerings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/offerings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const newOffering = await db.transaction(async (tx) => {
        const [inserted] = await tx.insert(offerings)
          .values({
            userId: req.dbUser!.id,
            offeringNumber: body.offeringNumber,
            date: body.date,
            validUntil: body.validUntil,
            clientId: Number(body.clientId),
            discount: Number(body.discount) || 0,
            taxRate: Number(body.taxRate) || 11,
            status: body.status,
            terms: body.terms || [],
            notes: body.notes || '',
          })
          .returning();

        if (body.items && body.items.length > 0) {
          const itemsToInsert = body.items.map((item: any) => ({
            offeringId: inserted.id,
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
          }));
          await tx.insert(offeringItems).values(itemsToInsert);
        }

        return tx.query.offerings.findFirst({
          where: (of, { eq }) => eq(of.id, inserted.id),
          with: { items: true },
        });
      });
      res.json(newOffering);
    } catch (error: any) {
      console.error('Error creating offering:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/offerings/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const offeringId = Number(req.params.id);
      const updatedOffering = await db.transaction(async (tx) => {
        const existing = await tx.query.offerings.findFirst({
          where: (of, { eq, and }) => and(eq(of.id, offeringId), eq(of.userId, req.dbUser!.id)),
        });
        if (!existing) {
          throw new Error('Offering not found');
        }

        await tx.update(offerings)
          .set({
            offeringNumber: body.offeringNumber,
            date: body.date,
            validUntil: body.validUntil,
            clientId: Number(body.clientId),
            discount: Number(body.discount) || 0,
            taxRate: Number(body.taxRate) || 11,
            status: body.status,
            terms: body.terms || [],
            notes: body.notes || '',
          })
          .where(eq(offerings.id, offeringId));

        await tx.delete(offeringItems).where(eq(offeringItems.offeringId, offeringId));

        if (body.items && body.items.length > 0) {
          const itemsToInsert = body.items.map((item: any) => ({
            offeringId: offeringId,
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
          }));
          await tx.insert(offeringItems).values(itemsToInsert);
        }

        return tx.query.offerings.findFirst({
          where: (of, { eq }) => eq(of.id, offeringId),
          with: { items: true },
        });
      });
      res.json(updatedOffering);
    } catch (error: any) {
      console.error('Error updating offering:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/offerings/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const offeringId = Number(req.params.id);
      await db.delete(offerings)
        .where(and(eq(offerings.id, offeringId), eq(offerings.userId, req.dbUser!.id)));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting offering:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Invoices
  app.get('/api/invoices', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await db.query.invoices.findMany({
        where: (inv, { eq }) => eq(inv.userId, req.dbUser!.id),
        with: {
          items: true,
          payments: true,
        },
        orderBy: (inv, { desc }) => [desc(inv.createdAt)],
      });
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/invoices', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const newInvoice = await db.transaction(async (tx) => {
        const [inserted] = await tx.insert(invoices)
          .values({
            userId: req.dbUser!.id,
            invoiceNumber: body.invoiceNumber,
            offeringId: body.offeringId ? Number(body.offeringId) : null,
            date: body.date,
            dueDate: body.dueDate,
            clientId: Number(body.clientId),
            discount: Number(body.discount) || 0,
            taxRate: Number(body.taxRate) || 11,
            status: body.status,
            notes: body.notes || '',
          })
          .returning();

        if (body.items && body.items.length > 0) {
          const itemsToInsert = body.items.map((item: any) => ({
            invoiceId: inserted.id,
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
          }));
          await tx.insert(invoiceItems).values(itemsToInsert);
        }

        if (body.payments && body.payments.length > 0) {
          const paymentsToInsert = body.payments.map((p: any) => ({
            invoiceId: inserted.id,
            date: p.date,
            amount: Number(p.amount),
            method: p.method,
            note: p.note || '',
          }));
          await tx.insert(payments).values(paymentsToInsert);
        }

        return tx.query.invoices.findFirst({
          where: (inv, { eq }) => eq(inv.id, inserted.id),
          with: { items: true, payments: true },
        });
      });
      res.json(newInvoice);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/invoices/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const invoiceId = Number(req.params.id);
      const updatedInvoice = await db.transaction(async (tx) => {
        const existing = await tx.query.invoices.findFirst({
          where: (inv, { eq, and }) => and(eq(inv.id, invoiceId), eq(inv.userId, req.dbUser!.id)),
        });
        if (!existing) {
          throw new Error('Invoice not found');
        }

        await tx.update(invoices)
          .set({
            invoiceNumber: body.invoiceNumber,
            offeringId: body.offeringId ? Number(body.offeringId) : null,
            date: body.date,
            dueDate: body.dueDate,
            clientId: Number(body.clientId),
            discount: Number(body.discount) || 0,
            taxRate: Number(body.taxRate) || 11,
            status: body.status,
            notes: body.notes || '',
          })
          .where(eq(invoices.id, invoiceId));

        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
        if (body.items && body.items.length > 0) {
          const itemsToInsert = body.items.map((item: any) => ({
            invoiceId: invoiceId,
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
          }));
          await tx.insert(invoiceItems).values(itemsToInsert);
        }

        await tx.delete(payments).where(eq(payments.invoiceId, invoiceId));
        if (body.payments && body.payments.length > 0) {
          const paymentsToInsert = body.payments.map((p: any) => ({
            invoiceId: invoiceId,
            date: p.date,
            amount: Number(p.amount),
            method: p.method,
            note: p.note || '',
          }));
          await tx.insert(payments).values(paymentsToInsert);
        }

        return tx.query.invoices.findFirst({
          where: (inv, { eq }) => eq(inv.id, invoiceId),
          with: { items: true, payments: true },
        });
      });
      res.json(updatedInvoice);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/invoices/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const invoiceId = Number(req.params.id);
      await db.delete(invoices)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, req.dbUser!.id)));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite development middleware vs Static Production files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
