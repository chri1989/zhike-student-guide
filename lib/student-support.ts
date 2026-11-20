const supportTopics = [
  {
    pattern: /学业焦虑|学习压力|考试(压力|焦虑)|焦虑|压力(太|很|挺|有点)|学不下去/,
    answer: '最近压力大，先把手上的事拆小一些。可以写下最着急的那门课和一个今天能完成的任务，再约任课老师、辅导员或同学聊聊卡住的地方。如果压力持续影响睡眠或上课，也可以联系学校心理健康教育中心。',
    resources: [
      {title:'暨南大学心理健康服务',href:'https://www.jnu.edu.cn/36423/main.htm'},
      {title:'珠海校区心理健康教育中心联系方式',href:'https://zh.jnu.edu.cn/8453/list.htm'},
    ],
  },
  {
    pattern: /评优.*(迷茫|不知|没把握|怎么准备)|奖学金.*(迷茫|怎么准备)|保研.*(焦虑|迷茫)|评优迷茫/,
    answer: '先看本学年的通知，列清资格条件、截止日期和需要的证明，再按已经完成、还需补齐两栏整理材料。有疑问可以把具体条款带去问班级学代或辅导员。评优是阶段性记录，也可以借这次整理找出接下来最想坚持的一件事。',
    resources: [
      {title:'暨南大学学生资助管理',href:'https://xsc.jnu.edu.cn/5836/list.htm'},
      {title:'学院官网 · 学生工作与通知',href:'https://sisse.jnu.edu.cn/main.htm'},
    ],
  },
  {
    pattern: /入党|入团|学生党支部|入党积极分子|党团活动/,
    answer: '可以先了解学院党团组织的工作，以及你所在年级当前的通知。和辅导员或对应学生党支部核对申请条件、材料、联系人和时间。涉及具体办理步骤时，以学院当学年发布的通知为准。',
    resources: [{title:'智能科学与工程学院 · 基层党建',href:'https://sisse.jnu.edu.cn/_s328/jcdj/list.psp'}],
  },
  {
    pattern: /社会实践|三下乡|百千万工程|志愿服务.*怎么|怎么(参加|找).*志愿/,
    answer: '可以先选一个你愿意投入的方向，比如社区服务、科普或专业实践，再问学院辅导员和团委近期有哪些项目。报名时核对组织单位、时间、服务记录和结项材料。实践经历也适合留下简短记录，方便回顾你做了什么、学到了什么。',
    resources: [
      {title:'暨南大学校团委 · 社会实践相关公告',href:'https://tw.jnu.edu.cn/17233/list.htm'},
      {title:'学院官网 · 活动与通知',href:'https://sisse.jnu.edu.cn/main.htm'},
    ],
  },
];

export function findStudentSupport(question:string) {
  return supportTopics.find(topic => topic.pattern.test(question));
}
