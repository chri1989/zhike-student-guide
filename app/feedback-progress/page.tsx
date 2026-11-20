import type { Metadata } from 'next';
import GuideApp from '@/components/guide-app';
import { ProgressWall } from '@/components/site-progress';

export const metadata: Metadata = { title:'诉求追踪墙 · 智科学代指南' };

export default function Page() {
  return <GuideApp contentPage={{title:'诉求追踪墙',content:<ProgressWall/>}}/>;
}
