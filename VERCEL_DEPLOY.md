# Vercel 部署指南

## 部署步骤

### 方法 1：通过 Vercel Dashboard（推荐）

1. **准备代码**
   - 确保代码已提交到 Git 仓库（GitHub, GitLab, 或 Bitbucket）

2. **登录 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub/GitLab/Bitbucket 账号登录

3. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 Git 仓库
   - Vercel 会自动检测 Next.js 项目

4. **配置环境变量**
   - 在项目设置中添加以下环境变量：
     ```
     NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
     ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 方法 2：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```

4. **设置环境变量**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 环境变量配置

在 Vercel Dashboard 中设置以下环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard > Settings > API |

## 重要提示

1. **环境变量必须以 `NEXT_PUBLIC_` 开头**才能在客户端访问
2. **不要提交 `.env.local` 文件**到 Git（已在 .gitignore 中）
3. **构建命令**：`npm run build`（Vercel 会自动检测）
4. **输出目录**：`.next`（Next.js 默认）

## 部署后检查

1. 访问部署的 URL
2. 测试登录功能
3. 检查各页面是否正常加载
4. 测试 Supabase 连接

## 故障排除

### 构建失败
- 检查环境变量是否正确设置
- 查看构建日志中的错误信息

### 运行时错误
- 检查 Supabase 连接
- 确认 RLS 策略已正确配置
- 查看浏览器控制台错误

### 环境变量未生效
- 确保变量名以 `NEXT_PUBLIC_` 开头
- 重新部署项目（环境变量更改后需要重新部署）


