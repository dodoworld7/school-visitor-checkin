import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { addVisitor } from '@/lib/google-sheets';
import { isRateLimited } from '@/lib/rate-limit';
import { escapeHtml, escapeFormula, validatePhoneNumber, getKoreanDateTime } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting check
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { schoolSlug, name, contact, purpose, host, carNumber, honeypot } = body;

    // 3. Honeypot check (Spam protection)
    if (honeypot) {
      return NextResponse.json(
        { message: '비정상적인 요청이 감지되었습니다.' },
        { status: 400 }
      );
    }

    // 4. Input Validations
    if (!name || !contact || !purpose || !host) {
      return NextResponse.json(
        { message: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!validatePhoneNumber(contact)) {
      return NextResponse.json(
        { message: '휴대폰 번호 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 5. Look up school details
    const db = await readDb();
    const school = db.schools[0]; // Always default to Seoul Yunjung Elementary
    if (!school || !school.webAppUrl) {
      return NextResponse.json(
        { message: '스프레드시트 연동 웹앱 주소가 설정되지 않았습니다.' },
        { status: 404 }
      );
    }

    // 6. Security Escapes (XSS & Sheet Injection Prevention)
    const escapedName = escapeFormula(escapeHtml(name.trim()));
    const escapedContact = escapeFormula(escapeHtml(contact.trim()));
    const escapedPurpose = escapeFormula(escapeHtml(purpose.trim()));
    const escapedHost = escapeFormula(escapeHtml(host.trim()));
    const escapedCarNumber = carNumber ? escapeFormula(escapeHtml(carNumber.trim())) : '';

    // 7. Get Server KST DateTime for recording
    const { date, time } = getKoreanDateTime();

    // 8. Write to Google Sheets via GAS Web App
    await addVisitor(school.webAppUrl, {
      date,
      checkinTime: time,
      name: escapedName,
      contact: escapedContact,
      purpose: escapedPurpose,
      host: escapedHost,
      carNumber: escapedCarNumber,
    });

    return NextResponse.json({
      success: true,
      date,
      checkinTime: time,
    });
  } catch (error: any) {
    console.error('API Check-in failure:', error);
    return NextResponse.json(
      { message: error.message || '서버 오류로 인해 방문 등록을 완료하지 못했습니다.' },
      { status: 500 }
    );
  }
}
