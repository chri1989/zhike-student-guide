'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, MessageSquare, Send } from 'lucide-react';
import type { XiaozhiAnswer } from '@/lib/xiaozhi';
import { GuideFooter } from './shared';
import { recordGuideActivity } from './guide-interaction';

type Availability = { enabled: false } | { enabled: true; model: string; record: string };
type Turn = XiaozhiAnswer & { question: string };
const sampleQuestions = ['综测总分怎么计算？','校内办事去哪里找部处？','宿舍坏了怎么报修？','最近学习压力挺大，可以找谁聊聊？'];

function useAvailability() {
  const [status, setStatus] = useState<Availability | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/xiaozhi', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : { enabled: false })
      .then(value => setStatus(value))
      .catch(() => { if (!controller.signal.aborted) setStatus({ enabled: false }); });
    return () => controller.abort();
  }, []);
  return status;
}

export function XiaozhiLauncher() {
  const status = useAvailability();
  return status?.enabled ? (
    <a className="button primary xiaozhi-launcher" href="/xiaozhi" aria-label="打开小智问答">
      <span className="xiaozhi-sprite" aria-hidden="true"/>小智
    </a>
  ) : null;
}

export function XiaozhiChat() {
  const status = useAvailability();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const messages = useRef<HTMLDivElement>(null);

  useEffect(() => { recordGuideActivity('visit').catch(() => {}); }, []);

  useEffect(() => {
    const view = messages.current;
    if (view) view.scrollTop = view.scrollHeight;
  }, [turns, pending]);

  async function ask(value:string) {
    const question = value.trim();
    if (!question || sending.current || !status?.enabled) return;
    sending.current = true;
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/xiaozhi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ question, recentTurns: turns.slice(-3).map(({ question, answer }) => ({ question, answer })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '小智暂时无法回答。');
      setTurns(previous => [...previous, { ...result, question }]);
      setDraft('');
    } catch (failure) {
      setError(failure instanceof Error && failure.name === 'Error' ? failure.message : '连接暂时不可用，请稍后再试。');
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <main className="xiaozhi-page">
      <header className="xiaozhi-topbar">
        <a className="back-link" href="/" aria-label="返回指南"><ArrowLeft size={18}/><span>返回指南</span></a>
        <div className="xiaozhi-title">
          {turns.length > 0 && <span className="xiaozhi-sprite" aria-hidden="true"/>}
          <h1>小智问答</h1>
          {status?.enabled && <a className="xiaozhi-ai-mark" href="/xiaozhi/about" aria-label="AI 生成，查看小智说明">AI 生成</a>}
        </div>
        <div className="xiaozhi-actions">
          <a href="/feedback" aria-label="问题反馈" title="问题反馈"><MessageSquare size={18}/></a>
        </div>
      </header>
      <section className="xiaozhi-panel" aria-label="小智对话">
        {status?.enabled?<div className="xiaozhi-suggestions" role="group" aria-label="快捷提问">
          {sampleQuestions.map(question=><button key={question} type="button" disabled={pending} onClick={()=>void ask(question)}>{question}</button>)}
        </div>:null}
        <div className="xiaozhi-messages" ref={messages} role="log" aria-label="对话记录" aria-live="polite">
          {turns.length === 0 && !pending && <div className="xiaozhi-welcome">
            <p className="xiaozhi-greeting">哈喽！我是小智，学代指南的小助理，有什么可以帮你吗？</p>
            <span className="xiaozhi-sprite xiaozhi-mascot" aria-hidden="true"/>
          </div>}
          {turns.map((turn, index) => (
            <div className="xiaozhi-turn" key={index}>
              <p className="xiaozhi-question">{turn.question}</p>
              <div className="xiaozhi-answer">
                <p>{turn.answer}</p>
                {turn.sources.length > 0 && <ul className="xiaozhi-references" aria-label="站内链接">{turn.sources.map(source => <li key={source.id}><a href={source.href}>
                  <BookOpen size={16}/><span><strong>{source.kind==='入口'?`打开${source.title}`:source.kind==='推文'?source.title:`依据《${source.title}》`}</strong>{source.summary?<small>{source.summary}</small>:null}</span><ArrowUpRight size={15}/>
                </a></li>)}</ul>}
                {turn.resources?.length ? <ul className="xiaozhi-references" aria-label="学校与学院资源">{turn.resources.map(source=><li key={source.href}><a href={source.href} target="_blank" rel="noreferrer"><BookOpen size={16}/><span>{source.title}</span><ArrowUpRight size={15}/></a></li>)}</ul>:null}
              </div>
            </div>
          ))}
          {pending && <p className="muted" role="status">小智正在回复…</p>}
        </div>
        <div className="xiaozhi-composer">
          {error && <p role="alert" className="error-banner">{error}</p>}
          {status?.enabled ? (
            <form className="xiaozhi-form" onSubmit={(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();void ask(draft);}}>
              <textarea aria-label="向小智提问" placeholder="输入消息" maxLength={500} rows={2} value={draft}
                readOnly={pending} onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }}/>
              <button type="submit" className="button primary" disabled={pending || !draft.trim()}><Send size={16} aria-hidden="true"/>发送</button>
            </form>
          ) : <p className="muted" role="status">{status ? '小智问答暂未开放。' : '正在连接小智…'}</p>}
        </div>
      </section>
      <GuideFooter/>
    </main>
  );
}
