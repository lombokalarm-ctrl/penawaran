import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users, companySettings } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    // Get or create the user in the database
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    let dbUserResult = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    const dbUser = dbUserResult[0];

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
          email: 'info@itn.co.id',
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
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
