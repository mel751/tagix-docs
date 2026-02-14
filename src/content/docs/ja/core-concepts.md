---
category: Getting Started
alias: core-concepts
title: コアコンセプト
description: Tagixを支える基本概念を理解する
order: 3
---

# コアコンセプト

Tagixを支える基本概念を理解しましょう。

## Tagged Unions

Tagixは状態の表現にTagged Unions（Discriminated Unions/識別共用体）を使用します。各状態のバリアントは、網羅的な型チェックを可能にする一意の`_tag`プロパティを持ちます：

```ts
const UserState = taggedEnum({
  Unauthenticated: {},
  Authenticating: { loading: true },
  Authenticated: { user: { id: number; name: string } },
  AuthError: { message: string },
});
```

コンパイラは、すべてのバリアントが処理されていることを保証します：

```ts
function processUserState(state: UserStateType) {
  switch (state._tag) {
    case "Unauthenticated":
      return "ログインしてください";
    case "Authenticating":
      return "ログイン中...";
    case "Authenticated":
      return `ようこそ、${state.user.name}さん`;
    case "AuthError":
      return state.message;
    default:
      // TypeScriptは他のバリアントが存在しないことを保証します
      return assertNever(state);
  }
}
```

## アクション

アクションは状態遷移のためのメカニズムです。アクションは以下の要素から構成されます：

1. **タイプ識別子** - アクションを識別する一意の文字列
2. **ペイロード型** - アクションに渡されるオプションのデータ
3. **状態ハンドラ** - 次の状態を計算する関数

```ts
const increment = createAction<{ amount: number }, State>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({
    ...state,
    value: state.value + payload.amount,
  }));
```

## ストア

ストアは、以下を行う中央の状態コンテナです：

- 現在の状態の値を保持する
- アクションの登録を管理する
- ディスパッチのロジックを処理する
- 変更を購読者に通知する

```ts
const store = createStore(initialState, stateDefinition, {
  name: "MyStore",
  middleware: [logger],
});
```

## 購読者（Subscribers）

コンポーネントは状態の変化を購読できます：

```ts
const unsubscribe = store.subscribe((state) => {
  // すべての状態変更時に呼び出されます
});

unsubscribe(); // クリーンアップ
```

## ミドルウェア

ミドルウェアは、アクションをインターセプトすることでディスパッチの動作を拡張します：

```ts
const loggerMiddleware = () => (next) => (action) => {
  console.log("アクション:", action.type);
  return next(action);
};
```

## 型推論

Tagixは状態定義を通じて完全な型推論を提供します：

```ts
const CounterState = taggedEnum({
  Idle: { value: 0 },
  Ready: { value: 0 },
});

// 型は自動的に以下のように推論されます：
// { readonly _tag: "Idle"; readonly value: 0 } | { readonly _tag: "Ready"; readonly value: 0 }
const state = CounterState.Idle({ value: 0 });
```

## 主要な原則

1. **状態優先（State First）** - アクションの前に状態を定義する
2. **明示的な遷移** - すべての状態変更はアクションを通じて行う
3. **型安全** - TypeScriptに正当性を強制させる
4. **フレームワークに依存しない** - あらゆるUIライブラリで動作する
5. **関数型** - 不変の更新、純粋関数

## 次のステップ

| トピック                             | 説明                             |
| ------------------------------------ | -------------------------------- |
| [アーキテクチャ](/docs/architecture) | 内部設計を理解する               |
| [状態定義](/docs/state-definitions)  | アプリケーションの状態を定義する |
