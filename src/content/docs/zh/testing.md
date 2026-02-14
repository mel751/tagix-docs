---
category: Advanced
alias: testing
title: 测试
description: Tagix 应用程序的测试策略
order: 41
---

# 测试

## Action 单元测试

隔离测试 Action：

```ts
import { describe, it, expect } from "vitest";
import { createAction } from "tagix";

const CounterState = taggedEnum({
  Idle: { value: 0 },
  Ready: { value: 0 },
});

const increment = createAction<{ amount: number }, typeof CounterState.State>("Increment")
  .withPayload({ amount: 1 })
  .withState((s, p) => ({
    ...s,
    value: s.value + p.amount,
  }));

describe("Actions", () => {
  it("应该增加数值", () => {
    const state = CounterState.Idle({ value: 0 });
    const nextState = increment.handler(state, { amount: 5 });
    expect(nextState.value).toBe(5);
  });

  it("应该处理负数", () => {
    const state = CounterState.Ready({ value: 10 });
    const nextState = increment.handler(state, { amount: -3 });
    expect(nextState.value).toBe(7);
  });
});
```

## Store 测试

```ts
describe("Store", () => {
  it("应该派发 Action", () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    store.register("Increment", increment);
    store.dispatch("tagix/action/Increment", { amount: 5 });

    const state = store.stateValue as Extract<typeof CounterState.State, { _tag: "Ready" }>;
    expect(state.value).toBe(5);
  });

  it("应该通知订阅者", () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    let callCount = 0;
    const unsubscribe = store.subscribe(() => {
      callCount++;
    });

    store.dispatch("tagix/action/Increment", { amount: 1 });
    expect(callCount).toBe(1);

    unsubscribe();
    store.dispatch("tagix/action/Increment", { amount: 1 });
    expect(callCount).toBe(1);
  });
});
```

## 异步 Action 测试

```ts
describe("Async Actions", () => {
  it("应该处理异步流程", async () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    const asyncIncrement = createAsyncAction<{ amount: number }, typeof CounterState.State, number>(
      "AsyncIncrement"
    )
      .state((s) => ({ ...s, _tag: "Ready" }))
      .effect(async (p) => {
        await new Promise((r) => setTimeout(r, 10));
        return p.amount;
      })
      .onSuccess((s, result) => ({ ...s, value: result }));

    store.register("AsyncIncrement", asyncIncrement);

    await store.dispatch(asyncIncrement, { amount: 42 });

    const state = store.stateValue as Extract<typeof CounterState.State, { _tag: "Ready" }>;
    expect(state.value).toBe(42);
  });

  it("应该处理错误", async () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    const failingAction = createAsyncAction<void, typeof CounterState.State, never>("Failing")
      .state((s) => ({ ...s, _tag: "Ready" }))
      .effect(async () => {
        throw new Error("测试错误");
      })
      .onSuccess((s) => s)
      .onError((s, error) => ({ ...s, _tag: "Idle" }));

    store.register("Failing", failingAction);
    await store.dispatch(failingAction);

    expect(store.stateValue._tag).toBe("Idle");
  });
});
```

## 用于测试的分叉 (Forking)

使用分叉隔离测试：

```ts
describe("Fork Testing", () => {
  it("不应影响主 Store", () => {
    const mainStore = createStore(CounterState.Idle({ value: 0 }), CounterState);

    const fork = mainStore.fork();

    // 修改分叉
    fork.dispatch("tagix/action/Increment", { amount: 100 });

    // 验证分叉已更改
    const forkState = fork.stateValue;
    expect(forkState.value).toBe(100);

    // 验证主 Store 未改变
    const mainState = mainStore.stateValue;
    expect(mainState.value).toBe(0);
  });
});
```

## Selector 测试

```ts
describe("Selectors", () => {
  const selectors = {
    getValue: (state: typeof CounterState.State) => (state._tag === "Ready" ? state.value : 0),
  };

  it("应该从 Ready 状态中提取值", () => {
    const state = CounterState.Ready({ value: 42 });
    expect(selectors.getValue(state)).toBe(42);
  });

  it("对于 Idle 状态应该返回 0", () => {
    const state = CounterState.Idle({ value: 0 });
    expect(selectors.getValue(state)).toBe(0);
  });
});
```

## 集成测试

```ts
describe("Integration", () => {
  it("应该处理完整的流程", async () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    store.register("Increment", increment);

    // 初始状态
    expect(store.stateValue.value).toBe(0);

    // 派发多个 Action
    store.dispatch("tagix/action/Increment", { amount: 5 });
    expect(store.stateValue.value).toBe(5);

    store.dispatch("tagix/action/Increment", { amount: 3 });
    expect(store.stateValue.value).toBe(8);

    // 订阅并验证
    const states: number[] = [];
    const unsubscribe = store.subscribe((s) => {
      if (s._tag === "Ready") states.push(s.value);
    });

    store.dispatch("tagix/action/Increment", { amount: 2 });
    expect(states).toContain(10);

    unsubscribe();
  });
});
```

## 模拟依赖 (Mocking)

```ts
describe("With Mocks", () => {
  it("应该使用模拟的 API", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ json: () => ({ id: 1, name: "Test" }) });

    const fetchUser = createAsyncAction<{ id: number }, UserState, User>("Fetch")
      .state((s) => ({ ...s, _tag: "Loading" }))
      .effect(async (p) => {
        const response = await mockFetch(`/api/users/${p.id}`);
        return response.json();
      })
      .onSuccess((s, user) => ({ ...s, _tag: "Loaded", user }))
      .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));

    const store = createStore(UserState.Idle({}), UserState);
    store.register("Fetch", fetchUser);

    await store.dispatch(fetchUser, { id: 1 });

    expect(mockFetch).toHaveBeenCalledWith("/api/users/1");
  });
});
```

## 另请参阅

- [状态定义](/docs/state-definitions) - 用于测试的状态
- [Action](/docs/actions) - 测试 Action
- [异步 Action](/docs/async-actions) - 测试异步流程

## 下一步

恭喜！您已完成 Tagix 文档。更多资源：

| 资源                                                       | 描述                                 |
| :--------------------------------------------------------- | :----------------------------------- |
| [GitHub 代码仓库](https://github.com/chrismichaelps/tagix) | 访问源代码、Issue 和讨论             |
| [安装](/docs/installation)                                 | 查看设置指南以验证您的环境           |
| [快速入门](/docs/quick-start)                              | 构建您的第一个应用程序并尝试各项特性 |
