import type { Metadata } from 'next';
import GuideApp from '@/components/guide-app';
import EvaluationCalculator from '@/components/evaluation-calculator';

export const metadata: Metadata = { title:'综测加分自算器 · 智科学代指南' };

export default function Page() {
  return <GuideApp contentPage={{title:'综测加分自算器',content:<EvaluationCalculator/>}}/>;
}
