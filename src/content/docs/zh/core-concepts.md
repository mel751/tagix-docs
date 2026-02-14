---
category: Getting Started
alias: core-concepts
title: 核心概念
description: 理解驱动 Tagix 的基础概念
order: 3
---

# 核心概念

理解驱动 Tagix 的基础概念。

## Tagged Unions

Tagix 使用 Tagged Unions（辨识联合）来表示状态。每个状态变体都带有一个唯一的 `_tag` 属性，从而实现详尽的类型检查：

```ts
const UserState = taggedEnum({
  Unauthenticated: {},
  Authenticating: { loading: true },
  Authenticated: { user: { id: number; name: string } },
  AuthError: { message: string },
});
```

编译器确保所有变体都得到处理：

```ts
function processUserState(state: UserStateType) {
  switch (state._tag) {
    case "Unauthenticated":
      return "请登录";
    case "Authenticating":
      return "正在登录...";
    case "Authenticated":
      return `欢迎，${state.user.name}`;
    case "AuthError":
      return state.message;
    default:
      // TypeScript 确保不存在其他变体
      return assertNever(state);
  }
}
```

## Action

Action 是状态转换的机制。一个 Action 由以下部分组成：

1. **类型标识符** - 标识 Action 的唯一字符串
2. **Payload 类型** - 随 Action 传递的可选数据
3. **状态处理器** - 计算下一个状态的函数

```ts
const increment = createAction<{ amount: number }, State>("Increment")
  .withPayload({ amount: 1 })
  .withState((state, payload) => ({
    ...state,
    value: state.value + payload.amount,
  }));
```

## Store

Store 是中央状态容器，负责：

- 持有当前状态值
- 管理 Action 注册
- 处理派发逻辑
- 通知订阅者更改

```ts
const store = createStore(initialState, stateDefinition, {
  name: "MyStore",
  middleware: [logger],
});
```

## 订阅者

组件可以订阅状态更改：

```ts
const unsubscribe = store.subscribe((state) => {
  // 在每次状态更改时调用
});

unsubscribe(); // 清理
```

## 中间件

中间件通过拦截 Action 来扩展派发行为：

```ts
const loggerMiddleware = () => (next) => (action) => {
  console.log("Action:", action.type);
  return next(action);
};
```

## 类型推导

Tagix 通过状态定义提供完整的类型推导：

```ts
const CounterState = taggedEnum({
  Idle: { value: 0 },
  Ready: { value: 0 },
});

// 类型被自动推导为：
// { readonly _tag: "Idle"; readonly value: 0 } | { readonly _tag: "Ready"; readonly value: 0 }
const state = CounterState.Idle({ value: 0 });
```

## 核心原则

1. **状态优先** - 在 Action 之前定义状态
2. **显式转换** - 每一个状态更改都通过 Action 进行
3. **类型安全** - 让 TypeScript 强制执行正确性
4. **框架无关** - 适用于任何 UI 库
5. **函数式** - 不可变更新，纯函数

## 下一步

| 主题                                | 描述                 |
| ----------------------------------- | -------------------- |
| [架构](/docs/architecture)          | 理解内部设计         |
| [状态定义](/docs/state-definitions) | 定义您的应用程序状态 |
