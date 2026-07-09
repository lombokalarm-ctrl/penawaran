import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { companySettings } from '../db/schema.ts';

export interface AuthRequest extends Request {
  dbUser?: {
    id: number;
    username: string;
    email: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const dbUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.token, token),
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Ensure company settings exist for the user
    const existingSettings = await db.query.companySettings.findFirst({
      where: (cs, { eq }) => eq(cs.userId, dbUser.id),
    });

    if (!existingSettings) {
      await db.insert(companySettings)
        .values({
          userId: dbUser.id,
          name: 'PT Inovasi Teknologi Nusantara',
          address: 'Jl. Merdeka No. 123, Jakarta, Indonesia',
          email: dbUser.email || 'info@itn.co.id',
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
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
