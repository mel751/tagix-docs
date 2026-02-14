---
category: Getting Started
alias: installation
title: インストールとセットアップ
description: Tagixのインストール方法とTypeScriptプロジェクトの設定方法について学びます
order: 1
---

# インストール

TypeScriptプロジェクトでTagixを使用するための準備をしましょう。

## パッケージマネージャー

お好みのパッケージマネージャーを使用してTagixをインストールしてください：

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

## 要件

- **TypeScript**: 5.0 以上
- **Node.js**: 23.3.0 以上 (開発用)

## TypeScript 設定

Tagixは完全な型安全性を確保するために、厳密なTypeScript設定を必要とします。`tsconfig.json` に以下の設定が含まれていることを確認してください：

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## 基本的なセットアップ

最初のストアを作成しましょう：

```ts
import { createStore, taggedEnum } from "tagix";

// 状態を定義する
const AppState = taggedEnum({
  Idle: {},
  Loading: {},
  Ready: { data: "" },
  Error: { message: "" },
});

// ストアを作成する
const store = createStore(AppState.Idle({}), AppState, {
  name: "App",
});

export { store, AppState };
```

## 次のステップ

| トピック                              | 説明                             |
| ------------------------------------- | -------------------------------- |
| [クイックスタート](/docs/quick-start) | 最初のアプリケーションを構築する |
| [コアコンセプト](/docs/core-concepts) | 基本概念を理解する               |
