# 排班工时计算器（纯前端版）

在浏览器内解析 `.xlsx` 排班表，统计工时并生成涂色 Excel。**无需后端**，文件不会上传到服务器。

与带 Render 后端的完整版项目相互独立，可单独部署到 GitCode Pages / Vercel / 任意静态托管。

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

## GitCode 仓库

https://gitcode.com/Wishings/schedule-app-pure

## 推送到 GitCode

GitCode 已不支持账号密码推送，需使用**私人令牌（PAT）**：

1. 登录 [GitCode](https://gitcode.com) → 个人设置 → 私人令牌 → 新建（勾选 `write_repository`）
2. 在本机执行：

```bash
cd e:\schedule-app-pure
git remote set-url origin https://gitcode.com/Wishings/schedule-app-pure.git
git push -u origin main
```

提示输入密码时，**粘贴令牌**（不是登录密码）。

首次关联仓库：

```bash
git remote add origin https://gitcode.com/Wishings/schedule-app-pure.git
```

## 部署到 Vercel

- Import 该 GitCode 仓库
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
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
