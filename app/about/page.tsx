import type { Metadata } from 'next';
import GuideApp from '@/components/guide-app';

export const metadata: Metadata = {
  title: '关于我们 · 智科学代指南',
  description: '认识暨南大学智能科学与工程学院学生代表团，了解学代的日常工作、活动和反馈渠道。',
};

type Photo = [file: string, width: number, height: number, caption: string];

function AboutGallery({ photos, documents = false }: {photos: Photo[]; documents?: boolean}) {
  return <div className={'about-gallery'+(documents?' about-gallery-documents':'')}>
    {photos.map(([file,width,height,caption]) => {
      const src='/about/'+file+'.webp';
      return <figure key={file}>
        <a href={src} target="_blank" rel="noreferrer" aria-label={'查看'+caption+'的大图'}>
          <img src={src} width={width} height={height} alt={caption} loading="lazy" decoding="async"/>
        </a>
        <figcaption>{caption}</figcaption>
      </figure>;
    })}
  </div>;
}

function AboutArticle() {
  return (
    <article className="about-article">
      <figure className="about-cover">
        <img src="/about/delegation-formal.webp" width={1536} height={1024} alt="智科学生代表团正式合照" fetchPriority="high"/>
        <figcaption>智科学生代表团合影</figcaption>
      </figure>

      <header className="about-heading">
        <h1>关于我们</h1>
        <p className="about-affiliation">暨南大学智能科学与工程学院／人工智能产业学院学生代表团</p>
        <p className="about-date"><time dateTime="2026-10-14">2026 年 10 月 14 日</time> · 第二届学代见面会</p>
        <p className="about-lead">从选课、综测到宿舍报修，同学们遇到的许多问题都可以向班级学代反映。我们把意见带给负责的老师和部处，跟进答复，再把大家常问的问题整理进这份指南。</p>
      </header>

      <section>
        <h2>智科学代团介绍</h2>
        <p>学代团由学生负责人和班级学生代表组成，由李子昂老师指导。第二届学代见面会介绍的队伍中，有 76 名班级学生代表。团内设常委 2 名、团长 1 名、秘书长 2 名和宣传部负责人 2 名。</p>
        <figure className="about-photo"><img src="/about/delegation.webp" width={1920} height={767} alt="学代团成员围坐合照" loading="lazy"/><figcaption>学代团日常交流合影</figcaption></figure>
        <h3>优秀学生代表团</h3>
        <p>见面会回顾了学院学代团连续两年获评暨南大学年度「优秀学生代表团」的荣誉。2024–2025、2025–2026 两学年公示的团体名单中，均列有智能科学与工程学院。</p>
        <AboutGallery documents photos={[
          ['honors-2024',600,728,'2024–2025 学年度优秀学生代表团公示节选'],
          ['honors-2025',652,729,'2025–2026 学年度优秀学生代表团公示节选'],
        ]}/>
        <figure className="about-photo">
          <img src="/about/congress-delegation.webp" width={1536} height={1024} alt="智科学代团成员在暨南大学第四十五次学生代表大会现场的合照" loading="lazy" decoding="async"/>
          <figcaption>暨南大学第四十五次学生代表大会现场合影</figcaption>
        </figure>
      </section>

      <section>
        <h2>学代的日常工作</h2>
        <p>学代团的日常工作包括传递信息、监督和综测。学生代表向同学传达学校与部处的信息，也收集同学的意见与建议，推动合理诉求得到回应。学代团承担院学生会主席团换届选举的监督工作，平时会把同学集中反映的问题带给学院学生工作办公室。综测期间，学代团还负责组织培训、协调审核，收集和讨论条例修订建议。</p>
        <h3>综测培训、审核与规则修订</h3>
        <p>见面会回顾的 2025–2026 学年综测计算工作历时 14 天。</p>
        <ol className="about-process">
          <li><strong>9 月 9 日 · 综评培训会</strong><span>讲解综测规则、计分方法和证明材料的准备方式。</span></li>
          <li><strong>9 月 16–19 日 · 班级初审</strong><span>各班核对活动证明、签到记录和汇总分数，填写初审结果。</span></li>
          <li><strong>9 月 19–21 日 · 专业间抽审</strong><span>工业工程、物联网工程与人工智能各专业交叉复核，记录材料和分数的疑义。</span></li>
          <li><strong>9 月 21–23 日 · 院评议小组复核</strong><span>院评议小组抽查并反馈问题，各专业评议小组核对处理。</span></li>
          <li><strong>9 月 23 日 · 汇总、公示与系统录入</strong><span>分数下发班级核对。公示后由同学填写系统，各评议小组复核录入情况。</span></li>
        </ol>
        <p>综测方案修订从学院提出议题开始，依次经过提案筛选、会议讨论和表决。见面会材料记载共收集 46 条提案，学院审核通过 13 条。大会讨论 19 条、通过 7 条，包括德育 2 条、智育 1 条、体育 2 条、美育 2 条，涉及评优评先、课程成绩、科研加分与绩效计入。</p>
        <AboutGallery photos={[
          ['assessment-training',553,341,'综评培训会讲解计分规则'],
          ['assessment-presentation',774,580,'综测方案修订大会说明会议议程'],
          ['assessment-discussion',573,430,'同学在综测方案修订大会上发言'],
        ]}/>
        <h3>跟进校园反馈</h3>
        <p>选课、网络卡顿、就餐环境、场馆开放和医保报销等问题，都可以反映给学代。遇到临时政策变动、考勤争议或表格填写疑问时，学代也会接收反馈，联系相应负责部门。</p>
        <ul className="about-feedback-topics" aria-label="见面会记录的部分反馈事项">
          <li><strong>教学办</strong><span>选课问题 · 19 个</span></li>
          <li><strong>网络中心</strong><span>网络卡顿 · 13 个</span></li>
          <li><strong>饮食服务中心</strong><span>就餐环境 · 12 个</span></li>
          <li><strong>图书馆</strong><span>阅览室预约 · 12 个</span></li>
          <li><strong>社区中心</strong><span>施工及除草噪音 · 10 个</span></li>
          <li><strong>体育部</strong><span>羽毛球场馆开放 · 7 个</span></li>
          <li><strong>医务室</strong><span>医保报销 · 5 个</span></li>
          <li><strong>课室管理中心</strong><span>阶梯教室屏幕故障 · 2 个</span></li>
        </ul>
        <h3>学生代表绩效考核</h3>
        <p>《学生代表绩效考核实施条例》于 2025 年 5 月实行，2026 年 6 月第一次修订。考核从问题反映、综测修订提案、活动参与和民主选举四方面记录学代的工作。问题反映占 40%，每条有效反馈积 1 分。综测修订提案占 20%，提交提案积 3 分，通过提案另积 3 分。</p>
        <p>活动参与情况包括综测计算培训会、综测修订大会和宿舍走访，民主选举以各班的选举情况为依据。这些记录用于支持优秀学代评选。</p>
        <AboutGallery documents photos={[
          ['delegate-review',880,1012,'《学生代表绩效考核实施条例》节选'],
          ['delegate-review-guide',1250,389,'见面会展示的四项绩效考核内容'],
        ]}/>
      </section>

      <section>
        <h2>品牌活动与校园项目</h2>
        <h3>智科学代指南</h3>
        <p>同学通过班级学代提交问题后，学院学代团与相关部处对接。答复会经班级学代传达，适合公开的共性问题也会整理到指南。指南收录学院通知、图书馆和体育场馆信息，以及财务、医务、教务和报修联系方式。</p>
        <p>学代团定期汇总部处答复，也把有效反馈纳入学生代表绩效考核。遇到同类问题的同学可以直接查阅指南，关注后续办理进展。</p>

        <section className="about-feature" aria-labelledby="about-capsule">
          <h3 id="about-capsule">时光胶囊</h3>
          <p>「一纸时光·两载回响」邀请同学用信、照片、文字、歌曲或涂鸦留下这一段校园记忆。学代团完成前期策划后发布征集推文，再收集整理作品，共收到 49 份时光胶囊。活动结束后发布总结，展示了部分公开作品。</p>
          <AboutGallery documents photos={[
            ['capsule-invitation',579,1207,'时光胶囊活动征集推文'],
            ['capsule-recap',608,1207,'时光胶囊活动总结推文'],
            ['time-capsule',477,660,'公开作品中的旅途照片与文字'],
            ['capsule-lights',477,1194,'公开作品中的校园晚景与寄语'],
            ['capsule-evening',506,1150,'公开作品中的晚霞与留言'],
          ]}/>
        </section>

        <section className="about-feature" aria-labelledby="about-newsletter">
          <h3 id="about-newsletter">智科学代月刊</h3>
          <p>月刊回顾学代团上月的工作，预告下月活动和重要考试，也编排毕业季特辑、趣味互动和生活贴士。同学可以从同一期里看到工作进展、即将举行的活动，以及对学习和校园生活有帮助的信息。</p>
          <p>长图用校园场景与手绘元素串联各个栏目。互动页邀请同学分享自己的状态，生活贴士页提供当季提醒。</p>
          <AboutGallery documents photos={[
            ['newsletter',630,1154,'智科学代月刊选页'],
            ['newsletter-review',820,945,'月刊栏目 · 上月工作回顾'],
            ['newsletter-preview',830,409,'月刊栏目 · 下月活动预告'],
            ['newsletter-notices',790,533,'月刊中的活动与考试通知示例'],
            ['newsletter-interactive',855,720,'月刊里的趣味互动'],
            ['newsletter-care',765,1126,'月刊中的秋冬健康贴士'],
            ['newsletter-route',272,1299,'月刊长图的路线式排版'],
          ]}/>
        </section>

        <section className="about-feature" aria-labelledby="about-running">
          <h3 id="about-running">码上开跑</h3>
          <p>这是面向智科院同学的跑步打卡活动，以「科技＋运动」鼓励同学走出宿舍、养成运动习惯。见面会回顾的往届活动有 201 名同学参与，累计打卡 3,599 次。单月最高打卡 40 次，有 26 名同学获得「周周跑」标兵称号。</p>
          <p>荧光夜跑开幕式上，师生一起热身，再沿跑道开跑。见面会记录了集合、荧光手环和跑步现场。</p>
          <AboutGallery photos={[
            ['night-run-warmup',1080,720,'荧光夜跑开始前的集体热身'],
            ['night-run-bracelets',769,512,'参加者展示荧光手环'],
            ['night-run-start',695,480,'荧光夜跑开幕式'],
            ['night-run',870,696,'「码上开跑」参与者在跑道上集合'],
            ['night-run-track',549,411,'同学们在夜跑活动中开跑'],
          ]}/>
        </section>

        <h3 id="dorm-visit">智科学代直通车 · 宿舍站</h3>
        <p>见面会回顾的走访涵盖 198 间宿舍，收到 195 个问题，经整理形成 34 条有效问题，并在智科学代指南中解答。2024 级和 2025 级班级学代均参与了走访。</p>
        <p>2026 年 10 月 15 日至 18 日，班级学代开展了新一轮走访。学院发布的活动回顾记录了 69 个问题，涉及物业、网站、食堂、体育场馆、快递、图书馆和医务室等。</p>
        <p>各班学代提前沟通走访时间和同学意愿，混合宿舍由各专业学代协商分工。进门前先敲门询问，拍摄需事先征求宿舍全体成员同意，并避开个人物品和隐私场景。</p>
        <AboutGallery photos={[
          ['dorm-visit-notice',845,918,'2026 年宿舍站活动通知'],
          ['dorm-visit-conversation',887,667,'走访中的面对面交流'],
          ['dorm-visit-report',684,758,'学院发布的宿舍站活动回顾'],
          ['dorm-visit-guide',761,860,'宿舍走访安排与拍摄注意事项'],
        ]}/>
      </section>

      <section>
        <h2>接下来的工作</h2>
        <p>见面会总结了队伍分工与绩效考核、指南维护与宿舍走访、时光胶囊和日常问答等工作。学代团将继续与其他学院学代团交流，也会和院学生会各部门合作开展活动。</p>
        <p>后续问卷和主题互动将从同学会碰到的场景出发，了解大家对选课、宿舍漏水、图书馆占座或医保报销等问题的需求。指南也会继续按学习事务、校园生活和综合事务梳理入口，汇总高频问题和同学关注的事项。</p>
        <a className="button primary" href="/contact">查看联系学代的方式</a>
      </section>
    </article>
  );
}

export default function Page() {
  return <GuideApp contentPage={{title:'关于我们', content:<AboutArticle/>}}/>;
}
