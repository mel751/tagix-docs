---
category: Advanced
alias: type-safety
title: 类型安全
description: 利用 TypeScript 确保编译时正确性
order: 40
---

# 类型安全

利用 TypeScript 确保编译时正确性。

## 推导

Tagix 从状态定义中提供完整的类型推导：

```ts
const CounterState = taggedEnum({
  Idle: { value: 0 },
  Loading: {},
  Ready: { value: 0 },
  Error: { message: "" },
});

// 所有类型都会自动推导
const initial = CounterState.Idle({ value: 0 });
// 类型：{ readonly _tag: "Idle"; readonly value: 0 }

type CounterType = typeof CounterState.State;
// 类型：{ readonly _tag: "Idle"; readonly value: 0 } |
//        { readonly _tag: "Loading" } |
//        { readonly _tag: "Ready"; readonly value: 0 } |
//        { readonly _tag: "Error"; readonly message: string }
```

## 详尽模式匹配

TypeScript 强制要求处理所有状态变体：

```ts
function processState(state: CounterType) {
  switch (state._tag) {
    case "Idle":
      return state.value; // number
    case "Loading":
      return "加载中..."; // string
    case "Ready":
      return state.value; // number
    case "Error":
      return state.message; // string
    default:
      // TypeScript 确保这是不可达的
      return assertNever(state);
  }
}
```

## Extract 模式

获取特定变体的类型：

```ts
import { Extract } from "tagix";

type ReadyState = Extract<CounterType, { _tag: "Ready" }>;
// ReadyState: { readonly _tag: "Ready"; readonly value: 0 }

const ready: ReadyState = CounterState.Ready({ value: 10 });
```

## Action 泛型

Action 的 Payload 类型是自动推导的：

```ts
const increment = createAction<{ amount: number }, CounterType>("Increment")
  .withPayload({ amount: 1 })
  .withState((s, p) => ({ ...s, value: s.value + p.amount }));

// TypeScript 知道：
// - Payload 类型：{ amount: number }
// - 状态类型：CounterType
// - Action 类型："tagix/action/Increment"
```

## 异步 Action 类型

异步 Action 会推导成功和错误类型：

```ts
const fetchUser = createAsyncAction<{ id: number }, UserState, User>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload) => {
    const response = await fetch(`/api/users/${payload.id}`);
    return response.json(); // 推导为 User
  })
  .onSuccess((s, user) => ({ ...s, _tag: "Loaded", user }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));

// 类型：
// - Payload: { id: number }
// - 成功结果: User
// - 状态: UserState
```

## 利用 Guard 进行类型收窄

为状态变体创建类型守卫：

```ts
const isReady = (state: CounterType): state is Extract<CounterType, { _tag: "Ready" }> => {
  return state._tag === "Ready";
};

const isError = (state: CounterType): state is Extract<CounterType, { _tag: "Error" }> => {
  return state._tag === "Error";
};

// 使用
if (isReady(state)) {
  // TypeScript 知道状态是 Ready 变体
  console.log(state.value);
}
```

## 泛型 Action

创建可重用的 Action 工厂：

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

## 类型断言

仅在必要时谨慎使用类型断言：

```ts
const state = store.stateValue as Extract<CounterType, { _tag: "Ready" }>;
```

## 最佳实践

### 让类型顺其自然

当推导生效时，避免手动进行类型注释：

```ts
// 推荐 - 推导出的类型
const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

// 不推荐 - 冗余的注释
const store = createStore<CounterType>(CounterState.Idle({ value: 0 }), CounterState);
```

### 使用 Extract 处理变体

以整洁的方式访问特定状态变体：

```ts
// 推荐
type LoadedState = Extract<State, { _tag: "Loaded" }>;

// 避免 - 脆弱
const state = store.getState("Loaded") as { data: unknown };
```

### 详尽性检查

让 TypeScript 捕获漏掉的情况：

```ts
function handleState(state: State) {
  switch (state._tag) {
    case "A":
      return handleA(state);
    case "B":
      return handleB(state);
    // 缺失 case C
    default:
      return assertNever(state);
  }
}
```

## 另请参阅

- [状态定义](/docs/state-definitions) - 类型安全状态
- [Action](/docs/actions) - 类型安全 Action
- [异步 Action](/docs/async-actions) - 类型安全异步操作

## 下一步

| 主题                  | 描述             |
| --------------------- | ---------------- |
| [测试](/docs/testing) | 应用程序测试策略 |
