---
category: Features
alias: error-handling
title: エラーハンドリング
description: Tagix で構造化された状態とアクションを使用してエラーを処理する
order: 23
---

# エラーハンドリング

Tagix で構造化されたエラー状態を使用してエラーを処理します。

## エラー状態

`taggedEnum` の状態定義にエラー状態を定義します：

```ts
const ApiState = taggedEnum({
  Idle: {},
  Loading: {},
  Success: { data: unknown },
  Error: {
    code: string;
    message: string;
    retryable: boolean;
  },
});
```

## アクションでのエラーハンドラ

### 同期アクション

同期的なアクション内でエラーをキャッチします：

```ts
const riskyOperation = createAction<{ input: unknown }, ApiState>("Risky")
  .withPayload({ input: null })
  .withState((state, payload) => {
    try {
      const result = process(payload.input);
      return { ...state, _tag: "Success", data: result };
    } catch (error) {
      return {
        ...state,
        _tag: "Error",
        code: "PROCESSING_ERROR",
        message: error instanceof Error ? error.message : "不明なエラー",
        retryable: true,
      };
    }
  });
```

### 非同期アクション

非同期アクションのエラーは `.onError()` で処理します：

```ts
const fetchData = createAsyncAction<{ url: string }, ApiState, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload) => {
    const response = await fetch(payload.url);
    if (!response.ok) {
      throw new Error("リクエストに失敗しました");
    }
    return response.json();
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({
    ...s,
    _tag: "Error",
    code: "FETCH_ERROR",
    message: error instanceof Error ? error.message : "ネットワークエラー",
    retryable: true,
  }));
```

## エラーからの回復

### 再試行ロジック

非同期アクションのエフェクト内で再試行を実装します：

```ts
const fetchWithRetry = createAsyncAction<{ id: number }, ApiState, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload, { signal }) => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetch(`/api/${payload.id}`, { signal });
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error("最大再試行回数を超えました");
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({
    ...s,
    _tag: "Error",
    code: "FETCH_ERROR",
    message: error.message,
    retryable: true,
  }));
```

### 手動再試行アクション

エラーが再試行可能な場合に、再試行アクションをディスパッチします：

```ts
const retryFetch = createAction<void, ApiState>("Retry")
  .withPayload(undefined)
  .withState((s) => {
    if (s._tag !== "Error" || !s.retryable) return s;
    return { ...s, _tag: "Loading" };
  });

store.dispatch("tagix/action/Retry");
```

## 参照

- [非同期アクション](/docs/async-actions) - エラー処理を伴う非同期操作
- [ミドルウェア](/docs/middleware) - エラーログ記録ミドルウェア
- [テスト](/docs/testing) - エラーシナリオのテスト

## 次のステップ

| トピック                    | 説明                              |
| --------------------------- | --------------------------------- |
| [型安全](/docs/type-safety) | TypeScript を活用した正当性の確保 |
| [テスト](/docs/testing)     | アプリケーションのテスト戦略      |
