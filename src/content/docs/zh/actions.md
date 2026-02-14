---
category: State Management
alias: actions
title: Action
description: 用于状态更新的同步 Action Creator
order: 11
---

# Action

用于状态更新的同步 Action Creator。

## 创建 Action

使用 `createAction` 定义具有类型安全 Payload 和状态转换的 Action：

```ts
import { createAction } from "tagix";

const increment = createAction<{ amount: number }, CounterState>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({
    ...state,
    value: state.value + payload.amount,
  }));
```

## Action 组件

### 类型标识符

第一个参数是唯一的 Action 类型：

```ts
const action = createAction<Payload, State>("MyAction");
// Action 类型变为："tagix/action/MyAction"
```

### Payload 类型

定义随 Action 传递的数据形状：

```ts
// 无 Payload
const reset = createAction<void, State>("Reset")
  .withPayload(undefined)
  .withState(() => initialState);

// 带 Payload
const setValue = createAction<{ value: number }, State>("SetValue")
  .withPayload({ value: 0 })
  .withState((state, payload) => ({ ...state, value: payload.value }));
```

### 状态处理器

`withState` 方法定义状态如何转换：

```ts
const increment = createAction<{ amount: number }, State>("Increment")
  .withPayload({ amount: 1 })
  .withState((currentState, payload) => {
    // 返回新状态
    return {
      ...currentState,
      value: currentState.value + payload.amount,
    };
  });
```

## 注册 Action

Action 必须注册到 Store：

```ts
const store = createStore(initialState, state);

store.register("Increment", increment);
store.register("Decrement", decrement);
store.register("Reset", reset);
```

## 派发 Action

### 基于字符串的派发

```ts
store.dispatch("tagix/action/Increment", { amount: 5 });
```

### Action Creator 派发

直接传递 Action Creator：

```ts
// 直接 Action
store.dispatch(increment, { amount: 5 });

// 柯里化的 Action Creator
const incrementBy = (amount: number) => increment;
store.dispatch(incrementBy, { amount: 10 });
```

### Action Creator 模式

定义可重用的 Action Creator：

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

## 条件状态转换

状态处理器可以根据条件返回不同的状态：

```ts
const updateUser = createAction<{ name: string }, UserState>("UpdateUser")
  .withPayload({ name: "" })
  .withState((state, payload) => {
    if (state._tag !== "Authenticated") {
      return state; // 无更改
    }
    return {
      ...state,
      user: { ...state.user, name: payload.name },
    };
  });
```

## 多个 Action

处理多个连续的 Action：

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
// 结果：value = 20
```

## 错误处理

Store 会为未注册的类型抛出错误：

```ts
try {
  store.dispatch("tagix/action/Unknown", {});
} catch (error) {
  if (error instanceof ActionNotFoundError) {
    console.log("Action 未注册");
  }
}
```

## 最佳实践

### 一个 Action，一个责任

每个 Action 应该只处理一个逻辑更新：

```ts
// 推荐 - 专注的 Action
const setUser = createAction<{ user: User }, State>("SetUser").withState((s, p) => ({
  ...s,
  user: p.user,
}));

const clearUser = createAction<void, State>("ClearUser").withState((s) => ({ ...s, user: null }));

// 避免 - 涉及过多关注点
const setUserAndClearCacheAndNotify = createAction<{ user: User }, State>("Everything").withState(
  (s, p) => {
    // 复杂的更新
  }
);
```

### 描述性的 Action 名称

使用清晰且具有描述性的 Action 名称：

```ts
// 推荐
const markTodoComplete = createAction<{ id: number }, State>("MarkTodoComplete").withState(
  (s, p) => ({ ...s, todos: s.todos.map((t) => (t.id === p.id ? { ...t, complete: true } : t)) })
);

// 避免
const doit = createAction<{ id: number }, State>("Doit");
```

## 另请参阅

- [异步 Action](/docs/async-actions) - 处理异步操作
- [状态定义](/docs/state-definitions) - 状态结构
- [中间件](/docs/middleware) - 扩展派发行为

## 下一步

| 主题                               | 描述         |
| ---------------------------------- | ------------ |
| [异步 Action](/docs/async-actions) | 处理异步操作 |
| [状态机](/docs/state-machines)     | 建模状态转换 |
