import { searchArticles, searchTerms, type Article } from './guide';

export const xiaozhiModelName = '通义千问 Flash';

export type XiaozhiAnswer = {
  answer: string;
  sources: { id: string; title: string; href: string; summary?: string }[];
  resources?: { title: string; href: string }[];
  releaseId: number;
};

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
const questionWords = new Set([
  '请问', '我想', '请问一下', '你好', '我们', '同学', '学校', '校区', '如何', '怎么',
  '什么', '多少', '哪里', '在哪', '哪个', '哪些', '是否', '可以', '需要', '要不要',
  '什么时候', '时间', '晚上', '周末', '今天', '现在', '费用', '价格', '怎么办',
  '资料', '指南', '信息', '内容', '问题', '相关', '珠海', '广州',
]);
const aliases = [
  ['没网', '校园网'], ['没网', '无法连接'], ['断网', '校园网'], ['断网', '无法连接'],
  ['校园网断', '无法连接'],
  ['wifi', '校园网'], ['连不上', '无法连接'],
  ['综评', '综测'], ['综合测评', '综测'],
] as const;
const followup = /^(那|它|这个|这项|那里|还要|还可以|周末呢|晚上呢|刚才|你刚说|你刚才|第二[条种点]|继续|再说)/;

function keywords(question: string) {
  const text = question.normalize('NFKC').toLowerCase();
  const words = Array.from(segmenter.segment(text))
    .filter(({ isWordLike, segment }) => isWordLike && segment.length >= 2 && !questionWords.has(segment))
    .map(({ segment }) => segment);
  const expanded = aliases.filter(([phrase]) => text.includes(phrase)).map(([, word]) => word);
  return [...new Set([...expanded, ...words, ...searchTerms(text)])].filter(word => word.length >= 2 && !questionWords.has(word));
}

export function findXiaozhiEvidence(articles: Article[], question: string, recentQuestions: string[]) {
  const named = articles.filter(article => article.title.length >= 3 && question.includes(article.title)).map(article => article.title);
  const current = [...new Set([...named, ...keywords(question)])];
  const newTopic = named.length > 0 || current.some(term => term.length >= 3 && articles.some(article => article.title.startsWith(term)));
  const prior = followup.test(question) && !newTopic && !aliases.some(([phrase]) => question.includes(phrase))
    ? recentQuestions.findLast(text => !followup.test(text)) : undefined;
  const anchor = prior ? keywords(prior) : current;
  if (!anchor.length) return [];
  const terms = prior ? [...anchor, ...current] : anchor;
  return searchArticles(articles, terms.join('、')).filter(article => {
    const heading = [article.title, ...article.tags].join(' ').toLowerCase();
    if (anchor.some(term => heading.includes(term))) return true;
    const body = (article.summary + ' ' + article.body).toLowerCase();
    return anchor.filter(term => body.includes(term)).length >= 2;
  }).slice(0, 4);
}
