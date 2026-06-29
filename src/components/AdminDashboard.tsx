'use client';

import React, { useState, useEffect } from 'react';
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

interface AdminDashboardProps {
  initialSchools: School[];
}

export default function AdminDashboard({ initialSchools }: AdminDashboardProps) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schools'>('dashboard');
  
  // Selected school for visitors dashboard
  const [selectedSchoolSlug, setSelectedSchoolSlug] = useState<string>(
    initialSchools.length > 0 ? initialSchools[0].slug : ''
  );
  
  // Visitor stats state
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [summary, setSummary] = useState({ todayVisits: 0, currentlyIn: 0 });
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [visitorError, setVisitorError] = useState('');

  // School registration form state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newWebAppUrl, setNewWebAppUrl] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Poster Modal state
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [posterSchool, setPosterSchool] = useState<School | null>(null);
  const [posterQrUrl, setPosterQrUrl] = useState('');

  // Fetch visitors for the selected school
  const fetchVisitorData = async (slug: string) => {
    if (!slug) return;
    setLoadingVisitors(true);
    setVisitorError('');
    try {
      const response = await fetch(`/api/admin/visitors?schoolSlug=${slug}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '방문자 정보를 가져오는데 실패했습니다.');
      }
      setVisitors(data.visitors || []);
      setSummary(data.summary || { todayVisits: 0, currentlyIn: 0 });
    } catch (err: any) {
      console.error(err);
      setVisitorError(err.message || '데이터를 로드하는 동안 에러가 발생했습니다.');
    } finally {
      setLoadingVisitors(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && selectedSchoolSlug) {
      fetchVisitorData(selectedSchoolSlug);
    }
  }, [activeTab, selectedSchoolSlug]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      window.location.reload();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  // Register a new school
  const handleRegisterSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    
    if (!newSchoolName.trim() || !newWebAppUrl.trim()) {
      setRegisterError('학교명과 구글 앱스 스크립트 웹앱 주소를 모두 입력해 주세요.');
      return;
    }

    if (!newWebAppUrl.startsWith('https://script.google.com/')) {
      setRegisterError('구글 앱스 스크립트 웹앱 주소 형식이 올바르지 않습니다. (https://script.google.com/ 로 시작해야 함)');
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSchoolName.trim(),
          webAppUrl: newWebAppUrl.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '학교 등록에 실패했습니다.');
      }

      setRegisterSuccess(`'${result.school.name}'이(가) 성공적으로 연동 및 등록되었습니다.`);
      setSchools([...schools, result.school]);
      
      // Select registered school immediately if it's the first one
      if (schools.length === 0) {
        setSelectedSchoolSlug(result.school.slug);
      }
      
      setNewSchoolName('');
      setNewWebAppUrl('');
    } catch (err: any) {
      console.error(err);
      setRegisterError(err.message || '앱스 스크립트 주소 연동 테스트 실패. 웹앱 배포 상태를 다시 점검해 주세요.');
    } finally {
      setRegistering(false);
    }
  };

  // Manual checkout from admin dashboard
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
          schoolSlug: selectedSchoolSlug,
          name: visitor.name,
          contact: visitor.contact,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || '퇴장 처리에 실패했습니다.');
      }

      alert('성공적으로 퇴장 처리되었습니다.');
      // Refresh current visitor list
      fetchVisitorData(selectedSchoolSlug);
    } catch (err: any) {
      alert(err.message || '퇴장 처리 중 오류가 발생했습니다.');
    }
  };

  // Generate QR Poster Modal
  const handleOpenPoster = async (school: School) => {
    setPosterSchool(school);
    const domain = window.location.origin;
    const checkinUrl = `${domain}/checkin/${school.slug}`;
    try {
      const dataUrl = await QRCode.toDataURL(checkinUrl, { width: 300, margin: 2 });
      setPosterQrUrl(dataUrl);
      setShowPosterModal(true);
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
    }
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !posterSchool) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${posterSchool.name} QR 출입증 포스터</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
            body {
              font-family: 'Noto Sans KR', sans-serif;
              text-align: center;
              padding: 40px;
              color: #1e293b;
              margin: 0;
            }
            .border-wrap {
              border: 15px double #3b82f6;
              border-radius: 20px;
              padding: 60px 40px;
              max-width: 700px;
              margin: 0 auto;
              height: calc(100vh - 150px);
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header-badge {
              font-size: 24px;
              color: #3b82f6;
              font-weight: 700;
              letter-spacing: 2px;
            }
            h1 {
              font-size: 42px;
              font-weight: 900;
              margin: 15px 0;
              color: #0f172a;
            }
            .divider {
              width: 80px;
              height: 4px;
              background-color: #3b82f6;
              margin: 0 auto 30px auto;
            }
            .description {
              font-size: 18px;
              color: #64748b;
              line-height: 1.6;
              margin-bottom: 40px;
            }
            .qr-container {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              display: inline-block;
              margin: 0 auto;
            }
            .qr-image {
              width: 250px;
              height: 250px;
            }
            .instructions {
              text-align: left;
              max-width: 480px;
              margin: 40px auto 0 auto;
              font-size: 15px;
              color: #475569;
              line-height: 1.8;
            }
            .instructions ol {
              padding-left: 20px;
            }
            .footer-school {
              font-size: 28px;
              font-weight: 700;
              margin-top: 50px;
              color: #1e293b;
            }
            @media print {
              body { padding: 0; }
              .border-wrap { height: 95vh; }
            }
          </style>
        </head>
        <body>
          <div class="border-wrap">
            <div>
              <div class="header-badge">방문객 QR 등록처</div>
              <h1>방문객 QR 출입 등록 안내</h1>
              <div class="divider"></div>
              <p class="description">
                안전하고 투명한 학교 관리를 위하여 교내를 방문하시는<br />
                모든 내방객은 아래 QR코드를 스캔하여 출입 등록을 완료해 주십시오.
              </p>
            </div>
            
            <div>
              <div class="qr-container">
                <img class="qr-image" src="${posterQrUrl}" alt="QR Code" />
              </div>
            </div>
            
            <div>
              <div class="instructions">
                <strong style="color: #0f172a; font-size: 16px;">[등록 방법]</strong>
                <ol>
                  <li>스마트폰 카메라 앱을 실행합니다.</li>
                  <li>위 QR코드를 스캔하여 웹사이트 링크에 접속합니다.</li>
                  <li>개인정보 동의 후 방문 항목(성함, 목적 등)을 정확히 작성합니다.</li>
                  <li>제출 후 표시되는 <strong>[학교 입장 확인증]</strong>을 지킴이 선생님께 보여주세요.</li>
                </ol>
              </div>
              <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; font-weight: bold; text-align: center;">제작자: 서울윤중초등학교 KDH</div>
              <div class="footer-school">${posterSchool.name}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navbar */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🏫</span>
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>방문객 출입관리 통합관리자</span>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <nav style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: activeTab === 'dashboard' ? 'var(--primary-glow)' : 'transparent',
                  color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--fg-primary)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 'var(--text-sm)'
                }}
              >
                📊 방문 현황
              </button>
              <button
                onClick={() => setActiveTab('schools')}
                style={{
                  background: activeTab === 'schools' ? 'var(--primary-glow)' : 'transparent',
                  color: activeTab === 'schools' ? 'var(--primary)' : 'var(--fg-primary)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 'var(--text-sm)'
                }}
              >
                ⚙️ 학교 및 시트 관리
              </button>
            </nav>

            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                color: 'var(--fg-secondary)'
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Tab 1: Live Visitors Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '16px',
              marginBottom: '28px' 
            }}>
              <div>
                <h1>당일 방문객 모니터링</h1>
                <p className="subtitle" style={{ fontSize: 'var(--text-sm)' }}>실시간 학교 방문 현황입니다.</p>
              </div>

              {/* School Selector dropdown */}
              <div>
                <select
                  className="form-control"
                  style={{ fontSize: 'var(--text-base)', padding: '10px 32px 10px 16px', width: '260px' }}
                  value={selectedSchoolSlug}
                  onChange={(e) => setSelectedSchoolSlug(e.target.value)}
                  disabled={schools.length === 0}
                >
                  {schools.length === 0 ? (
                    <option value="">등록된 학교 없음</option>
                  ) : (
                    schools.map(s => (
                      <option key={s.id} value={s.slug}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {schools.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <span style={{ fontSize: '48px' }}>🔍</span>
                <h3 style={{ marginTop: '16px', fontSize: 'var(--text-lg)' }}>등록된 학교가 없습니다.</h3>
                <p className="subtitle" style={{ fontSize: 'var(--text-sm)', marginBottom: '24px' }}>
                  우측 상단의 "학교 및 시트 관리" 탭을 눌러 첫 학교를 등록해 주세요.
                </p>
                <button 
                  onClick={() => setActiveTab('schools')}
                  className="btn btn-primary"
                  style={{ width: 'auto', display: 'inline-flex' }}
                >
                  학교 등록하러 가기
                </button>
              </div>
            ) : (
              <div>
                {/* Statistics Cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                    <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)', fontWeight: 'bold' }}>오늘 누적 방문객</span>
                    <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: '900', color: 'var(--primary)', marginTop: '12px' }}>
                      {summary.todayVisits}명
                    </h2>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                    <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)', fontWeight: 'bold' }}>현재 교내 체류 인원</span>
                    <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: '900', color: 'var(--success)', marginTop: '12px' }}>
                      {summary.currentlyIn}명
                    </h2>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                    <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-base)', fontWeight: 'bold' }}>데이터 연동 상태</span>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '900', color: 'var(--success)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ● 정상 (Apps Script)
                    </h2>
                  </div>
                </div>

                {/* Visitor Lists table */}
                <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>당일 방문 목록</h2>
                    <button 
                      onClick={() => fetchVisitorData(selectedSchoolSlug)}
                      disabled={loadingVisitors}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--fg-primary)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--text-xs)'
                      }}
                    >
                      {loadingVisitors ? '갱신 중...' : '🔄 목록 새로고침'}
                    </button>
                  </div>

                  {visitorError && (
                    <div style={{ color: 'var(--error)', fontWeight: 'bold', padding: '12px 0' }}>{visitorError}</div>
                  )}

                  {loadingVisitors && visitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-secondary)' }}>
                      방문 정보를 불러오는 중입니다...
                    </div>
                  ) : visitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-secondary)' }}>
                      오늘 등록된 방문자가 없습니다.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                          <th style={{ padding: '12px 8px' }}>입장 시간</th>
                          <th style={{ padding: '12px 8px' }}>성함</th>
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
                                <span style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                                  {visitor.purpose}
                                </span>
                              </td>
                              <td style={{ padding: '14px 8px' }}>{visitor.host}</td>
                              <td style={{ padding: '14px 8px' }}>{visitor.carNumber || '-'}</td>
                              <td style={{ padding: '14px 8px', color: isCurrentlyIn ? 'var(--fg-secondary)' : 'inherit' }}>
                                {visitor.checkoutTime || '미퇴장'}
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
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      cursor: 'pointer',
                                      fontSize: 'var(--text-xs)',
                                      fontWeight: 'bold'
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
            )}
          </div>
        )}

        {/* Tab 2: Schools & Google Apps Script configuration */}
        {activeTab === 'schools' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
            
            {/* Left Column: Registration & Help Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* New School Registration Card */}
              <div className="card">
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', marginBottom: '8px' }}>신규 학교 등록</h2>
                <p className="subtitle" style={{ fontSize: 'var(--text-sm)', marginBottom: '24px' }}>
                  학교 구글 스프레드시트의 **[확장 프로그램] &gt; [Apps Script]** 에서 배포된 웹앱 주소(URL)를 입력해 주세요.
                </p>

                <form onSubmit={handleRegisterSchool}>
                  <div className="form-group">
                    <label className="form-label">학교명</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="예: 서울윤중초등학교"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      disabled={registering}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">구글 앱스 스크립트 웹앱 주소 (URL)</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={newWebAppUrl}
                      onChange={(e) => setNewWebAppUrl(e.target.value)}
                      disabled={registering}
                      required
                    />
                    <span className="form-desc" style={{ marginTop: '4px' }}>
                      배포 시 [액세스 권한: 모든 사용자]로 배포해야 정상 작동합니다.
                    </span>
                  </div>

                  {registerError && (
                    <div style={{ color: 'var(--error)', fontWeight: 'bold', marginBottom: '16px', fontSize: 'var(--text-sm)' }}>
                      {registerError}
                    </div>
                  )}

                  {registerSuccess && (
                    <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '16px', fontSize: 'var(--text-sm)' }}>
                      {registerSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={registering}
                  >
                    {registering ? '앱스 스크립트 연동테스트 중...' : '학교 연결 및 등록'}
                  </button>
                </form>
              </div>

              {/* Help Guide Card */}
              <div className="card" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.04)' }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)' }}>
                  💡 초보자용: 3분 구글 시트 연동 가이드
                </h3>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-primary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6' }}>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>1단계. 구글 스프레드시트 준비</strong>
                    <div style={{ color: 'var(--fg-secondary)', paddingLeft: '12px', marginTop: '2px' }}>
                      원하는 구글 계정으로 로그인한 뒤 빈 스프레드시트 문서를 만듭니다.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>2단계. 코드 복사 & 붙여넣기</strong>
                    <div style={{ color: 'var(--fg-secondary)', paddingLeft: '12px', marginTop: '2px' }}>
                      스프레드시트 상단 메뉴의 <strong>[확장 프로그램] &gt; [Apps Script]</strong>를 누르고, 이 웹 프로젝트의 루트 폴더에 들어있는 <strong>GoogleAppsScript.js</strong> 파일 내용 전체를 복사해서 붙여넣은 뒤 저장(💾) 버튼을 누릅니다.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>3단계. 웹앱 배포 설정 (가장 중요)</strong>
                    <div style={{ color: 'var(--fg-secondary)', paddingLeft: '12px', marginTop: '2px' }}>
                      우측 상단 <strong>[배포] &gt; [새 배포]</strong>를 클릭한 뒤, 유형을 <strong>웹앱</strong>으로 선택하고 아래와 같이 권한을 설정합니다.
                      <ul style={{ paddingLeft: '20px', marginTop: '4px', listStyleType: 'circle' }}>
                        <li>웹앱을 실행할 사용자: <strong>나(도현님 구글 계정)</strong></li>
                        <li>액세스 권한이 있는 사용자: <strong style={{ color: 'var(--error)' }}>모든 사용자(Anyone)</strong></li>
                      </ul>
                      이후 [배포] 버튼을 누르고 구글 계정 액세스 승인(허용)을 진행합니다.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>4단계. 웹앱 URL 입력</strong>
                    <div style={{ color: 'var(--fg-secondary)', paddingLeft: '12px', marginTop: '2px' }}>
                      배포 완료창에 나타난 <strong>웹앱 URL</strong> 주소를 복사하여 위의 <strong>[구글 앱스 스크립트 웹앱 주소]</strong> 란에 붙여넣고 학교 연결을 누르면 즉시 완료됩니다!
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Registered Schools List */}
            <div>
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', marginBottom: '16px' }}>
                  등록된 학교 목록 ({schools.length})
                </h2>

                {schools.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-secondary)' }}>
                    등록된 학교 정보가 없습니다.
                  </div>
                ) : (
                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {schools.map((school) => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                      const checkinUrl = `${origin}/checkin/${school.slug}`;
                      return (
                        <div 
                          key={school.id} 
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: 'var(--text-base)' }}>{school.name}</strong>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: '2px' }}>
                                등록일: {new Date(school.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <span style={{
                              background: 'rgba(96, 165, 250, 0.1)',
                              color: 'var(--primary)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)'
                            }}>
                              {school.slug}
                            </span>
                          </div>

                          <div style={{ fontSize: 'var(--text-sm)' }}>
                            <div style={{ color: 'var(--fg-secondary)' }}>출입 등록 주소(URL)</div>
                            <a 
                              href={checkinUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: 'var(--primary)', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 'bold' }}
                            >
                              {checkinUrl}
                            </a>
                          </div>

                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <button
                              onClick={() => handleOpenPoster(school)}
                              className="btn btn-secondary"
                              style={{ 
                                fontSize: 'var(--text-xs)', 
                                padding: '8px 12px', 
                                border: '1px solid var(--primary)', 
                                color: 'var(--primary)',
                                background: 'transparent'
                              }}
                            >
                              🖨️ QR 인쇄 포스터 생성
                            </button>
                            {school.spreadsheetUrl && (
                              <a
                                href={school.spreadsheetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ 
                                  fontSize: 'var(--text-xs)', 
                                  padding: '8px 12px',
                                  textDecoration: 'none',
                                  textAlign: 'center'
                                }}
                              >
                                📊 시트 바로 열기
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Poster Generation Modal (A4 Print layout) */}
      {showPosterModal && posterSchool && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>인쇄용 QR 포스터</h2>
              <button 
                onClick={() => setShowPosterModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--fg-secondary)' }}
              >
                &times;
              </button>
            </div>

            <p className="subtitle" style={{ fontSize: 'var(--text-sm)', marginTop: '-8px' }}>
              아래 안내 포스터는 A4 규격에 맞춰 제작되었습니다. "포스터 인쇄창 열기" 버튼을 누르시면 프린터 다이얼로그가 자동 실행됩니다.
            </p>

            <div style={{
              background: '#fff',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              color: '#0f172a'
            }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--primary)' }}>방문객 QR 등록처</span>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '4px 0 12px 0' }}>방문객 QR 출입 등록 안내</h3>
              
              <div style={{ display: 'inline-block', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                {posterQrUrl && <img src={posterQrUrl} alt="QR Code Preview" style={{ width: '140px', height: '140px' }} />}
              </div>

              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{posterSchool.name}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handlePrintPoster} 
                className="btn btn-primary"
              >
                포스터 인쇄창 열기
              </button>
              <button 
                onClick={() => setShowPosterModal(false)} 
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: 'var(--text-xs)',
        color: 'var(--fg-secondary)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        opacity: 0.8,
        fontWeight: 'bold',
        marginTop: 'auto'
      }}>
        제작자: 서울윤중초등학교 KDH
      </footer>
    </div>
  );
}
