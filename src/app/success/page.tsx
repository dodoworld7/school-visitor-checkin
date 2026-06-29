import React from 'react';
import { readDb } from '@/lib/db';
import SuccessPass from '@/components/SuccessPass';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서울윤중초등학교 - 입장 완료 확인',
  description: '서울윤중초등학교 입장 완료 확인증 페이지입니다.',
};

export default async function SuccessPage() {
  const db = await readDb();
  const school = db.schools[0]; // Always default to Seoul Yunjung Elementary School

  if (!school) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: 'var(--error)', fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
            학교 정보를 찾을 수 없습니다
          </h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)' }}>
            시스템 설정을 먼저 완료해 주세요.
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
