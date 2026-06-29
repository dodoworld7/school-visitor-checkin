import React from 'react';
import { readDb } from '@/lib/db';
import SuccessPass from '@/components/SuccessPass';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ schoolSlug: string }> }): Promise<Metadata> {
  const { schoolSlug } = await params;
  const db = await readDb();
  const school = db.schools.find(s => s.slug === schoolSlug);

  return {
    title: school ? `${school.name} - 입장 완료 확인` : '학교 입장 확인증',
    description: school ? `${school.name} 입장 완료 확인증 페이지입니다.` : '존재하지 않는 페이지입니다.',
  };
}

export default async function SuccessPage({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params;
  const db = await readDb();
  const school = db.schools.find(s => s.slug === schoolSlug);

  if (!school) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: 'var(--error)', fontSize: 'var(--text-2xl)', marginBottom: '12px' }}>
            학교 정보를 찾을 수 없습니다
          </h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-base)' }}>
            올바른 URL 경로인지 다시 한번 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main>
      <SuccessPass schoolSlug={school.slug} schoolName={school.name} />
    </main>
  );
}
