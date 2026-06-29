import React from 'react';
import { readDb } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function CheckinDefaultPage() {
  const db = await readDb();
  const school = db.schools[0]; // Always default to Seoul Yunjung Elementary School

  if (!school) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: 'var(--error)', fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
            등록된 학교 정보가 없습니다
          </h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)' }}>
            시스템 설정을 먼저 완료해 주세요.
          </p>
        </div>
      </div>
    );
  }

  // 디폴트 학교 상세 방문 등록 페이지로 리다이렉션
  redirect(`/checkin/${school.slug}`);
}
