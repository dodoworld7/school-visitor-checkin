import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getTodayVisitors } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    // 1. Lookup school webAppUrl
    const db = await readDb();
    const school = db.schools[0]; // Default to Seoul Yunjung Elementary
    
    if (!school || !school.webAppUrl) {
      return NextResponse.json({ message: '연동된 학교 웹앱 주소가 설정되지 않았습니다.' }, { status: 404 });
    }

    // 2. Delegate to Google Apps Script Web App
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
