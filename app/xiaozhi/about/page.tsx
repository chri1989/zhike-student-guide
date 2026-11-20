import type { Metadata } from 'next';
import { GuideFooter } from '@/components/shared';
import { xiaozhiModelName } from '@/lib/xiaozhi';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '小智说明 · 智科学代指南' };

export default function Page() {
  const record = process.env.XIAOZHI_MODEL_RECORD?.trim();
  return <main className="main-content">
    <a className="back-link" href="/xiaozhi">返回小智</a>
    <article className="detail">
      <h1>小智说明</h1>
      <div className="article-body">
        <p>小智的回复由人工智能生成。</p>
        <p>使用模型 {xiaozhiModelName}</p>
        {record && <p>公示编号 {record}</p>}
      </div>
    </article>
    <GuideFooter/>
  </main>;
}
