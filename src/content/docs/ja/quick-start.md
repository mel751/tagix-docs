---
category: Getting Started
alias: quickstart
title: クイックスタート
description: 5分以内に最初のTagixアプリケーションを構築しましょう
order: 2
---

# クイックスタート

5分以内に最初のTagixアプリケーションを構築しましょう。

## ステップ 1: 状態の定義

Tagixの状態は、`taggedEnum`を使用して直和型（Discriminated Unions）として定義する必要があります：

```ts
import { taggedEnum } from "tagix";

const CounterState = taggedEnum({
  Idle: { value: 0 },
  Loading: {},
  Ready: { value: 0 },
  Error: { message: "" },
});

type CounterStateType = typeof CounterState.State;
```

`taggedEnum`関数は以下を作成します：

- 判別のための`_tag`プロパティを持つ型
- 各状態バリアントのコンストラクタ関数
- すべてのバリアントの和型である`State`型

## ステップ 2: ストアの作成

初期状態を指定してストアをインスタンス化します：

```ts
import { createStore } from "tagix";

const store = createStore(CounterState.Idle({ value: 0 }), CounterState, { name: "Counter" });
```

## ステップ 3: アクションの作成

アクションは状態遷移を定義します。同期的な更新には`createAction`を使用します：

```ts
import { createAction } from "tagix";

const increment = createAction<{ amount: number }, CounterStateType>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({
    ...state,
    value: state.value + payload.amount,
  }));

const reset = createAction<void, CounterStateType>("Reset")
  .withPayload(undefined)
  .withState(() => CounterState.Idle({ value: 0 }));
```

## ステップ 4: アクションの登録

使用する前に、アクションをストアに登録する必要があります：

```ts
store.register("Increment", increment);
store.register("Reset", reset);
```

## ステップ 5: アクションのディスパッチ

ディスパッチを通じて状態変更をトリガーします：

```ts
// 同期ディスパッチ
store.dispatch("tagix/action/Increment", { amount: 5 });

// 現在の状態を確認
console.log(store.stateValue._tag); // "Ready"
console.log((store.stateValue as Extract<CounterStateType, { _tag: "Ready" }>).value); // 5
```

## ステップ 6: 変更の購読

状態の更新をリッスンします：

```ts
const unsubscribe = store.subscribe((state) => {
  console.log("状態が変更されました:", state._tag);
});

// 後で購読を停止する場合
unsubscribe();
```

## 完全な例

```ts
import { createStore, createAction, taggedEnum } from "tagix";

const CounterState = taggedEnum({
  Idle: { value: 0 },
  Loading: {},
  Ready: { value: 0 },
  Error: { message: "" },
});

type CounterStateType = typeof CounterState.State;

const store = createStore(CounterState.Idle({ value: 0 }), CounterState, {
  name: "Counter",
});

const increment = createAction<{ amount: number }, CounterStateType>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({
    ...state,
    value: state.value + payload.amount,
  }));

store.register("Increment", increment);

store.subscribe((state) => {
  if (state._tag === "Ready") {
    console.log("値:", state.value);
  }
});

store.dispatch("tagix/action/Increment", { amount: 10 });
// 出力: 値: 10
```

## 次のステップ

| トピック                                | 説明                       |
| --------------------------------------- | -------------------------- |
| [コアコンセプト](/docs/core-concepts)   | 基本コンセプトを理解する   |
| [アクション](/docs/actions)             | 同期アクションについて学ぶ |
| [非同期アクション](/docs/async-actions) | 非同期操作を処理する       |
