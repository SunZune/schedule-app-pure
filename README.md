# 排班工时计算器（纯前端版）

在浏览器内解析 `.xlsx` 排班表，统计工时并生成涂色 Excel。**无需后端**，文件不会上传到服务器。

与带 Render 后端的完整版项目相互独立，可单独部署到 GitHub Pages / Vercel / 任意静态托管。

## 功能

- 上传 `.xlsx` 排班表
- 自动识别各 Sheet（每月一张）
- 支持文字（值/白/休）与背景色识别
- 按员工统计月度工时、图表对比
- 下载涂色版 Excel

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 构建

```bash
npm run build
```

产物在 `dist/` 目录。

## GitHub 仓库

https://github.com/SunZune/schedule-app-pure

```bash
cd e:\schedule-app-pure
git remote set-url origin https://github.com/SunZune/schedule-app-pure.git
git push -u origin main
```

## 部署到 GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`，推送 `main` 分支后会自动构建并发布。

### 一次性设置（在 GitHub 网页上）

1. 打开 [schedule-app-pure 仓库](https://github.com/SunZune/schedule-app-pure) → **Settings** → **Pages**
2. **Build and deployment** → **Source** 选择 **GitHub Actions**
3. 推送代码后，在 **Actions** 标签页查看 `Deploy to GitHub Pages` 工作流是否成功（约 1～2 分钟）

### 访问地址

部署成功后：

**https://sunzune.github.io/schedule-app-pure/**

（项目页 URL 格式为 `https://<用户名>.github.io/<仓库名>/`）

### 本地模拟 Pages 路径

```bash
set VITE_BASE_PATH=/schedule-app-pure/
npm run build
npm run preview
```

### 若页面空白

多半是 `base` 路径不对。本项目在 CI 里已设置 `VITE_BASE_PATH=/schedule-app-pure/`，与仓库名一致即可。

## 部署到 Vercel

- Import 该 [GitHub 仓库](https://github.com/SunZune/schedule-app-pure)
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- **无需**配置 `VITE_BASE_PATH`（根路径部署）
- **无需**配置任何 API 环境变量

## 班次规则

| 标记 | 班次 | 工时 |
|------|------|------|
| 值 / 值班 / 红色 | 值班 | 12h |
| 白 / 白班 / 黄色 | 白班 | 8h |
| 休 / 休息 / 绿色等 | 休息 | 0h |
| 年 / 年假 | 年假 | 8h |

## 技术栈

- React 18 + TypeScript + Vite
- ExcelJS（浏览器内读写 xlsx）
- Recharts

## 隐私说明

Excel 仅在当前浏览器标签页内存中处理，关闭页面或刷新后需重新上传。
