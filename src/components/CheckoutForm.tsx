'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils';

interface CheckoutFormProps {
  schoolSlug: string;
  schoolName: string;
}

export default function CheckoutForm({ schoolSlug, schoolName }: CheckoutFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [isLargeFont, setIsLargeFont] = useState(false);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContact(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('이름을 입력해 주세요.');
      return;
    }

    if (!contact.trim()) {
      setErrorMsg('휴대폰 번호를 입력해 주세요.');
      return;
    }

    if (!validatePhoneNumber(contact)) {
      setErrorMsg('휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolSlug,
          name: name.trim(),
          contact: contact.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '퇴장 처리에 실패했습니다.');
      }

      setSuccessMsg('퇴장 처리가 정상 완료되었습니다. 안전히 귀가해 주십시오.');
      setCheckoutTime(result.checkoutTime);
      
      // Clear visitorPass session just in case
      sessionStorage.removeItem('visitorPass');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '입장 기록을 찾을 수 없거나 퇴장 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`container ${isLargeFont ? 'large-fonts' : ''}`}>
      {/* Font resize adjustment bar */}
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

      {/* Back to Home Button (Full Width Card) */}
      <div style={{ marginBottom: '16px', width: '100%' }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textDecoration: 'none',
          color: 'var(--primary)',
          fontSize: 'var(--text-base)',
          fontWeight: '700',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.2s',
          width: '100%',
          textAlign: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md), var(--shadow-glow)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        >
          🏠 실시간 방문 현황판(메인화면)으로 돌아가기
        </Link>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ color: 'var(--fg-secondary)', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>방문객 퇴장 등록</span>
          <h1 style={{ marginTop: '8px' }}>{schoolName}</h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)' }}>
            입력하셨던 성함과 연락처를 입력하시면 퇴장 처리가 진행됩니다.
          </p>
        </div>

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--success)',
              fontSize: '32px',
              marginBottom: '16px'
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--success)', marginBottom: '8px' }}>
              퇴장 등록이 완료되었습니다.
            </h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--fg-primary)', marginBottom: '8px' }}>
              {successMsg}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: '24px' }}>
              퇴장 시간: <strong>{checkoutTime}</strong>
            </p>
            <button
              onClick={() => router.push(`/checkin/${schoolSlug}`)}
              className="btn btn-secondary"
            >
              새 방문 등록하기
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn btn-primary"
              style={{ marginTop: '12px' }}
            >
              🏠 실시간 현황판(홈)으로 이동
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">성함</label>
              <input
                type="text"
                className="form-control"
                placeholder="방문 등록 시 입력한 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">휴대폰 번호</label>
              <input
                type="tel"
                className="form-control"
                placeholder="010-0000-0000"
                value={contact}
                onChange={handleContactChange}
                disabled={submitting}
                maxLength={13}
                required
              />
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--error)', fontWeight: 'bold', marginBottom: '16px', fontSize: 'var(--text-base)' }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)' }}
              disabled={submitting}
            >
              {submitting ? '퇴장 처리 중...' : '퇴장 등록하기'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/checkin/${schoolSlug}`)}
              className="btn btn-secondary"
              style={{ marginTop: '12px' }}
              disabled={submitting}
            >
              이전 화면으로
            </button>
          </form>
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
