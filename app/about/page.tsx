import type { Metadata } from 'next';
import GuideApp from '@/components/guide-app';

export const metadata: Metadata = {
  title: '关于我们 · 智科学代指南',
  description: '认识暨南大学智能科学与工程学院学生代表团，了解学代的日常工作、活动和反馈渠道。',
};

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
        <p>学代团由学生负责人和班级学生代表组成，由李子昂老师指导。第二届学代见面会介绍的队伍中，有 76 名班级学生代表。团内设团长 1 名、常委 2 名、秘书长 2 名和宣传部负责人 2 名。学院学代团连续两年获评暨南大学年度「优秀学生代表团」。</p>
        <figure className="about-photo"><img src="/about/delegation.webp" width={1920} height={767} alt="学代团成员围坐合照" loading="lazy"/><figcaption>学代团日常交流合影</figcaption></figure>
      </section>

      <section>
        <h2>学代的日常工作</h2>
        <p>学代向同学传达学校和部处的信息，也收集同学的意见与建议，推动合理诉求得到回应。学代团承担院学生会主席团换届选举的监督工作，平时会关注同学集中反映的问题，与学院学生工作办公室及时沟通。</p>
        <h3>综测培训、审核与规则修订</h3>
        <p>2025–2026 学年的综测计算历时 14 天，依次完成综评培训、班级初审、专业间抽审、院评议小组复核和全院公示。分数汇总后也会下发各班核对。综测方案修订共收集 46 条提案，学院审核通过 13 条。会上讨论了 19 条提案，通过 7 条，涉及德育、智育、体育和美育加分。</p>
        <figure className="about-photo">
          <img src="/about/assessment-meeting.webp" width={1200} height={657} alt="综测方案修订大会上到场的师生" loading="lazy" decoding="async"/>
          <figcaption>综测方案修订大会现场</figcaption>
        </figure>
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
        <p>2026 年 6 月，学代团修订了《学生代表绩效考核实施条例》，从问题反映、综测修订提案、活动参与和民主选举四个方面记录学代的工作。</p>
      </section>

      <section>
        <h2>品牌活动与校园项目</h2>
        <h3>智科学代指南</h3>
        <p>同学通过班级学代提交问题后，学院学代团与相关部处对接。答复会经班级学代传达，适合公开的共性问题也会整理到指南。指南收录学院通知、图书馆和体育场馆信息，以及财务、医务、教务和报修联系方式。</p>

        <div className="about-feature-pair">
          <section>
            <h3>时光胶囊</h3>
            <p>从发布征集到整理、回顾，学代团共收集 49 份时光胶囊，并在活动总结中展示了部分公开作品。</p>
            <figure><img src="/about/time-capsule.webp" width={477} height={660} alt="时光胶囊活动征集推文配图" loading="lazy" decoding="async"/><figcaption>时光胶囊征集推文</figcaption></figure>
          </section>
          <section>
            <h3>智科学代月刊</h3>
            <p>月刊用长图、手绘和校园场景串起工作回顾、活动预告、毕业季特辑和生活贴士，也会给同学留出参与互动的位置。</p>
            <figure><img src="/about/newsletter.webp" width={630} height={1154} alt="智科学代月刊的长图配图" loading="lazy" decoding="async"/><figcaption>智科学代月刊配图</figcaption></figure>
          </section>
        </div>

        <div className="about-feature-with-photo">
          <div>
            <h3>码上开跑</h3>
            <p>面向智科院同学的跑步打卡活动，把专业特色和日常运动结合起来。见面会回顾的往届活动有 201 名同学参与，打卡 3,599 次，其中 26 名同学获得「周周跑」标兵称号。活动也组织过荧光夜跑开幕式。</p>
          </div>
          <figure><img src="/about/night-run.webp" width={870} height={696} alt="荧光夜跑参与者在跑道上集合" loading="lazy" decoding="async"/><figcaption>「码上开跑」荧光夜跑现场</figcaption></figure>
        </div>

        <h3 id="dorm-visit">智科学代直通车 · 宿舍站</h3>
        <p>活动走访了 198 间宿舍，收到 195 个问题，经整理形成 34 条有效问题，并在智科学代指南中解答。2024 级和 2025 级班级学代均参与了走访。走访前先沟通同学意愿，拍摄前征求同意，尊重每个人的生活空间。</p>
      </section>

      <section>
        <h2>接下来的工作</h2>
        <p>学代团将继续完善分工与工作记录，和其他学院学代团及院学生会交流合作。指南的下一步是按学习事务、校园生活和综合事务梳理查阅入口，持续整理高频问题。我们也希望通过问卷和趣味互动，让更多同学参与反馈。</p>
        <a className="button primary" href="/contact">查看联系学代的方式</a>
      </section>
    </article>
  );
}

export default function Page() {
  return <GuideApp contentPage={{title:'关于我们', content:<AboutArticle/>}}/>;
}
