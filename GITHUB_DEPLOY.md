# 🚀 Vercel 部署 - 第二步：推送代码

## ⚠️ GitHub 认证说明

HTTPS 协议 push 需要 Personal Access Token（GitHub 已弃用密码登录）。

## 🎯 两种解决方案（任选一个）

### 方案 A：用 GitHub Personal Access Token（**推荐**）

#### A.1 创建 Token（**2 分钟**）
1. 打开 https://github.com/settings/tokens
2. 点 **Generate new token → Generate new token (classic)**
3. 填：
   - Note: `vercel-deploy`
   - Expiration: `No expiration`（或 90 天）
   - 勾选 ✅ **repo**（其他不用勾）
4. 点 **Generate token**
5. **复制 token**（形如 `ghp_xxxxxxxxxxxxxxxxxx`，**只显示一次！**）

#### A.2 推送时用 token 认证
在 PowerShell 跑（**替换成你的 token**）：

```bash
cd C:\Users\Administrator\WorkBuddy\2026-07-10-14-37-27
git push https://ghp_你的TOKEN@github.com/meimiaopet-crypto/yunwei-petfood-quotation.git main
```

> ✅ 优点：以后 push 都不用再输入
> ⚠️ 注意：token 千万别 commit 到代码里

---

### 方案 B：用 SSH 协议（如果之前配过 SSH key）

```bash
cd C:\Users\Administrator\WorkBuddy\2026-07-10-14-37-27
git remote set-url origin git@github.com:meimiaopet-crypto/yunwei-petfood-quotation.git
git push -u origin main
```

> 只有你**之前配过** `~/.ssh/id_rsa.pub` 给 GitHub 才能用

---

### 方案 C：Vercel 直接 Import（**最简单！**）

**跳过 GitHub push 步骤**！Vercel 也能直接 import：

1. **本地打包**项目（PowerShell）：
   ```bash
   cd C:\Users\Administrator\WorkBuddy\2026-07-10-14-37-27
   npm run build
   ```
   会在 `.next/` 目录生成部署文件。

2. **去 Vercel**：https://vercel.com/new
   - **不选 GitHub**
   - 选 **"Browse Templates"** → 找到 **"Next.js"** 模板
   - 然后选 **"Import Third-Party Git Repository"** 或上传 `.next` 文件夹

> ❌ 这个方法对 Next.js 不友好（Vercel 需要源码，不是 build 产物）

---

## 🎯 我的建议：用方案 A（Token）

**最稳的步骤**：

1. **创建 token**：https://github.com/settings/tokens
2. **复制 token**（`ghp_xxx` 开头）
3. **贴给我**（或自己跑命令）
4. **自动 push** → Vercel 部署

---

## ⏱️ 时间预估
- 创建 token：2 分钟
- 推送代码：30 秒
- Vercel 部署：3 分钟
- **总计：6 分钟**搞定生产环境

**现在去 https://github.com/settings/tokens 拿 token 吧！** 🎯
