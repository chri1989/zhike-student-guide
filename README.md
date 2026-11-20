# 智科学代指南

[正式站](https://zhikeguide.cn/)面向暨南大学珠海校区同学，由智能科学与工程学院／人工智能产业学院学生代表团建设和维护。网站包含校园指南搜索、独立条目、反馈、小智对话及学院公众号入口。

## 当前状态

截至 2026-11-20，正式站使用内容第 4 版，公开指南 164 条，校园部处 8 条。[联系学代](https://zhikeguide.cn/contact)单独成页，原条目链接跳转到这里。首页以访问数显示浏览情况，同一次访问对同一指南只能点赞一次。手机首页搜索框下有「更新记录」「问题反馈」「联系学代」三个入口。

[小智](https://zhikeguide.cn/xiaozhi)使用通义千问 Flash，支持普通对话和最近三轮问答上下文。校园具体信息参考已发布的指南。学院公众号入口已上线，自动同步待公众号权限和服务端配置。

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
