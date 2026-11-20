import type { Metadata } from 'next';
import { XiaozhiChat } from '@/components/xiaozhi';

export const metadata: Metadata = { title: '小智问答 · 智科学代指南' };

export default function Page() {
  return <XiaozhiChat/>;
}
