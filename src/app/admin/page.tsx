import React from 'react';
import { verifyAdminSession } from '@/lib/admin-auth';
import { readDb } from '@/lib/db';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '출입관리 시스템 - 통합 관리자',
  description: '학교 방문객 출입관리 통합 대시보드 페이지입니다.',
};

export default async function AdminPage() {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Read schools to supply dashboard initial state
  const db = await readDb();

  return <AdminDashboard initialSchools={db.schools} />;
}
