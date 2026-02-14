---
category: State Management
alias: async-actions
title: 非同期アクション
description: エフェクト、成功、およびエラーハンドラを使用して非同期操作を処理する
order: 12
---

# 非同期アクション

エフェクト、成功、およびエラーハンドラを使用して非同期操作を処理します。

## 非同期アクションの作成

Promise を伴う操作には `createAsyncAction` を使用します：

```ts
import { createAsyncAction } from "tagix";

const fetchUser = createAsyncAction<{ id: number }, UserState, User>("FetchUser")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload) => {
    const response = await fetch(`/api/users/${payload.id}`);
    if (!response.ok) throw new Error("ユーザーが見つかりません");
    return response.json();
  })
  .onSuccess((s, user) => ({ ...s, _tag: "Loaded", user }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));
```

## 構成要素

### 状態ハンドラ

アクション開始時の初期状態遷移：

```ts
.state((currentState) => ({
  ...currentState,
  _tag: "Loading",
}))
```

### エフェクトハンドラ

非同期操作本体：

```ts
.effect(async (payload) => {
  const result = await someAsyncOperation(payload);
  return result; // これが成功時のペイロードになります
})
```

### onSuccess ハンドラ

エフェクトが成功（resolve）したときに呼び出されます：

```ts
.onSuccess((currentState, result) => ({
  ...currentState,
  _tag: "Ready",
  data: result,
}))
```

### onError ハンドラ

エフェクトが失敗（reject）したときに呼び出されます：

```ts
.onError((currentState, error) => ({
  ...currentState,
  _tag: "Error",
  message: error instanceof Error ? error.message : "不明なエラー",
}))
```

## 完全な例

```ts
const fetchPosts = createAsyncAction<void, PostsState, Post[]>("FetchPosts")
  .state(() => PostsState.Loading({}))
  .effect(async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("フェッチに失敗しました");
    return response.json();
  })
  .onSuccess((_, posts) => PostsState.Loaded({ posts }))
  .onError((_, error) => PostsState.Error({ message: error.message }));

store.register("FetchPosts", fetchPosts);

// 非同期アクションをディスパッチ
await store.dispatch(fetchPosts);
```

## 非同期アクションのディスパッチ

非同期アクションは Promise を返します：

```ts
// 結果を待機
await store.dispatch(fetchUser, { id: 1 });

// エラーハンドリング
try {
  await store.dispatch(fetchUser, { id: 999 });
} catch (error) {
  console.error("アクションが失敗しました:", error);
}
```

## エラーハンドリング

### 構造化されたエラー

状態の中にエラー型を定義します：

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

### 再試行ロジック

エフェクト内で再試行を実装します：

```ts
const fetchWithRetry = createAsyncAction<{ id: number }, State, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload, { signal }) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fetchWithSignal(`/api/${payload.id}`, signal);
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error("最大再試行回数を超えました");
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message, retryable: true }));
```

## アクションのキャンセル

キャンセルのために `AbortSignal` を使用します：

```ts
const fetchData = createAsyncAction<{ id: number }, State, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload, { signal }) => {
    const controller = new AbortController();
    signal.addEventListener("abort", () => controller.abort());

    const response = await fetch(`/api/${payload.id}`, {
      signal: controller.signal,
    });
    return response.json();
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));
```

## 同時実行アクション

複数の非同期アクションを同時に実行できます：

```ts
await Promise.all([
  store.dispatch(fetchUser, { id: 1 }),
  store.dispatch(fetchPosts),
  store.dispatch(fetchNotifications),
]);
```

## 進捗トラッキング

アップロードやダウンロードの進捗を追跡します：

```ts
const uploadFile = createAsyncAction<{ file: File }, UploadState, UploadResult>("UploadFile")
  .state((s) => ({ ...s, _tag: "Uploading", progress: 0 }))
  .effect(async (payload, { signal }) => {
    const formData = new FormData();
    formData.append("file", payload.file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formBody,
      signal,
    });

    return response.json();
  })
  .onSuccess((s, result) => ({ ...s, _tag: "Complete", result }))
  .onError((s, error) => ({ ...s, _tag: "Failed", error: error.message }));
```

## 参照

- [アクション](/docs/actions) - 同期アクション
- [エラーハンドリング](/docs/error-handling) - エラーパターン
- [ミドルウェア](/docs/middleware) - リクエストミドルウェア

## 次のステップ

| トピック                               | 説明                   |
| -------------------------------------- | ---------------------- |
| [ステートマシン](/docs/state-machines) | 状態遷移をモデル化する |
| [セレクタ](/docs/selectors)            | 値の抽出と派生         |
