import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { checkoutVisitor } from '@/lib/google-sheets';
import { getKoreanDateTime } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolSlug, name, contact } = body;

    if (!schoolSlug || !name || !contact) {
      return NextResponse.json(
        { message: '필수 요청 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Lookup school metadata
    const db = await readDb();
    const school = db.schools.find(s => s.slug === schoolSlug);
    if (!school) {
      return NextResponse.json(
        { message: '등록되지 않은 학교 정보입니다.' },
        { status: 404 }
      );
    }

    // Get current KST checkout time
    const { time } = getKoreanDateTime();

    // Call Sheet helper to register checkout via Apps Script
    const isSuccess = await checkoutVisitor(school.webAppUrl, name.trim(), contact.trim(), time);

    if (!isSuccess) {
      return NextResponse.json(
        { message: '입장 기록이 없거나 이미 퇴장 처리된 방문자입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutTime: time,
    });
  } catch (error: any) {
    console.error('API Checkout failure:', error);
    return NextResponse.json(
      { message: error.message || '서버 오류로 인해 퇴장 처리를 완료하지 못했습니다.' },
      { status: 500 }
    );
  }
}
