import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';

/**
 * Hashes a plaintext password using bcrypt with configurable salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates signed JWT for authenticated sessions.
 */
export function generateToken(payload: object): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies and decodes a signed JWT.
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, config.jwtSecret);
}

/**
 * Computes deterministic SHA-256 hash of a string.
 * Used for prompt deduplication and integrity verification without storing raw secrets.
 */
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Irreversibly masks sensitive evidence for SOC analyst review.
 * Preserves initial and trailing characters for debugging context while redacting secrets.
 * Example: 'AKIAIOSFODNN7EXAMPLE' -> 'AKIA************LE'
 * Example: 'user@corp.example.com' -> 'u***r@corp.example.com'
 */
export function maskEvidence(text: string, category?: string): string {
  if (!text) return '***';
  const clean = text.trim();
  
  if (category === 'PII' && clean.includes('@')) {
    const parts = clean.split('@');
    const local = parts[0];
    const domain = parts[1];
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  if (clean.length <= 6) {
    return '******';
  }

  const prefixLen = Math.min(4, Math.floor(clean.length / 4));
  const suffixLen = Math.min(2, Math.floor(clean.length / 5));
  const maskedMiddle = '*'.repeat(Math.max(6, clean.length - prefixLen - suffixLen));
  
  return `${clean.substring(0, prefixLen)}${maskedMiddle}${clean.substring(clean.length - suffixLen)}`;
}
