---
category: Getting Started
alias: architecture
title: アーキテクチャ
description: Tagixの内部設計を理解する
order: 4
---

## ストア構造

ストアは、状態とディスパッチを管理する中心的なコンポーネントです：

```ts
class TagixStore<S extends { readonly _tag: string }> {
  // 現在の状態 (ゲッター)
  readonly stateValue: S;

  // ストアのメタデータ
  readonly name: string;
  readonly registeredActions: readonly string[];

  // コア操作
  dispatch(type: string, payload?: unknown): Promise<void> | void;
  subscribe(callback: (state: S) => void): () => void;
  fork(): TagixStore<S>;

  // クエリ操作
  select<K extends keyof S>(key: K): S[K];
  isInState(tag: string): boolean;
  getState<T extends S["_tag"]>(tag: T): Extract<S, { _tag: T }> | null;
}
```

## 状態定義

状態は `taggedEnum` を使用して定義され、識別可能なバリアントを持つ型を作成します：

```ts
const AppState = taggedEnum({
  Idle: {},
  Loading: { progress: number },
  Ready: { data: unknown },
  Error: { message: string },
});

// 以下を作成します：
// - _tag プロパティを持つ AppState 型
// - コンストラクタ関数 (AppState.Idle() など)
// - 状態の和型 (AppState.State)
```

## アクションのフロー

1. **アクションの作成**: アクションタイプ、ペイロード、および状態ハンドラを定義します
2. **登録**: アクションをストアに登録します
3. **ディスパッチ**: `store.dispatch(type, payload)` を呼び出します
4. **ミドルウェア**: オプションのミドルウェアがアクションをインターセプトします
5. **実行**: 状態ハンドラが新しい状態を生成します
6. **通知**: 購読者が更新された状態を受け取ります

```ts
const increment = createAction<{ amount: number }, State>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({ ...state, value: state.value + payload.amount }));

store.register("Increment", increment);
store.dispatch("tagix/action/Increment", { amount: 5 });
```

## ディスパッチのパターン

### 文字列ベースのディスパッチ

```ts
store.dispatch("tagix/action/Increment", { amount: 5 });
```

### アクションクリエイターによるディスパッチ

```ts
const increment = (amount: number) => createAction("Increment").withPayload({ amount });

store.dispatch(increment, { amount: 5 });
```

### 非同期ディスパッチ

```ts
const fetchData = createAsyncAction("FetchData")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async () => await fetch("/api/data").then((r) => r.json()))
  .onSuccess((s, data) => ({ ...s, _tag: "Ready", data }));

await store.dispatch(fetchData);
```

## ミドルウェアチェーン

ミドルウェアは、各アクションが通過するチェーンを形成します：

```ts
const logging = () => (next) => (action) => {
  console.log(action.type);
  return next(action);
};

const store = createStore(initial, state, {
  middlewares: [logging, analytics, throttle],
});
```

## フォーキング（Forking）

テストや隔離されたブランチのために、ストアの隔離されたコピーを作成します：

```ts
const mainStore = createStore(initialState, state);
const fork = mainStore.fork();

// fork への変更は mainStore には影響しません
fork.dispatch("Action", payload);
```

## 次のステップ

| トピック                            | 説明                             |
| ----------------------------------- | -------------------------------- |
| [状態定義](/docs/state-definitions) | アプリケーションの状態を定義する |
| [アクション](/docs/actions)         | 同期的な状態更新を作成する       |
