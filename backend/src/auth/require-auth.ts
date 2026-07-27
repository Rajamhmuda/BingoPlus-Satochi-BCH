import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from './firebase-admin.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch custom claims or DB role
    let role: 'player' | 'admin' = (decodedToken.role as 'player' | 'admin') || 'player';
    if (!decodedToken.role) {
      const userSnap = await adminDb.ref(`users/${decodedToken.uid}`).once('value');
      if (userSnap.exists() && userSnap.val()?.role === 'admin') {
        role = 'admin';
      }
    }

    req.user = {
      ...decodedToken,
      role,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid ID token' });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    return;
  }
  next();
}
