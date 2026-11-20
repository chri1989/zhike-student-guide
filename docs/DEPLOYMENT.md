# 部署与维护

## 正式服务器

- 正式地址是 [zhikeguide.cn](https://zhikeguide.cn/)。
- 服务运行在阿里云广州 ECS，Ubuntu 24.04，Node.js 24。由 Caddy 接收公网 HTTPS，应用监听 `127.0.0.1:7860`。
- 应用目录是 `/opt/zhikeguide/app`，systemd 服务为 `zhikeguide.service`。独立构建入口为 `.next/standalone/server.js`。
- SQLite 和已上传图片在 `/var/lib/zhikeguide`。systemd 从 `/etc/zhikeguide.env` 读取运行配置。
- 网站正文经 `/admin` 维护，公开内容的当前版本从 `/api/guide` 读取，发布历史由 `/api/updates` 提供。

## 发布

1. 先在工作区核对已有文件、[线上指南](https://zhikeguide.cn/api/guide)及更新历史，按任务范围修改。运行 `npm run build` 并验收相关入口。
2. 正式发布走现有广州实例的 **全部操作 → 发送命令**，命令类型选 **Shell**。执行超时采用 300 秒，以便复制和构建完成。有会话控制能力时直接在已登录的实际实例上操作。
3. 在同一服务器的临时目录复制代码和依赖，使用正式站同一 Node 版本构建。把 `public` 和 `.next/static` 复制进 standalone 目录。确认新构建正常后再切换，备份旧构建供失败回退。保留持久数据目录。
4. 发布锁是 `/run/lock/zhikeguide-deploy.lock`。云助手脚本使用 `flock -o`，避免子进程继承锁的文件描述符。锁占用时按活跃进程处理，已暂停任务的 PID 和进程状态要先核实。
5. 执行结果成功后，从外网核对实际页面、API 和这次修改的入口，再更新 [更新历史](../CHANGELOG.md)。

## 指南编辑

在 [管理后台](https://zhikeguide.cn/admin)用已开通的管理员邮箱登录。先筛选分类，选择已有条目编辑，或点击「新增条目」并填写所属分类、问题和回答。保存草稿后可以预览，点击「发布这条」并填写更新说明，正文和更新记录就会同时公开。需要一起发布多条时，在列表勾选后使用「发布选中」。停用条目同样在发布后生效，旧发布快照留作追溯。

总管理员打开「管理员账号 → 添加管理员」，填写姓名、登录邮箱和临时密码。其他管理员可以新增、编辑和发布条目，也可以处理学生反馈并整理成草稿。账号开通、停用和重置由总管理员处理。

## 配置与数据

- 小智使用服务端的 `DASHSCOPE_API_KEY`、`DASHSCOPE_BASE_URL`、`XIAOZHI_ENABLED` 和 `XIAOZHI_MODEL_RECORD`。当前公示内容从服务配置渲染到 `/xiaozhi/about`。
- 公众号自动同步使用服务端的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。学院管理者先在公众号后台的开发者中心核对“获取已发布的消息列表”权限，并按公众号平台要求配置服务器实际出网地址。管理凭据在服务器配置。
- 推文功能读取微信的已发布列表并展示近期卡片。依据 [微信发布列表接口](https://developers.weixin.qq.com/doc/service/api/public/api_freepublish_batchget.html) 的账号权限。当前实现每次取 8 组，首页最多显示 12 篇，并保留公众号原文链接。
- 备份由主管理员经 `/api/admin/export` 获取，私下保存。备份含站点维护数据，恢复时使用全新的目标目录。正式密钥、账号和反馈数据使用私有运行目录。
- 浏览量和赞保存在正式 SQLite 数据库中，匿名访客统计由浏览器生成的 ID 去重，同一访问的同一条目点赞由数据库约束。
