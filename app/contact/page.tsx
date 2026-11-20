import type { Metadata } from 'next';
import GuideApp from '@/components/guide-app';

export const metadata: Metadata = { title: '联系学代 · 智科学代指南' };
export default function Page(){return <GuideApp contactView/>;}
