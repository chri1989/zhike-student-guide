import categoryData from '@/data/categories.json';
export type GuideImage = { src: string; alt: string };
export type Article = {
  id: string; title: string; category: string; summary: string; body: string;
  tags: string[]; images: GuideImage[]; verification: string; featured: boolean;
  sources?: {sheet: string; cells: string[]}[]; updatedAt?: string;
};
export type Change = { id: string; title: string; kind: 'added' | 'updated' | 'removed' };
export type Release = { id: number; summary: string; changes: Change[]; publisher: string; publishedAt: string };
export type Guide = { categories: typeof categoryData; articles: Article[]; release: Release };
export const categories = categoryData;
export const changeLabels = { added: '新增', updated: '修改', removed: '停用' };
export function dateLabel(value?: string, time = false) {
  if (!value) return '原表整理';
  return new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', year:'numeric',month:'2-digit',day:'2-digit', ...(time?{hour:'2-digit',minute:'2-digit'}:{}) }).format(new Date(value));
}
export function searchTerms(query: string) {
  const q = query.trim().toLowerCase().replace(/\s+/g,'');
  const terms = q.split(/[，,、]/).filter(Boolean);
  const aliases = [['连不上','无法连接'],['断网','校园网'],['校园网','校园网'],['材料缺失','材料'],['报销','报销'],['图书馆','图书馆']];
  for (const [from,to] of aliases) if (q.includes(from)) terms.push(to);
  return [...new Set(terms)];
}
export function searchArticles(articles: Article[], query: string, category = '') {
  const terms = searchTerms(query);
  return articles.filter(a => !category || a.category === category).map(a => {
    const title = a.title.toLowerCase().replace(/\s+/g,'');
    const body = a.body.toLowerCase().replace(/\s+/g,'');
    const tags = a.tags.join('').toLowerCase();
    const score = !terms.length ? 1 : terms.reduce((n,t) => n+(title.includes(t)?100:tags.includes(t)?30:body.includes(t)?10:0),0);
    return {a,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.a);
}
export function publicArticle(a: Article): Article {
  const { sources: _sources, ...rest } = a; return rest;
}
