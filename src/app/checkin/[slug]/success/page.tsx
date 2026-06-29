import React from 'react';
import { readDb } from '@/lib/db';
import SuccessPass from '@/components/SuccessPass';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await readDb();
  const school = db.schools.find((s) => s.slug === slug);
  return {
    title: `${school?.name || '학교'} - 출입 등록 완료`,
    description: `${school?.name || '학교'} 출입 등록 완료 확인증 페이지입니다.`,
  };
}

export default async function SuccessPage({ params }: Props) {
  const { slug } = await params;
  const db = await readDb();
  const school = db.schools.find((s) => s.slug === slug);

  if (!school) {
    notFound();
  }

  return (
    <main>
      <SuccessPass schoolSlug={school.slug} schoolName={school.name} />
    </main>
  );
}
