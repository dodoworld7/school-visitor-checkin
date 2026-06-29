import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { anonymizeOldRecords } from '@/lib/google-sheets';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize: Either active admin session OR matching Cron Secret token
    const isSessionAuth = await verifyAdminSession();
    
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET || 'default_cron_secret_2026';
    const isCronTokenAuth = authHeader === `Bearer ${cronSecret}`;

    if (!isSessionAuth && !isCronTokenAuth) {
      return NextResponse.json(
        { message: '이 작업을 수행할 권한이 없습니다.' },
        { status: 401 }
      );
    }

    // 2. Fetch all registered schools
    const db = await readDb();
    if (db.schools.length === 0) {
      return NextResponse.json({
        message: '등록된 학교가 없습니다.',
        anonymizedSchools: [],
      });
    }

    const retentionDays = 30; // 30-day retention policy
    const report: any[] = [];

    // 3. Loop through schools and clean up records
    for (const school of db.schools) {
      try {
        const count = await anonymizeOldRecords(school.webAppUrl, retentionDays);
        report.push({
          schoolName: school.name,
          slug: school.slug,
          anonymizedCount: count,
          status: 'success',
        });
      } catch (err: any) {
        console.error(`Failed to clean up records for ${school.name}:`, err);
        report.push({
          schoolName: school.name,
          slug: school.slug,
          error: err.message || '알 수 없는 오류',
          status: 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      retentionDays,
      results: report,
    });
  } catch (error: any) {
    console.error('Anonymize Cron Job failed:', error);
    return NextResponse.json(
      { message: error.message || '데이터 정리 작업 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Support GET for testing ease (only allowed via admin session verification)
export async function GET() {
  const isSessionAuth = await verifyAdminSession();
  if (!isSessionAuth) {
    return NextResponse.json({ message: '인증 권한이 없습니다.' }, { status: 401 });
  }

  try {
    const db = await readDb();
    const retentionDays = 30;
    const report: any[] = [];

    for (const school of db.schools) {
      try {
        const count = await anonymizeOldRecords(school.webAppUrl, retentionDays);
        report.push({
          schoolName: school.name,
          slug: school.slug,
          anonymizedCount: count,
          status: 'success',
        });
      } catch (err: any) {
        report.push({
          schoolName: school.name,
          slug: school.slug,
          error: err.message || '알 수 없는 오류',
          status: 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      retentionDays,
      results: report,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
