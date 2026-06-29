// Bypass SSL verification for networks using security proxies/firewalls
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface VisitorData {
  date: string;       // YYYY-MM-DD
  checkinTime: string; // HH:MM:SS
  name: string;
  contact: string;     // 010-XXXX-XXXX
  purpose: string;
  host: string;
  carNumber?: string;
}

/**
 * Generic helper to send POST requests to Google Apps Script Web App.
 */
async function sendToWebApp(webAppUrl: string, payload: any): Promise<any> {
  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`구글 앱스 스크립트 연결 실패: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || '앱스 스크립트 실행 중 에러가 발생했습니다.');
    }

    return data;
  } catch (error: any) {
    console.error('GAS Communication Failure:', error);
    throw new Error(error.message || '구글 앱스 스크립트 웹앱 주소가 올바르지 않거나 네트워크 연결에 실패했습니다.');
  }
}

/**
 * Tests connection with the Google Apps Script Web App and initializes headers.
 * Returns the resolved Google Spreadsheet URL if successful.
 */
export async function testWrite(webAppUrl: string): Promise<string> {
  const result = await sendToWebApp(webAppUrl, { action: 'test' });
  return result.spreadsheetUrl || '';
}

/**
 * Sends a visitor check-in log to the Google Apps Script Web App.
 */
export async function addVisitor(webAppUrl: string, data: VisitorData): Promise<void> {
  await sendToWebApp(webAppUrl, {
    action: 'checkin',
    date: data.date,
    checkinTime: data.checkinTime,
    name: data.name,
    contact: data.contact,
    purpose: data.purpose,
    host: data.host,
    carNumber: data.carNumber || '',
  });
}

/**
 * Sends a visitor checkout signal to the Google Apps Script Web App.
 */
export async function checkoutVisitor(
  webAppUrl: string,
  name: string,
  contact: string,
  checkoutTime: string
): Promise<boolean> {
  try {
    const result = await sendToWebApp(webAppUrl, {
      action: 'checkout',
      name,
      contact,
      checkoutTime,
    });
    return result.success === true;
  } catch (error) {
    console.error('Checkout request failed:', error);
    return false;
  }
}

/**
 * Sends an anonymization command to clean up records older than a retention threshold.
 */
export async function anonymizeOldRecords(webAppUrl: string, retentionDays: number): Promise<number> {
  try {
    const result = await sendToWebApp(webAppUrl, {
      action: 'anonymize',
      retentionDays,
    });
    return result.anonymizedCount || 0;
  } catch (error) {
    console.error('Anonymize request failed:', error);
    return 0;
  }
}

/**
 * Fetches today's visitors stats and rows from the Apps Script Web App.
 */
export async function getTodayVisitors(webAppUrl: string): Promise<any> {
  const result = await sendToWebApp(webAppUrl, {
    action: 'getTodayVisitors'
  });
  return result;
}
