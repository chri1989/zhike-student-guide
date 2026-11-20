# 智科学代指南

[正式站](https://zhikeguide.cn/)面向暨南大学珠海校区同学，由智能科学与工程学院／人工智能产业学院学生代表团建设和维护。站内提供校园指南、诉求追踪、小智问答、学代团 News 和综测加分自算器。

## 当前状态

正式站的指南数量和近 30 天发布次数由首页「智科数智服务看板」实时显示。[联系学代](https://zhikeguide.cn/contact)提供反馈渠道，[诉求追踪墙](https://zhikeguide.cn/feedback-progress)展示已审核公开的办理进展。同一次访问对同一指南只能点赞一次。

[小智](https://zhikeguide.cn/xiaozhi)使用通义千问 Flash，保留最近三轮问答上下文。校园回复可附站内指南引用卡片，成长咨询可查看校院公开资源。[学代团 News](https://zhikeguide.cn/news)按发布日期展示推文原稿，[综测加分自算器](https://zhikeguide.cn/calculator)采用学院 2026 年 4 月第一次修订的方案。

## 从哪里接手

- [更新历史](CHANGELOG.md)记录线上内容版本、功能改动和现场核验结果。
- [部署与维护](docs/DEPLOYMENT.md)包含服务器路径、发布、回退、备份和公众号配置。
- [项目协作说明](AGENTS.md)说明如何核对当前状态，接着现有工作继续。
- [初始迁移说明](docs/history/初始迁移说明.md)保存迁移阶段的原始说明。

## 本地运行

项目使用 Next.js、TypeScript、Node.js 24 和 SQLite。安装依赖后，将 `GUIDE_DATA_DIR` 指向独立的绝对路径，再初始化本地数据。

```powershell
npm ci
$env:GUIDE_DATA_DIR = Join-Path (Get-Location) 'local-data'
$env:SITE_URL = 'http://127.0.0.1:5173'
node scripts/initialize-store.mjs
npm run dev
```

需要验证后台时，在本地环境中设置至少 32 个字符的 `AUTH_SECRET` 及独立的 `BOOTSTRAP_TOKEN`，再访问 `/admin/setup`。配置名见 [.env.example](.env.example)。`data/seed.json` 提供空库初始化使用的公开指南。正式站的发布版本和后续编辑保存在持久数据目录。
