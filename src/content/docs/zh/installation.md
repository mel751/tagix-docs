---
category: Getting Started
alias: installation
title: 安装与设置
description: 了解如何安装 Tagix 并配置您的 TypeScript 项目
order: 1
---

# 安装

在您的 TypeScript 项目中开始使用 Tagix。

## 软件包管理器

使用您喜欢的软件包管理器安装 Tagix：

### npm

```bash
npm install tagix
```

### pnpm

```bash
pnpm add tagix
```

### yarn

```bash
yarn add tagix
```

### bun

```bash
bun add tagix
```

## 要求

- **TypeScript**: 5.0 或更高版本
- **Node.js**: 23.3.0 或更高版本（用于开发）

## TypeScript 配置

Tagix 需要严格的 TypeScript 设置以确保完全的类型安全。确保您的 `tsconfig.json` 包含：

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## 基本设置

创建您的第一个 Store：

```ts
import { createStore, taggedEnum } from "tagix";

// 定义您的状态
const AppState = taggedEnum({
  Idle: {},
  Loading: {},
  Ready: { data: "" },
  Error: { message: "" },
});

// 创建 Store
const store = createStore(AppState.Idle({}), AppState, {
  name: "App",
});

export { store, AppState };
```

## 下一步

| 主题                            | 描述                   |
| ------------------------------- | ---------------------- |
| [快速入门](/docs/quick-start)   | 构建您的第一个应用程序 |
| [核心概念](/docs/core-concepts) | 理解基本原理           |
