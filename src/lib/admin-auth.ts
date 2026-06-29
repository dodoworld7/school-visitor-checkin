import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Generates the expected session token based on the admin password and a constant salt.
 */
export function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD || 'admin1234';
  return crypto.createHash('sha256').update(password + '_school_visitor_salt_2026').digest('hex');
}

/**
 * Checks if the current admin cookie session is valid.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  return token === getExpectedToken();
}

/**
 * Sets the admin session cookie on the response headers.
 */
export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', getExpectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Clears the admin session cookie.
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}
