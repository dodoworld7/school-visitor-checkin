import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface School {
  id: string;
  slug: string;
  name: string;
  webAppUrl: string;      // Google Apps Script Web App URL
  spreadsheetUrl?: string; // Resolved Google Sheet URL for admin click
  createdAt: string;
}

export interface Admin {
  username: string;
  passwordHash: string;
}

export interface DatabaseSchema {
  schools: School[];
  admin: Admin;
}

// Default initial database content
// Password hash for 'admin1234'
const DEFAULT_PASSWORD_HASH = crypto.createHash('sha256').update('admin1234').digest('hex');

const defaultData: DatabaseSchema = {
  schools: [],
  admin: {
    username: 'admin',
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
};

/**
 * Reads database content from local file.
 * Creates directory and file with defaults if they don't exist.
 */
export async function readDb(): Promise<DatabaseSchema> {
  // 1. Prepare virtual Yunjung Elementary School template
  const yunjungWebAppUrl = process.env.YUNJUNG_WEBAPP_URL || '';
  
  try {
    let db: DatabaseSchema = { ...defaultData };
    
    if (fs.existsSync(DB_FILE)) {
      const data = await fs.promises.readFile(DB_FILE, 'utf-8');
      db = JSON.parse(data) as DatabaseSchema;
    } else if (fs.existsSync(DB_DIR)) {
      // Create if file doesn't exist
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
    
    // 2. Override with single-school logic (Seoul Yunjung)
    // If environment variable is set, it overrides and locks down Yunjung Elementary School
    const spreadsheetUrl = db.schools.find(s => s.slug === 'yunjung' || s.name.includes('윤중'))?.spreadsheetUrl 
      || db.schools[0]?.spreadsheetUrl 
      || 'https://docs.google.com/spreadsheets';

    db.schools = [{
      id: 'yunjung-elementary-school-id',
      slug: 'yunjung',
      name: '서울윤중초등학교',
      webAppUrl: yunjungWebAppUrl || db.schools[0]?.webAppUrl || '',
      spreadsheetUrl: spreadsheetUrl,
      createdAt: new Date().toISOString()
    }];
    
    return db;
  } catch (error) {
    console.error('Failed to read database file, returning virtual school:', error);
    
    return {
      schools: [{
        id: 'yunjung-elementary-school-id',
        slug: 'yunjung',
        name: '서울윤중초등학교',
        webAppUrl: yunjungWebAppUrl,
        spreadsheetUrl: 'https://docs.google.com/spreadsheets',
        createdAt: new Date().toISOString()
      }],
      admin: defaultData.admin
    };
  }
}

/**
 * Writes the database schema back to the local file.
 */
export async function writeDb(data: DatabaseSchema): Promise<void> {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write database file:', error);
    throw new Error('Database write operation failed.');
  }
}

/**
 * Helper to verify password hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const computed = crypto.createHash('sha256').update(password).digest('hex');
  return computed === hash;
}

/**
 * Helper to update admin password
 */
export async function updateAdminPassword(newPassword: string): Promise<void> {
  const db = await readDb();
  db.admin.passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
  await writeDb(db);
}
