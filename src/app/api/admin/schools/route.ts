import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb, School } from '@/lib/db';
import { testWrite } from '@/lib/google-sheets';

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json({ schools: db.schools });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Body parsing
    const { name, webAppUrl } = await request.json();
    if (!webAppUrl || !webAppUrl.trim()) {
      return NextResponse.json({ message: '구글 앱스 스크립트 웹앱 주소는 필수입니다.' }, { status: 400 });
    }

    const cleanName = name ? name.trim() : '서울윤중초등학교';
    const cleanWebAppUrl = webAppUrl.trim();

    // 2. Authority write test on the Apps Script Web App
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

    // 3. Update single Yunjung School entry in database
    const db = await readDb();
    
    const updatedSchool: School = {
      id: 'yunjung-elementary-school-id',
      slug: 'yunjung',
      name: cleanName,
      webAppUrl: cleanWebAppUrl,
      spreadsheetUrl,
      createdAt: new Date().toISOString(),
    };

    // Replace school list with single record
    db.schools = [updatedSchool];
    await writeDb(db);

    return NextResponse.json({
      success: true,
      school: updatedSchool,
    });
  } catch (error: any) {
    console.error('Failed to update school settings:', error);
    return NextResponse.json(
      { message: error.message || '설정 갱신 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
