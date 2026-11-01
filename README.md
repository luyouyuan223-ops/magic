# 鹿游原 · 魔术与心灵术

网站：https://luyouyuan-magic.pages.dev/

静态 HTML、CSS 和 JavaScript，无需构建。

- index.html：页面与文案
- style.css：布局、响应式和照片色调
- app.js：照片浏览、问答与联系方式
- assets/：13 张演出照片与手写字标

## Cloudflare 自动发布

修改 main 分支的网页或 assets 文件后，GitHub Actions 会发布到既有的 luyouyuan-magic Pages 项目，网址不变。也可以在 Actions → Deploy website to Cloudflare → Run workflow 手动发布。

首次使用需在仓库 Settings → Secrets and variables → Actions 中添加 CLOUDFLARE_API_TOKEN。令牌仅授予目标账户的 Account → Cloudflare Pages → Edit 权限。不要把令牌提交到源码。

工作流只上传网页与 assets，不上传 Git 元数据、部署凭据或说明文件。
