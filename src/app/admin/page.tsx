import React from 'react';
import { readDb } from '@/lib/db';
import AdminDashboard from '@/components/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서울윤중초등학교 - 출입관리 관리자',
  description: '서울윤중초등학교 방문객 출입관리 대시보드 페이지입니다.',
};

export default async function AdminPage() {
  // Read schools to supply dashboard initial state
  const db = await readDb();

  return <AdminDashboard initialSchools={db.schools} />;
}
