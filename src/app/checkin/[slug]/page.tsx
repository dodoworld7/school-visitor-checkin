import React from 'react';
import { readDb } from '@/lib/db';
import CheckinForm from '@/components/CheckinForm';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await readDb();
  const school = db.schools.find((s) => s.slug === slug);
  return {
    title: `${school?.name || '학교'} - 방문객 출입 등록`,
    description: `${school?.name || '학교'} 전자 방문객 출입 명부 페이지입니다.`,
  };
}

export default async function CheckinPage({ params }: Props) {
  const { slug } = await params;
  const db = await readDb();
  const school = db.schools.find((s) => s.slug === slug);

  if (!school) {
    notFound();
  }

  if (!school.webAppUrl) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--error)', maxWidth: '520px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: 'var(--error)', fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
            시스템 설정 대기 중
          </h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)', marginBottom: '24px', lineHeight: '1.6' }}>
            구글 스프레드시트 연동 설정이 아직 완료되지 않았습니다.<br />
            아래 버튼을 눌러 관리자 페이지로 이동하신 뒤, 구글 앱스 스크립트 웹앱 주소를 등록해 주세요.
          </p>
          <a href="/admin" className="btn btn-primary" style={{ display: 'inline-block', width: 'auto', textDecoration: 'none' }}>
            ⚙️ 관리자 대시보드 바로가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <main>
      <CheckinForm school={school} />
    </main>
  );
}
