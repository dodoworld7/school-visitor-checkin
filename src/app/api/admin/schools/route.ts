import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { readDb, writeDb, School } from '@/lib/db';
import { testWrite } from '@/lib/google-sheets';
import crypto from 'crypto';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ message: '인증 권한이 없습니다.' }, { status: 401 });
    }

    const db = await readDb();
    return NextResponse.json({ schools: db.schools });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Session verification
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ message: '인증 권한이 없습니다.' }, { status: 401 });
    }

    // 2. Body parsing
    const { name, webAppUrl } = await request.json();
    if (!name || !name.trim() || !webAppUrl || !webAppUrl.trim()) {
      return NextResponse.json({ message: '학교명과 구글 앱스 스크립트 웹앱 주소는 필수입니다.' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanWebAppUrl = webAppUrl.trim();

    // 3. Authority write test on the Apps Script Web App
    let spreadsheetUrl = '';
    try {
      spreadsheetUrl = await testWrite(cleanWebAppUrl);
    } catch (err: any) {
      return NextResponse.json(
        { 
          message: err.message || '구글 앱스 스크립트 웹앱에 접근할 수 없습니다. 웹앱 주소를 정확히 복사하셨는지, 그리고 배포 시 [액세스 권한: 모든 사용자]로 설정하셨는지 확인해 주세요.' 
        }, 
        { status: 400 }
      );
    }

    // 4. Generate secure dynamic slug & ID
    const db = await readDb();
    
    // Check if webAppUrl already registered
    const exists = db.schools.find(s => s.webAppUrl === cleanWebAppUrl);
    if (exists) {
      return NextResponse.json({ message: '이미 등록된 구글 앱스 스크립트 웹앱 주소입니다.' }, { status: 400 });
    }

    const randomSuffix = crypto.randomBytes(4).toString('hex'); // 8 hex characters
    const slug = `school-${randomSuffix}`;

    const newSchool: School = {
      id: crypto.randomUUID(),
      slug,
      name: cleanName,
      webAppUrl: cleanWebAppUrl,
      spreadsheetUrl,
      createdAt: new Date().toISOString(),
    };

    // Save back to db
    db.schools.push(newSchool);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      school: newSchool,
    });
  } catch (error: any) {
    console.error('Failed to register school:', error);
    return NextResponse.json(
      { message: error.message || '학교 등록 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
