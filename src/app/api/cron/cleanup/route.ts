import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { anonymizeOldRecords } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    // Authorize: check token if Cron Secret is configured in env
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (authHeader && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: '이 작업을 수행할 권한이 없습니다.' },
        { status: 401 }
      );
    }

    const db = await readDb();
    const school = db.schools[0];
    if (!school || !school.webAppUrl) {
      return NextResponse.json({
        message: '등록된 학교 웹앱 주소가 없습니다.',
        success: false
      });
    }

    const retentionDays = 30; // 30-day retention policy
    const count = await anonymizeOldRecords(school.webAppUrl, retentionDays);

    return NextResponse.json({
      success: true,
      retentionDays,
      results: [{
        schoolName: school.name,
        slug: school.slug,
        anonymizedCount: count,
        status: 'success',
      }]
    });
  } catch (error: any) {
    console.error('Anonymize Cron Job failed:', error);
    return NextResponse.json(
      { message: error.message || '데이터 정리 작업 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Support GET for testing ease
export async function GET() {
  try {
    const db = await readDb();
    const school = db.schools[0];
    if (!school || !school.webAppUrl) {
      return NextResponse.json({
        message: '등록된 학교 웹앱 주소가 없습니다.',
        success: false
      });
    }

    const retentionDays = 30;
    const count = await anonymizeOldRecords(school.webAppUrl, retentionDays);

    return NextResponse.json({
      success: true,
      retentionDays,
      results: [{
        schoolName: school.name,
        slug: school.slug,
        anonymizedCount: count,
        status: 'success',
      }]
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
