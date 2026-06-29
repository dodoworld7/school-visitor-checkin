'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SuccessPassProps {
  schoolSlug: string;
  schoolName: string;
}

interface VisitorSession {
  schoolName: string;
  schoolSlug: string;
  name: string;
  contact: string;
  checkinTime: string;
  date: string;
}

export default function SuccessPass({ schoolSlug, schoolName }: SuccessPassProps) {
  const router = useRouter();
  const [visitor, setVisitor] = useState<VisitorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkoutTime, setCheckoutTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLargeFont, setIsLargeFont] = useState(false);

  useEffect(() => {
    // Read visitor data from sessionStorage
    const saved = sessionStorage.getItem('visitorPass');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VisitorSession;
        // Verify if session belongs to the current school
        if (parsed.schoolSlug === schoolSlug) {
          setVisitor(parsed);
        }
      } catch (e) {
        console.error('Failed to parse session storage:', e);
      }
    }
    setLoading(false);
  }, [schoolSlug]);

  const handleCheckout = async () => {
    if (!visitor) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolSlug,
          name: visitor.name,
          contact: visitor.contact,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '퇴장 처리에 실패했습니다.');
      }

      setCheckedOut(true);
      setCheckoutTime(result.checkoutTime);
      
      // Clear visitorPass from session storage after successful checkout
      sessionStorage.removeItem('visitorPass');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>로딩 중...</div>
      </div>
    );
  }

  // If no visitor session is found (e.g. accessed manually)
  if (!visitor) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>입장 확인 정보를 찾을 수 없습니다</h2>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)', marginBottom: '24px' }}>
            새로고침을 하셨거나 세션이 만료되었습니다. 처음부터 다시 출입을 등록해 주세요.
          </p>
          <button 
            onClick={() => router.push(`/checkin/${schoolSlug}`)} 
            className="btn btn-primary"
          >
            출입 등록하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${isLargeFont ? 'large-fonts' : ''}`}>
      {/* Accessibility Font scale controller */}
      <div className="accessibility-bar">
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>글자 크기 조절:</span>
        <button 
          type="button" 
          onClick={() => setIsLargeFont(false)} 
          className="accessibility-btn"
          style={{ opacity: !isLargeFont ? 1 : 0.6 }}
        >
          기본
        </button>
        <button 
          type="button" 
          onClick={() => setIsLargeFont(true)} 
          className="accessibility-btn"
          style={{ opacity: isLargeFont ? 1 : 0.6, fontSize: '16px' }}
        >
          크게(어르신용)
        </button>
      </div>

      <div className="pass-ticket">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: checkedOut ? 'rgba(94, 109, 126, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: checkedOut ? 'var(--fg-secondary)' : 'var(--success)',
          fontSize: '32px',
          marginBottom: '16px',
          animation: !checkedOut ? 'pulse-glow 2s infinite' : 'none'
        }}>
          {checkedOut ? '✓' : '●'}
        </div>

        <h2 style={{ color: checkedOut ? 'var(--fg-secondary)' : 'var(--success)', fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
          {checkedOut ? '퇴장 완료' : '학교 입장 확인증'}
        </h2>
        <p className="subtitle" style={{ fontSize: 'var(--text-base)', marginTop: '4px' }}>
          {checkedOut ? '안전히 귀가해주시기 바랍니다.' : '배움터 지킴이/보안관실에 제시 후 입장해 주세요.'}
        </p>

        <div style={{
          borderTop: '2px dashed var(--border)',
          borderBottom: '2px dashed var(--border)',
          margin: '28px 0',
          padding: '24px 0',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)' }}>학교명</span>
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{schoolName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)' }}>방문객 성함</span>
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{visitor.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)' }}>휴대폰 번호</span>
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{visitor.contact}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)' }}>방문 일자</span>
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{visitor.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)' }}>입장 등록 시간</span>
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', color: 'var(--primary)' }}>{visitor.checkinTime}</span>
          </div>
          {checkedOut && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              background: 'var(--bg-primary)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              marginTop: '8px'
            }}>
              <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)', fontWeight: 'bold' }}>퇴장 완료 시간</span>
              <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', color: 'var(--fg-secondary)' }}>{checkoutTime}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {!checkedOut ? (
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: '16px' }}>
              교내 용무를 모두 마치고 정문을 나가실 때 아래 버튼을 꼭 눌러주세요.
            </p>
            {errorMsg && (
              <div style={{ color: 'var(--error)', fontWeight: 'bold', marginBottom: '12px', fontSize: 'var(--text-base)' }}>
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)' }}
            >
              {submitting ? '퇴장 처리 중...' : '지금 학교에서 퇴장하기'}
            </button>
          </div>
        ) : (
          <div>
            <button 
              onClick={() => router.push(`/checkin/${schoolSlug}`)} 
              className="btn btn-secondary"
            >
              처음 화면으로 돌아가기
            </button>
          </div>
        )}
      </div>

      <footer style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: 'var(--text-xs)',
        color: 'var(--fg-secondary)',
        opacity: 0.6,
        fontWeight: 'bold',
        letterSpacing: '0.5px'
      }}>
        제작자: 서울윤중초등학교 KDH
      </footer>
    </div>
  );
}
