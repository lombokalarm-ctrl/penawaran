import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { companySettings, clients, offerings, offeringItems, invoices, invoiceItems, payments } from './src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
