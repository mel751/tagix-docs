---
category: Getting Started
alias: quickstart
title: 快速入门
description: 在五分钟内构建您的第一个 Tagix 应用程序
order: 2
---

# 快速入门

在五分钟内构建您的第一个 Tagix 应用程序。

## 第 1 步：定义状态

Tagix 中的状态必须使用 `taggedEnum` 定义为辨识联合（Discriminated Unions）：

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

`taggedEnum` 函数创建：

- 一个带有 `_tag` 属性用于辨识的类型
- 每个状态变体的构造函数
- 所有变体的联合类型 `State`

## 第 2 步：创建 Store

使用初始状态实例化 Store：

```ts
import { createStore } from "tagix";

const store = createStore(CounterState.Idle({ value: 0 }), CounterState, { name: "Counter" });
```

## 第 3 步：创建 Action

Action 定义状态转换。使用 `createAction` 进行同步更新：

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

## 第 4 步：注册 Action

Action 在使用前必须注册到 Store：

```ts
store.register("Increment", increment);
store.register("Reset", reset);
```

## 第 5 步：派发 Action

通过 dispatch 触发状态更改：

```ts
// 同步派发
store.dispatch("tagix/action/Increment", { amount: 5 });

// 检查当前状态
console.log(store.stateValue._tag); // "Ready"
console.log((store.stateValue as Extract<CounterStateType, { _tag: "Ready" }>).value); // 5
```

## 第 6 步：订阅更改

监听状态更新：

```ts
const unsubscribe = store.subscribe((state) => {
  console.log("状态已更改:", state._tag);
});

// 稍后停止监听
unsubscribe();
```

## 完整示例

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
    console.log("值:", state.value);
  }
});

store.dispatch("tagix/action/Increment", { amount: 10 });
// 输出: 值: 10
```

## 下一步

| 主题                               | 描述         |
| ---------------------------------- | ------------ |
| [核心概念](/docs/core-concepts)    | 理解基本概念 |
| [Action](/docs/actions)            | 了解同步行动 |
| [异步 Action](/docs/async-actions) | 处理异步操作 |
