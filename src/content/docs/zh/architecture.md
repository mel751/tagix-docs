---
category: Getting Started
alias: architecture
title: 架构
description: 理解 Tagix 的内部设计
order: 4
---

## Store 结构

Store 是管理状态和派发的中心组件：

```ts
class TagixStore<S extends { readonly _tag: string }> {
  // 当前状态 (getter)
  readonly stateValue: S;

  // Store 元数据
  readonly name: string;
  readonly registeredActions: readonly string[];

  // 核心操作
  dispatch(type: string, payload?: unknown): Promise<void> | void;
  subscribe(callback: (state: S) => void): () => void;
  fork(): TagixStore<S>;

  // 查询操作
  select<K extends keyof S>(key: K): S[K];
  isInState(tag: string): boolean;
  getState<T extends S["_tag"]>(tag: T): Extract<S, { _tag: T }> | null;
}
```

## 状态定义

状态使用 `taggedEnum` 定义，它创建了一个具有辨识变体的类型：

```ts
const AppState = taggedEnum({
  Idle: {},
  Loading: { progress: number },
  Ready: { data: unknown },
  Error: { message: string },
});

// 创建：
// - 带有 _tag 属性的 AppState 类型
// - 构造函数 (AppState.Idle() 等)
// - 状态联合类型 (AppState.State)
```

## Action 流程

1. **Action 创建**: 定义 Action 类型、Payload 和状态处理器
2. **注册**: 将 Action 注册到 Store
3. **派发**: 调用 `store.dispatch(type, payload)`
4. **中间件**: 可选的中间件拦截 Action
5. **执行**: 状态处理器生成新状态
6. **通知**: 订阅者接收更新后的状态

```ts
const increment = createAction<{ amount: number }, State>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({ ...state, value: state.value + payload.amount }));

store.register("Increment", increment);
store.dispatch("tagix/action/Increment", { amount: 5 });
```

## 派发模式

### 基于字符串的派发

```ts
store.dispatch("tagix/action/Increment", { amount: 5 });
```

### Action Creator 派发

```ts
const increment = (amount: number) => createAction("Increment").withPayload({ amount });

store.dispatch(increment, { amount: 5 });
```

### 异步派发

```ts
const fetchData = createAsyncAction("FetchData")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async () => await fetch("/api/data").then((r) => r.json()))
  .onSuccess((s, data) => ({ ...s, _tag: "Ready", data }));

await store.dispatch(fetchData);
```

## 中间件链

中间件形成一个链条，每个 Action 都会经过这个链条：

```ts
const logging = () => (next) => (action) => {
  console.log(action.type);
  return next(action);
};

const store = createStore(initial, state, {
  middlewares: [logging, analytics, throttle],
});
```

## 分叉 (Forking)

为测试或隔离的分支创建独立的 Store 副本：

```ts
const mainStore = createStore(initialState, state);
const fork = mainStore.fork();

// 对 fork 的更改不会影响 mainStore
fork.dispatch("Action", payload);
```

## 下一步

| 主题                                | 描述                 |
| ----------------------------------- | -------------------- |
| [状态定义](/docs/state-definitions) | 定义您的应用程序状态 |
| [Action](/docs/actions)             | 创建同步状态更新     |
