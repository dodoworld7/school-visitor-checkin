import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { readDb } from '@/lib/db';
import { getTodayVisitors } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate session
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ message: '인증 권한이 없습니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolSlug = searchParams.get('schoolSlug');

    if (!schoolSlug) {
      return NextResponse.json({ message: '학교 식별자(schoolSlug)가 누락되었습니다.' }, { status: 400 });
    }

    // 2. Lookup school webAppUrl
    const db = await readDb();
    const school = db.schools.find(s => s.slug === schoolSlug);
    if (!school) {
      return NextResponse.json({ message: '등록되지 않은 학교입니다.' }, { status: 404 });
    }

    // 3. Delegate to Google Apps Script Web App
    const result = await getTodayVisitors(school.webAppUrl);

    return NextResponse.json({
      schoolName: school.name,
      todayDate: result.todayDate,
      summary: result.summary || { todayVisits: 0, currentlyIn: 0 },
      visitors: result.visitors || [],
    });
  } catch (error: any) {
    console.error('Failed to fetch school visitor stats via GAS:', error);
    return NextResponse.json(
      { message: error.message || '방문자 데이터를 조회하는 동안 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
