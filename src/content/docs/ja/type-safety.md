---
category: Advanced
alias: type-safety
title: 型安全
description: TypeScript を活用してコンパイル時の正当性を確保する
order: 40
---

# 型安全

TypeScript を活用してコンパイル時の正当性を確保します。

## 推論

Tagix は、状態定義から完全な型推論を提供します：

```ts
const CounterState = taggedEnum({
  Idle: { value: 0 },
  Loading: {},
  Ready: { value: 0 },
  Error: { message: "" },
});

// すべての型が自動的に推論されます
const initial = CounterState.Idle({ value: 0 });
// 型: { readonly _tag: "Idle"; readonly value: 0 }

type CounterType = typeof CounterState.State;
// 型: { readonly _tag: "Idle"; readonly value: 0 } |
//        { readonly _tag: "Loading" } |
//        { readonly _tag: "Ready"; readonly value: 0 } |
//        { readonly _tag: "Error"; readonly message: string }
```

## 網羅的なパターンマッチング

TypeScript は、すべての状態バリアントの処理を強制します：

```ts
function processState(state: CounterType) {
  switch (state._tag) {
    case "Idle":
      return state.value; // number
    case "Loading":
      return "読み込み中..."; // string
    case "Ready":
      return state.value; // number
    case "Error":
      return state.message; // string
    default:
      // TypeScript はこれが到達不能であることを保証します
      return assertNever(state);
  }
}
```

## Extract パターン

特定のバリアント型を取得します：

```ts
import { Extract } from "tagix";

type ReadyState = Extract<CounterType, { _tag: "Ready" }>;
// ReadyState: { readonly _tag: "Ready"; readonly value: 0 }

const ready: ReadyState = CounterState.Ready({ value: 10 });
```

## アクションのジェネリクス

アクションのペイロード型が推論されます：

```ts
const increment = createAction<{ amount: number }, CounterType>("Increment")
  .withPayload({ amount: 1 })
  .withState((s, p) => ({ ...s, value: s.value + p.amount }));

// TypeScript は以下を把握します：
// - ペイロード型: { amount: number }
// - 状態型: CounterType
// - アクション型: "tagix/action/Increment"
```

## 非同期アクションの型

非同期アクションは、成功時とエラー時の型を推論します：

```ts
const fetchUser = createAsyncAction<{ id: number }, UserState, User>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload) => {
    const response = await fetch(`/api/users/${payload.id}`);
    return response.json(); // User として推論されます
  })
  .onSuccess((s, user) => ({ ...s, _tag: "Loaded", user }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));

// 型:
// - ペイロード: { id: number }
// - 成功時の結果: User
// - 状態: UserState
```

## ガードによる絞り込み

状態バリアントの型ガードを作成します：

```ts
const isReady = (state: CounterType): state is Extract<CounterType, { _tag: "Ready" }> => {
  return state._tag === "Ready";
};

const isError = (state: CounterType): state is Extract<CounterType, { _tag: "Error" }> => {
  return state._tag === "Error";
};

// 使用例
if (isReady(state)) {
  // TypeScript は state が Ready バリアントであることを把握します
  console.log(state.value);
}
```

## ジェネリックアクション

再利用可能なアクションファクトリを作成します：

```ts
const createCounterActions = <T extends { value: number }>(initialValue: T["value"]) => {
  const initialState = taggedEnum({
    Idle: { value: initialValue },
    Ready: { value: initialValue },
  }) as { State: T };

  const increment = createAction<{ amount: number }, T["State"]>("Increment")
    .withPayload({ amount: 1 })
    .withState((s, p) => ({
      ...s,
      value: s.value + p.amount,
    }));

  return {
    state: initialState,
    increment,
  };
};

const counter = createCounterActions(0);
```

## 型アサーション

必要な場合にのみ、型アサーションを控えめに使用してください：

```ts
const state = store.stateValue as Extract<CounterType, { _tag: "Ready" }>;
```

## ベストプラクティス

### 型の流れに任せる

推論が機能する場合は、手動の型アノテーションを避けてください：

```ts
// 良い例 - 推論された型
const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

// 悪い例 - 冗長なアノテーション
const store = createStore<CounterType>(CounterState.Idle({ value: 0 }), CounterState);
```

### バリアントには Extract を使用する

特定の状態バリアントにクリーンにアクセスします：

```ts
// 良い例
type LoadedState = Extract<State, { _tag: "Loaded" }>;

// 避けるべき例 - 壊れやすい
const state = store.getState("Loaded") as { data: unknown };
```

### 網羅性チェック

TypeScript に不足しているケースを捕捉させます：

```ts
function handleState(state: State) {
  switch (state._tag) {
    case "A":
      return handleA(state);
    case "B":
      return handleB(state);
    // ケース C が不足しています
    default:
      return assertNever(state);
  }
}
```

## 参照

- [状態定義](/docs/state-definitions) - 型安全な状態
- [アクション](/docs/actions) - 型安全なアクション
- [非同期アクション](/docs/async-actions) - 型安全な非同期操作

## 次のステップ

| トピック                | 説明                         |
| ----------------------- | ---------------------------- |
| [テスト](/docs/testing) | アプリケーションのテスト戦略 |
