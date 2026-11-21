import { categories, searchArticles, searchTerms, type Article } from './guide';
import { newsPosts } from './news';

export const xiaozhiModelName = '通义千问 Flash';

type SourceKind = '指南' | '入口' | '推文';

export type XiaozhiAnswer = {
  answer: string;
  sources: { id: string; title: string; href: string; summary?: string; kind?: SourceKind }[];
  resources?: { title: string; href: string }[];
  releaseId: number;
};

export type XiaozhiEvidence = XiaozhiAnswer['sources'][number] & { kind:SourceKind; body?:string };

const newsEvidence = [...newsPosts].sort((a,b)=>b.date.localeCompare(a.date)).map(post=>({
  id:'news-'+post.id,kind:'推文' as const,title:post.title,href:'/news/'+post.id+'.pdf',
  summary:post.date+' 发布。'+post.description,
}));

export const xiaozhiSiteEvidence: XiaozhiEvidence[] = [
  {id:'home',kind:'入口',title:'智科学代指南首页',href:'/',summary:'按关键词搜索珠海校区校园指南，浏览分类、热门指南、服务看板与各项功能入口。'},
  {id:'news',kind:'入口',title:'学院News',href:'/news',summary:'按发布时间查看学院新闻、动态、讲座、活动推文和校庆贺信，点击标题打开 PDF 原件。'},
  {id:'calculator',kind:'入口',title:'综测加分自算器',href:'/calculator',summary:'按学院方案填写各项加分，核算综测得分、封顶明细，并复制报告。'},
  {id:'feedback',kind:'入口',title:'问题反馈',href:'/feedback',summary:'提交校园问题和建议，提交后获得受理编号和匿名待受理记录。'},
  {id:'feedback-progress',kind:'入口',title:'诉求追踪墙',href:'/feedback-progress',summary:'查受理编号、诉求处理进度、部处对接情况以及已收录答复。'},
  {id:'contact',kind:'入口',title:'联系学代',href:'/contact',summary:'查看班级学代、公众号、线下反馈和公邮联系渠道。'},
  {id:'about',kind:'入口',title:'关于我们',href:'/about',summary:'了解智科学代团的组织、日常工作、校园活动和配图。'},
  {id:'updates',kind:'入口',title:'更新记录',href:'/updates',summary:'查各次指南发布的时间、说明及新增、修改和停用条目。'},
  {id:'admin',kind:'入口',title:'管理后台',href:'/admin',summary:'维护者登录后编辑指南、发布内容、处理反馈和维护公开进展。'},
  {id:'xiaozhi-about',kind:'入口',title:'小智说明',href:'/xiaozhi/about',summary:'查看小智所用模型和相关说明。'},
  ...categories.map(category=>({id:'category-'+category.id,kind:'入口' as const,title:category.name,
    href:'/?category='+encodeURIComponent(category.id),summary:'浏览「'+category.name+'」分类下的校园指南。'})),
  ...newsEvidence,
];

export function xiaozhiSiteAnswer(question:string): Pick<XiaozhiAnswer,'answer'|'sources'> | undefined {
  const text = question.replace(/[\s，,。.!！?？]/g,'').replace(/^(?:请问|您好|你好)/,'').replace(/[啊呀呢吗嘛]+$/,'');
  if (/^(?:你是谁(?:你?(?:会|能|可以)(?:做|干|帮我做)什么)?|你(?:会|能|可以)(?:做|干|帮我做)什么|介绍一下你自己)$/.test(text)) {
    const sources = xiaozhiSiteEvidence.filter(item=>['home','news','calculator','feedback-progress'].includes(item.id));
    return {answer:'我是小智，智科学代指南里的校园助手。你可以和我聊天、追问，也可以请我找校园指南、学院推文和站内功能。比如问我校园网怎么报修，或直接点下方入口看看。',sources};
  }
  if (/^(?:学院|院里)?(?:最近|近期|这几天|这周|本周)(?:我们)?(?:学院|院里)?(?:都)?(?:发生了|有|发了|发布了|更新了)?(?:什么|哪些|啥)?(?:新鲜事|事情|新消息|新闻|动态|推文|活动)$/.test(text) && newsEvidence.length) {
    return {answer:'这是「学院News」最近发布的推文。点下方任意一篇可阅读原文。',sources:newsEvidence.slice(0,3)};
  }
}

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
