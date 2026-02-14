---
category: State Management
alias: actions
title: アクション
description: 状態更新のための同期的なアクションクリエイター
order: 11
---

# アクション

状態更新のための同期的なアクションクリエイターについて学びます。

## アクションの作成

`createAction` を使用して、型安全なペイロードと状態遷移を持つアクションを定義します：

```ts
import { createAction } from "tagix";

const increment = createAction<{ amount: number }, CounterState>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({
    ...state,
    value: state.value + payload.amount,
  }));
```

## アクションの構成要素

### タイプ識別子

最初のパラメータは、一意のアクションタイプです：

```ts
const action = createAction<Payload, State>("MyAction");
// アクションタイプは "tagix/action/MyAction" になります
```

### ペイロード型

アクションとともに渡されるデータの形状を定義します：

```ts
// ペイロードなし
const reset = createAction<void, State>("Reset")
  .withPayload(undefined)
  .withState(() => initialState);

// ペイロードあり
const setValue = createAction<{ value: number }, State>("SetValue")
  .withPayload({ value: 0 })
  .withState((state, payload) => ({ ...state, value: payload.value }));
```

### 状態ハンドラ

`withState` メソッドは、状態がどのように遷移するかを定義します：

```ts
const increment = createAction<{ amount: number }, State>("Increment")
  .withPayload({ amount: 1 })
  .withState((currentState, payload) => {
    // 新しい状態を返す
    return {
      ...currentState,
      value: currentState.value + payload.amount,
    };
  });
```

## アクションの登録

アクションはストアに登録する必要があります：

```ts
const store = createStore(initialState, state);

store.register("Increment", increment);
store.register("Decrement", decrement);
store.register("Reset", reset);
```

## アクションのディスパッチ

### 文字列ベースのディスパッチ

```ts
store.dispatch("tagix/action/Increment", { amount: 5 });
```

### アクションクリエイターによるディスパッチ

アクションクリエイターを直接渡します：

```ts
// 直接アクションを渡す
store.dispatch(increment, { amount: 5 });

// カリー化されたアクションクリエイター
const incrementBy = (amount: number) => increment;
store.dispatch(incrementBy, { amount: 10 });
```

### アクションクリエイターパターン

再利用可能なアクションクリエイターを定義します：

```ts
const createIncrement = (defaultAmount: number) =>
  createAction<{ amount: number }, State>("Increment")
    .withPayload({ amount: defaultAmount })
    .withState((state, payload) => ({
      ...state,
      value: state.value + payload.amount,
    }));

const incrementBy5 = createIncrement(5);
store.dispatch(incrementBy5);
```

## 条件付き状態遷移

状態ハンドラは、条件に応じて異なる状態を返すことができます：

```ts
const updateUser = createAction<{ name: string }, UserState>("UpdateUser")
  .withPayload({ name: "" })
  .withState((state, payload) => {
    if (state._tag !== "Authenticated") {
      return state; // 変更なし
    }
    return {
      ...state,
      user: { ...state.user, name: payload.name },
    };
  });
```

## 複数のアクション

複数の連続したアクションを処理します：

```ts
const add = createAction<{ n: number }, CounterState>("Add")
  .withPayload({ n: 10 })
  .withState((s, p) => ({ ...s, value: s.value + p.n }));

const multiply = createAction<{ n: number }, CounterState>("Multiply")
  .withPayload({ n: 2 })
  .withState((s, p) => ({ ...s, value: s.value * p.n }));

store.register("Add", add);
store.register("Multiply", multiply);

store.dispatch("tagix/action/Add", { n: 10 });
store.dispatch("tagix/action/Multiply", { n: 2 });
// 結果: value = 20
```

## エラーハンドリング

アクションは、未登録のタイプに対してエラーをスローします：

```ts
try {
  store.dispatch("tagix/action/Unknown", {});
} catch (error) {
  if (error instanceof ActionNotFoundError) {
    console.log("アクションが登録されていません");
  }
}
```

## ベストプラクティス

### 1つのアクションに1つの責任

各アクションは、1つの論理的な更新のみを処理すべきです：

```ts
// 良い例 - 焦点を絞ったアクション
const setUser = createAction<{ user: User }, State>("SetUser").withState((s, p) => ({
  ...s,
  user: p.user,
}));

const clearUser = createAction<void, State>("ClearUser").withState((s) => ({ ...s, user: null }));

// 避けるべき例 - 関心事が多すぎる
const setUserAndClearCacheAndNotify = createAction<{ user: User }, State>("Everything").withState(
  (s, p) => {
    // 複雑な更新
  }
);
```

### 説明的なアクション名

明確で説明的なアクション名を使用します：

```ts
// 良い例
const markTodoComplete = createAction<{ id: number }, State>("MarkTodoComplete").withState(
  (s, p) => ({ ...s, todos: s.todos.map((t) => (t.id === p.id ? { ...t, complete: true } : t)) })
);

// 避けるべき例
const doit = createAction<{ id: number }, State>("Doit");
```

## 参照

- [非同期アクション](/docs/async-actions) - 非同期操作の処理
- [状態定義](/docs/state-definitions) - 状態構造
- [ミドルウェア](/docs/middleware) - ディスパッチ動作の拡張

## 次のステップ

| トピック                                | 説明                   |
| --------------------------------------- | ---------------------- |
| [非同期アクション](/docs/async-actions) | 非同期操作を処理する   |
| [ステートマシン](/docs/state-machines)  | 状態遷移をモデル化する |
