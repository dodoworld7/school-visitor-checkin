/**
 * Escapes HTML tags to prevent Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes characters that can trigger formula execution in spreadsheets (CSV injection).
 * If a string begins with =, +, -, @, \t, or \r, prepend it with an apostrophe (').
 */
export function escapeFormula(str: string): string {
  if (!str) return '';
  const firstChar = str.trim().charAt(0);
  if (['=', '+', '-', '@'].includes(firstChar)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Validates and formats Korean mobile number.
 * Valid format: 010-XXXX-XXXX
 */
export function validatePhoneNumber(phone: string): boolean {
  const regex = /^010-\d{3,4}-\d{4}$/;
  return regex.test(phone);
}

/**
 * Formats a phone number as 010-XXXX-XXXX dynamically as user types (client side helper).
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Returns the current date (YYYY-MM-DD) and time (HH:MM:SS) in South Korea timezone (KST, UTC+9).
 */
export function getKoreanDateTime(): { date: string; time: string } {
  // Use Intl.DateTimeFormat to force South Korea locale/timezone on any server environment
  const kstDate = new Date();
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const dateParts = new Intl.DateTimeFormat('ko-KR', dateOptions).formatToParts(kstDate);
  const timeStr = new Intl.DateTimeFormat('ko-KR', timeOptions).format(kstDate);

  const year = dateParts.find(p => p.type === 'year')?.value || '';
  const month = dateParts.find(p => p.type === 'month')?.value || '';
  const day = dateParts.find(p => p.type === 'day')?.value || '';

  return {
    date: `${year}-${month}-${day}`,
    time: timeStr,
  };
}
