'use client';

import React, { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '로그인에 실패했습니다.');
      }

      // Refresh page to trigger server-side auth validation
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '비밀번호가 일치하지 않거나 네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, #1e1b4b 100%)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '48px' }}>🏫</span>
          <h1 style={{ marginTop: '12px', fontSize: 'var(--text-2xl)' }}>학교 출입관리 시스템</h1>
          <p className="subtitle" style={{ fontSize: 'var(--text-sm)' }}>
            통합 관리자 로그인
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">관리자 비밀번호</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoFocus
              required
            />
          </div>

          {errorMsg && (
            <div style={{
              color: 'var(--error)',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontSize: 'var(--text-sm)',
              textAlign: 'center'
            }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? '로그인 중...' : '관리자 로그인'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--fg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div>비밀번호 변경 및 설정은 서버 <code>.env.local</code> 파일을 참조해 주세요.</div>
          <div style={{ fontWeight: 'bold', opacity: 0.8 }}>제작자: 서울윤중초등학교 KDH</div>
        </div>
      </div>
    </div>
  );
}
