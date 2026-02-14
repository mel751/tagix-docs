---
category: Features
alias: middleware
title: ミドルウェア
description: ミドルウェアによってディスパッチの動作を拡張する
order: 21
---

# ミドルウェア

## ミドルウェアの基本

## ミドルウェアの作成

ミドルウェアは、チェーンハンドラを返す関数です：

```ts
const loggerMiddleware = () => (next) => (action) => {
  console.log("アクション:", action.type, action.payload);
  return next(action);
};
```

## ミドルウェアの構造

```ts
type Middleware<S> = (
  context: MiddlewareContext<S>
) => (
  next: (action: Action | AsyncAction) => boolean
) => (action: Action | AsyncAction) => boolean | void;
```

## 組み込みミドルウェア

### Logger ミドルウェア

すべてのアクションと状態変更をログに記録します：

```ts
import { createLoggerMiddleware } from "tagix";

const store = createStore(initial, state, {
  middlewares: [
    createLoggerMiddleware({
      collapsed: true, // ロググループを折りたたむ
      duration: true, // 実行時間を表示
      timestamp: true, // タイムスタンプを含める
    }),
  ],
});
```

## カスタムミドルウェアの例

### アナリティクスミドルウェア

ユーザーのアクションを追跡します：

```ts
const analyticsMiddleware = () => (next) => (action) => {
  if (action.type.startsWith("tagix/action/")) {
    // アナリティクスに送信
    trackEvent("action", {
      type: action.type,
      hasPayload: "payload" in action,
    });
  }
  return next(action);
};
```

### スロットルミドルウェア

アクションの実行頻度を制限します：

```ts
const throttleMiddleware = (ms: number) => {
  const lastCalls = new Map<string, number>();

  return () => (next) => (action) => {
    const now = Date.now();
    const last = lastCalls.get(action.type) ?? 0;

    if (now - last < ms) {
      return false; // アクションをスキップ
    }

    lastCalls.set(action.type, now);
    return next(action);
  };
};

const store = createStore(initial, state, {
  middlewares: [throttleMiddleware(1000)],
});
```

### 認証ミドルウェア

リクエストに認証トークンを付加します：

```ts
const authMiddleware = (getToken: () => string | null) => () => (next) => (action) => {
  if (action.type === "tagix/action/APIRequest") {
    const token = getToken();
    if (token) {
      // リクエストにトークンを付与
      (action as any).payload.headers = {
        ...(action as any).payload.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return next(action);
};
```

### Undo/Redo ミドルウェア

元に戻す（Undo）機能を実装します：

```ts
const createUndoMiddleware = () => {
  const history: unknown[] = [];

  return () => (next) => (action) => {
    if (action.type === "tagix/action/Undo") {
      const previous = history.pop();
      if (previous) {
        store.replaceState(previous);
      }
      return false;
    }

    // アクション実行前の状態を保存
    const previous = store.stateValue;
    const result = next(action);

    if (result !== false) {
      history.push(previous);
    }

    return result;
  };
};
```

### バリデーションミドルウェア

処理の前にアクションを検証します：

```ts
const validationMiddleware =
  (schemas: Record<string, (payload: unknown) => boolean>) => () => (next) => (action) => {
    const schema = schemas[action.type];
    if (schema && !schema(action.payload)) {
      console.warn("無効なアクションペイロードです:", action);
      return false; // アクションをブロック
    }
    return next(action);
  };
```

## ミドルウェアの組み合わせ

ミドルウェアの順序は重要です：

```ts
const store = createStore(initial, state, {
  middlewares: [
    // 1番目: ロギング (元のアクションを確認)
    createLoggerMiddleware(),

    // 2番目: アナリティクス (ログに記録されたアクションを確認)
    analyticsMiddleware(),

    // 3番目: バリデーション (アクションを検証)
    validationMiddleware(schemas),

    // 4番目: スロットリング (実行頻度制限を適用)
    throttleMiddleware(1000),

    // 最後: ストアが処理済みのアクションを受け取る
  ],
});
```

## アクションのブロック

アクションをブロックするには `false` を返します：

```ts
const blockingMiddleware = () => (next) => (action) => {
  if (action.type === "tagix/action/DeleteAll") {
    const confirm = window.confirm("すべて削除しますか？");
    if (!confirm) return false;
  }
  return next(action);
};
```

非同期アクションの場合、ブロックするとエフェクトの実行が防止されます。

## 参照

- [アクション](/docs/actions) - アクションのフロー
- [非同期アクション](/docs/async-actions) - 非同期ミドルウェア
- [エラーハンドリング](/docs/error-handling) - エラーミドルウェア

## 次のステップ

| トピック                                   | 説明                             |
| ------------------------------------------ | -------------------------------- |
| [コンテキスト](/docs/context)              | フレームワークに依存しない統合   |
| [エラーハンドリング](/docs/error-handling) | 構造化された状態によるエラー処理 |
