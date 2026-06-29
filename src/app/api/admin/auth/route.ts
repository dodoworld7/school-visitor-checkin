import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, setAdminSession, clearAdminSession } from '@/lib/admin-auth';

export async function GET() {
  const isAuthenticated = await verifyAdminSession();
  return NextResponse.json({ isAuthenticated });
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin1234';

    if (password === expectedPassword) {
      await setAdminSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { message: '비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin authentication failure:', error);
    return NextResponse.json(
      { message: '서버 인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
