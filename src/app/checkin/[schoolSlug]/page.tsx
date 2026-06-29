import React from 'react';
import { readDb } from '@/lib/db';
import CheckinForm from '@/components/CheckinForm';
import { Metadata } from 'next';

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ schoolSlug: string }> }): Promise<Metadata> {
  const { schoolSlug } = await params;
  const db = await readDb();
  const school = db.schools.find(s => s.slug === schoolSlug);

  return {
    title: school ? `${school.name} - 방문객 출입 등록` : '학교 방문객 출입 등록',
    description: school ? `${school.name} 전자 방문객 출입 명부 페이지입니다.` : '존재하지 않는 학교 페이지입니다.',
  };
}

export default async function CheckinPage({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params;
  const db = await readDb();
  const school = db.schools.find(s => s.slug === schoolSlug);

  if (!school) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: 'var(--error)', fontSize: 'var(--text-2xl)', marginBottom: '12px' }}>
            등록되지 않은 학교 정보
          </h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-base)', marginBottom: '24px' }}>
            입력하신 주소에 해당하는 학교를 찾을 수 없거나 올바르지 않은 QR코드 링크입니다.<br />
            학교 교무실 혹은 정문 경비초소(배움터지킴이실)에 올바른 QR코드 포스터를 재요청해 주세요.
          </p>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            입력된 식별자: <strong>{schoolSlug}</strong>
          </div>
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
