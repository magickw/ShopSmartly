import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import type { Request, Response, NextFunction } from 'express';

// Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify Google ID Token
export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload');
    
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      profileImageUrl: payload.picture,
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

// Verify Apple ID Token (simplified - would need Apple's public keys in production)
export async function verifyAppleToken(idToken: string) {
  try {
    // In production, you would verify against Apple's public keys
    // For now, we'll decode without verification for demonstration
    const decoded = jwt.decode(idToken) as any;
    
    if (!decoded) throw new Error('Invalid Apple token');
    
    return {
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      profileImageUrl: null, // Apple doesn't provide profile pictures
    };
  } catch (error) {
    console.error('Apple token verification failed:', error);
    throw new Error('Invalid Apple token');
  }
}

// Generate JWT for authenticated user
export function generateJWT(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = { id: decoded.userId };
    next();
  });
}

// Get user from request
export async function getCurrentUser(req: Request) {
  if (!req.user || !req.user.id) return null;
  return await storage.getUser(req.user.id);
}