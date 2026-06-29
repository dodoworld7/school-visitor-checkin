import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, #1e1b4b 100%)',
      padding: '16px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🛡️</span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 'var(--text-lg)', letterSpacing: '1px' }}>
            SCHOOL SAFETY NET
          </span>
          <h1 style={{ marginTop: '8px', fontSize: 'var(--text-3xl)' }}>학교 방문객 출입관리</h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-base)', marginTop: '8px' }}>
            QR 코드를 이용한 빠르고 안전한 전자 방문증 관리 시스템
          </p>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '28px',
          fontSize: 'var(--text-sm)',
          color: 'var(--fg-secondary)',
          lineHeight: '1.7'
        }}>
          <strong style={{ color: 'var(--fg-primary)', display: 'block', marginBottom: '8px', fontSize: 'var(--text-base)' }}>
            💡 이용 안내
          </strong>
          1. 각 학교의 <strong>정문 및 행정실 앞 QR코드</strong>를 스캔하시면 해당 학교의 전용 입력 화면으로 연결됩니다.<br />
          2. 방문 정보를 정확히 입력하시면 즉시 <strong>[학교 입장 확인증]</strong>이 발급됩니다.<br />
          3. 관리자는 대시보드에서 방문객 현황을 실시간으로 확인하고 제어할 수 있습니다.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/admin" className="btn btn-primary">
            🔑 통합 관리자 대시보드 바로가기
          </Link>
          
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: '8px' }}>
            본 시스템은 교육청 및 학교 개인정보 보호 지침을 준수하며, 수집된 정보는 30일 보존 후 복구 불가능한 방법으로 자동 익명화/파기됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
