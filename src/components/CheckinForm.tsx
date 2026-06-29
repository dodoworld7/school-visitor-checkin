'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils';

interface School {
  id: string;
  slug: string;
  name: string;
  webAppUrl: string;
  createdAt: string;
}

interface CheckinFormProps {
  school: School;
}

export default function CheckinForm({ school }: CheckinFormProps) {
  const router = useRouter();
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [purpose, setPurpose] = useState('자녀 관련 상담');
  const [customPurpose, setCustomPurpose] = useState('');
  const [host, setHost] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam prevention
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // Monitor network status
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format phone number dynamically as user types
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setContact(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Prevent honeypot trigger (spambot)
    if (honeypot) {
      console.warn('Spam detected via honeypot field.');
      return;
    }

    if (!agree) {
      setErrorMsg('개인정보 수집 및 이용 동의는 필수 사항입니다.');
      return;
    }

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

    if (!host.trim()) {
      setErrorMsg('방문 대상(부서 또는 교사)을 입력해 주세요.');
      return;
    }

    if (purpose === '기타' && !customPurpose.trim()) {
      setErrorMsg('방문 목적을 직접 입력해 주세요.');
      return;
    }

    // Handle offline status
    if (isOffline) {
      setErrorMsg('현재 오프라인 상태입니다. 네트워크 연결 확인 후 다시 시도해 주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const finalPurpose = purpose === '기타' ? `기타 (${customPurpose.trim()})` : purpose;
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolSlug: school.slug,
          name: name.trim(),
          contact: contact.trim(),
          purpose: finalPurpose,
          host: host.trim(),
          carNumber: carNumber.trim(),
          honeypot, // Send honeypot to backend
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '방문 등록에 실패했습니다.');
      }

      // Store visitor token temporarily in sessionStorage for pass validation
      sessionStorage.setItem('visitorPass', JSON.stringify({
        schoolName: school.name,
        schoolSlug: school.slug,
        name: name.trim(),
        contact: contact.trim(),
        checkinTime: result.checkinTime,
        date: result.date,
      }));

      // Redirect to success page
      router.push(`/checkin/${school.slug}/success`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '서버 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`container ${isLargeFont ? 'large-fonts' : ''}`}>
      {/* Accessibility Bar (Font Size Adjuster) */}
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

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>방문객 출입등록</span>
          <h1 style={{ marginTop: '8px' }}>{school.name}</h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)' }}>
            안전한 학교 환경을 위해 출입 기록을 작성해 주세요.
          </p>
        </div>

        {isOffline && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            color: 'var(--error)',
            fontSize: 'var(--text-sm)',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ⚠️ 현재 인터넷 연결이 불안정합니다. 네트워크를 확인하세요.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot hidden field for anti-spam */}
          <input
            type="text"
            name="email_confirm"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Privacy Consent Clause */}
          <div style={{ 
            background: 'var(--bg-primary)', 
            padding: '16px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', marginBottom: '8px' }}>
              개인정보 수집 및 이용 동의 (필수)
            </h3>
            <div style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--fg-secondary)', 
              maxHeight: '120px', 
              overflowY: 'auto',
              lineHeight: '1.5',
              paddingRight: '4px'
            }}>
              <p>본교는 학교 안전 유지 및 방문객 관리를 위해 아래와 같이 개인정보를 수집 및 이용합니다.</p>
              <ul style={{ margin: '8px 0 8px 16px', paddingLeft: '0' }}>
                <li><strong>수집 항목:</strong> 이름, 연락처, 방문 목적, 방문 대상, 차량 번호(해당 시)</li>
                <li><strong>수집 목적:</strong> 학교 출입 통제, 안전사고 예방 및 사고 발생 시 연락</li>
                <li><strong>보유 및 이용 기간:</strong> <strong style={{ color: 'var(--primary)' }}>수집일로부터 30일 보존 후 자동 파기 및 익명화</strong></li>
              </ul>
              <p>귀하는 동의를 거부할 권리가 있으며, 동의하지 않으실 경우 교내 출입이 제한됩니다.</p>
            </div>
            <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
            
            <label className="checkbox-container" style={{ marginBottom: 0 }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-label" style={{ fontSize: 'var(--text-base)' }}>
                위 개인정보 수집 및 이용 안내에 동의합니다.
              </span>
            </label>
          </div>

          {/* Guest Name */}
          <div className="form-group">
            <label className="form-label">
              이름 <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="방문자 성명을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              maxLength={10}
              required
            />
          </div>

          {/* Contact */}
          <div className="form-group">
            <label className="form-label">
              휴대폰 번호 <span className="required">*</span>
            </label>
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

          {/* Purpose */}
          <div className="form-group">
            <label className="form-label">
              방문 목적 <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={submitting}
            >
              <option value="자녀 관련 상담">자녀 관련 상담</option>
              <option value="공사 및 납품">공사 및 납품</option>
              <option value="학교 회의 참석">학교 회의 참석</option>
              <option value="외부 강사">외부 강사</option>
              <option value="기타">기타 (직접 입력)</option>
            </select>
          </div>

          {/* Custom Purpose */}
          {purpose === '기타' && (
            <div className="form-group" style={{ marginTop: '-12px' }}>
              <label className="form-label" style={{ fontSize: 'var(--text-base)' }}>
                방문 목적 직접 입력 <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="방문 목적을 자세히 적어주세요"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                disabled={submitting}
                maxLength={40}
                required
              />
            </div>
          )}

          {/* Host Person / Department */}
          <div className="form-group">
            <label className="form-label">
              방문 대상 (부서 또는 교사명) <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="예: 교무실, 3학년 1반 담임선생님"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              disabled={submitting}
              maxLength={30}
              required
            />
          </div>

          {/* Car Number (Optional) */}
          <div className="form-group">
            <label className="form-label">
              차량 번호 (선택)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="예: 12가3456"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              disabled={submitting}
              maxLength={15}
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{ color: 'var(--error)', fontWeight: 'bold', marginBottom: '16px', fontSize: 'var(--text-base)' }}>
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !agree}
          >
            {submitting ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></span>
                저장 중...
              </>
            ) : (
              '방문 등록 제출하기'
            )}
          </button>
        </form>
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

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
