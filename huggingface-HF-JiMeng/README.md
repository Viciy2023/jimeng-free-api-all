---
title: Jimeng Free API
emoji: 🎨
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
license: mit
---

# Jimeng Free API on Hugging Face

## 方案说明

- 构建方式：每次 HF Space 重建时从 GitHub 源码仓库拉取最新代码并构建
- 源码仓库：`https://github.com/wwwzhouhui/jimeng-free-api-all`
- HF Spaces 对外端口：`7860`
- 内置 Playwright Chromium（国内版 Seedance 需要）
- 国际版无需浏览器，纯算法签名（X-Bogus / X-Gnarly）

## 部署步骤

### 方案一：GitHub 自动推送到 HF Space

1. 在 Hugging Face 新建一个 `Docker` 类型的 Space
2. 在 GitHub 仓库中添加以下 Secrets：
   - `HF_TOKEN`：你的 Hugging Face Access Token
   - `HF_SPACE_REPO`：你的 Space 仓库名，格式为 `username/space_name`
3. 推送 `main` 分支后，GitHub Actions 自动同步到 HF Space
4. HF Space 收到更新后自动从源码构建

### 方案二：手动上传到 HF Space

1. 在 Hugging Face 新建一个 `Docker` 类型的 Space
2. 把本目录文件上传到 Space 根目录
3. 等待构建完成

## 客户端调用方式

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://<你的-space>.hf.space` |
| **API Key** | 你的即梦 sessionid |
| **模型** | `jimeng-5.0`、`jimeng-4.6`、`jimeng-4.5` 等 |

### 获取 sessionid

1. 访问 https://jimeng.jianying.com/ 并登录
2. 按 F12 打开开发者工具
3. Application → Cookies → 复制 `sessionid` 的值

### 国际版 sessionid

在 sessionid 前加区域前缀，如 `sg-xxx`、`hk-xxx`、`jp-xxx` 等。

## 验证接口

```bash
# 健康检查
curl https://<你的-space>.hf.space/ping

# 文生图
curl -X POST "https://<你的-space>.hf.space/v1/images/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_sessionid" \
  -d '{
    "model": "jimeng-5.0",
    "prompt": "美丽的日落风景",
    "ratio": "16:9",
    "resolution": "2k"
  }'
```

## 回滚方式

修改 Dockerfile 中的 `GITHUB_BRANCH` 参数指向稳定分支或 tag。
