'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';

interface School {
  id: string;
  slug: string;
  name: string;
  webAppUrl: string;
  spreadsheetUrl?: string;
  createdAt: string;
}

interface Visitor {
  rowIndex: number;
  date: string;
  checkinTime: string;
  checkoutTime: string;
  name: string;
  contact: string;
  purpose: string;
  host: string;
  carNumber: string;
  status: string;
}

interface VisitorBoardProps {
  school: School;
}

export default function VisitorBoard({ school }: VisitorBoardProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [summary, setSummary] = useState({ todayVisits: 0, currentlyIn: 0 });
  const [todayDate, setTodayDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [checkoutQrUrl, setCheckoutQrUrl] = useState('');

  const renderDate = (dateStr: string) => {
    if (!dateStr) return <span style={{ fontSize: 'var(--text-2xl)', color: 'var(--fg-secondary)' }}>조회 중...</span>;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', flexWrap: 'wrap', marginTop: '12px' }}>
        <span style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', color: 'var(--fg-primary)' }}>{parts[0]}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginRight: '8px', fontWeight: 'bold' }}>년</span>
        <span style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', color: 'var(--fg-primary)' }}>{parts[1]}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginRight: '8px', fontWeight: 'bold' }}>월</span>
        <span style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', color: 'var(--fg-primary)' }}>{parts[2]}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', fontWeight: 'bold' }}>일</span>
      </div>
    );
  };

  const fetchVisitorData = async () => {
    if (!school || !school.slug) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/visitors?schoolSlug=${school.slug}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '방문자 정보를 가져오는데 실패했습니다.');
      }
      setVisitors(data.visitors || []);
      setSummary(data.summary || { todayVisits: 0, currentlyIn: 0 });
      setTodayDate(data.todayDate || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '데이터를 로드하는 동안 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 대시보드 테이블 내에서 즉시 퇴장 처리하는 함수
  const handleManualCheckout = async (visitor: Visitor) => {
    if (!confirm(`${visitor.name} 방문객을 수동으로 퇴장 처리하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolSlug: school.slug,
          name: visitor.name,
          contact: visitor.contact,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || '퇴장 처리에 실패했습니다.');
      }

      alert('성공적으로 퇴장 처리되었습니다.');
      // 목록 새로고침
      fetchVisitorData();
    } catch (err: any) {
      alert(err.message || '퇴장 처리 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchVisitorData();
    // 5분마다 자동으로 현황 갱신
    const interval = setInterval(fetchVisitorData, 300000);
    return () => clearInterval(interval);
  }, [school]);

  // 방문객 등록용 및 퇴장 등록용 QR코드 자동 생성
  useEffect(() => {
    if (typeof window !== 'undefined' && school && school.slug) {
      const domain = window.location.origin;
      const checkinUrl = `${domain}/checkin/${school.slug}`;
      const checkoutUrl = `${domain}/checkout`;

      QRCode.toDataURL(checkinUrl, { width: 120, margin: 1 })
        .then(url => setQrUrl(url))
        .catch(err => console.error('Failed to generate Checkin QR Code:', err));

      QRCode.toDataURL(checkoutUrl, { width: 120, margin: 1 })
        .then(url => setCheckoutQrUrl(url))
        .catch(err => console.error('Failed to generate Checkout QR Code:', err));
    }
  }, [school]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. 상단 타이틀 & 로고 */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <h1 style={{ 
          fontSize: 'var(--text-3xl)', 
          fontWeight: '900', 
          color: 'var(--fg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          🏫 {school.name}
        </h1>
        <p className="subtitle" style={{ fontSize: 'var(--text-base)', color: 'var(--fg-secondary)', marginTop: '8px' }}>
          안전하고 투명한 학교를 만드는 방문객 출입 관리 시스템 (관리자 및 교직원 모니터링)
        </p>
      </div>

      {/* 2. 학교 출입 및 퇴장 등록 카드 & QR코드 노출 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: '24px' 
      }}>
        {/* 좌측: 방문 등록 카드 */}
        <Link href={`/checkin/${school.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '20px 24px', 
            cursor: 'pointer',
            height: '100%',
            border: '2px solid var(--primary)',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--primary-glow) 100%)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* 왼쪽 설명 영역 */}
            <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px' }}>📝</span>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '900', color: 'var(--primary)' }}>
                  학교 출입 등록하기 (Check-in)
                </h2>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                방문객은 오른쪽 QR코드를 스마트폰으로 스캔하여 출입 명부를 등록해 주세요.
              </p>
            </div>
            
            {/* 오른쪽 QR코드 노출 영역 */}
            {qrUrl && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                background: '#fff', 
                padding: '8px', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img src={qrUrl} alt="출입등록용 QR코드" style={{ width: '85px', height: '85px' }} />
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '4px' }}>
                  스캔하여 등록
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* 우측: 퇴장 등록 카드 */}
        <Link href="/checkout" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '20px 24px', 
            cursor: 'pointer',
            height: '100%',
            border: '2px solid var(--success)',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* 왼쪽 설명 영역 */}
            <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px' }}>🚪</span>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '900', color: 'var(--success)' }}>
                  학교 퇴장 등록하기 (Check-out)
                </h2>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                학교를 퇴장하실 때 오른쪽 QR코드를 스캔하여 퇴장을 완료해 주세요.
              </p>
            </div>
            
            {/* 오른쪽 QR코드 노출 영역 */}
            {checkoutQrUrl && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                background: '#fff', 
                padding: '8px', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img src={checkoutQrUrl} alt="퇴장등록용 QR코드" style={{ width: '85px', height: '85px' }} />
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '4px' }}>
                  스캔하여 등록
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* 3. 통계 대시보드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px'
      }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>조회 기준 날짜</span>
          {renderDate(todayDate)}
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>오늘 누적 방문객</span>
          <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: '900', color: 'var(--primary)', marginTop: '8px' }}>
            {summary.todayVisits}명
          </h2>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>현재 교내 체류 인원</span>
          <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: '900', color: 'var(--success)', marginTop: '8px' }}>
            {summary.currentlyIn}명
          </h2>
        </div>
      </div>

      {/* 4. 실시간 방문자 목록 현황판 (개인정보 무마스킹, 퇴장 처리 기능 포함) */}
      <div className="card" style={{ padding: '28px 24px', overflowX: 'auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🟢 실시간 방문 현황판
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                5분마다 자동 갱신
              </span>
            </h2>
            <p className="subtitle" style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: '4px' }}>
              ※ 교직원 전용 모니터링 화면으로 개인정보가 마스킹 없이 원본 그대로 노출됩니다.
            </p>
          </div>

          <button 
            onClick={fetchVisitorData}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--fg-primary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '갱신 중...' : '🔄 실시간 현황 새로고침'}
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--error)', fontWeight: 'bold', padding: '12px 0', textAlign: 'center' }}>{error}</div>
        )}

        {loading && visitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-secondary)' }}>
            방문 정보를 불러오는 중입니다...
          </div>
        ) : visitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-secondary)', fontSize: 'var(--text-base)' }}>
            오늘 등록된 방문자가 없습니다.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                <th style={{ padding: '12px 8px' }}>입장 시간</th>
                <th style={{ padding: '12px 8px' }}>방문자 성함</th>
                <th style={{ padding: '12px 8px' }}>연락처</th>
                <th style={{ padding: '12px 8px' }}>방문 목적</th>
                <th style={{ padding: '12px 8px' }}>방문 대상</th>
                <th style={{ padding: '12px 8px' }}>차량번호</th>
                <th style={{ padding: '12px 8px' }}>퇴장 시간</th>
                <th style={{ padding: '12px 8px' }}>상태</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor, index) => {
                const isCurrentlyIn = visitor.status === '입장' && (!visitor.checkoutTime || visitor.checkoutTime.trim() === '');
                return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border)', fontSize: 'var(--text-base)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 'bold' }}>{visitor.checkinTime}</td>
                    <td style={{ padding: '14px 8px', fontWeight: 'bold' }}>{visitor.name}</td>
                    <td style={{ padding: '14px 8px' }}>{visitor.contact}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{ 
                        background: 'var(--bg-primary)', 
                        color: 'var(--fg-primary)', 
                        padding: '4px 8px', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: 'var(--text-xs)',
                        fontWeight: '500'
                      }}>
                        {visitor.purpose}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>{visitor.host}</td>
                    <td style={{ padding: '14px 8px' }}>{visitor.carNumber || '-'}</td>
                    <td style={{ padding: '14px 8px', color: isCurrentlyIn ? 'var(--fg-secondary)' : 'inherit' }}>
                      {visitor.checkoutTime || '체류 중'}
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        background: isCurrentlyIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        color: isCurrentlyIn ? 'var(--success)' : 'var(--fg-secondary)'
                      }}>
                        {isCurrentlyIn ? '교내체류' : '퇴장완료'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      {isCurrentlyIn && (
                        <button
                          onClick={() => handleManualCheckout(visitor)}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--error)',
                            color: 'var(--error)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--error)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-primary)';
                            e.currentTarget.style.color = 'var(--error)';
                          }}
                        >
                          퇴장 처리
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
