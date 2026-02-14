---
category: Features
alias: context
title: 上下文 (Context)
description: 框架无关的 Store 集成
order: 22
---

# 上下文 (Context)

## Store 上下文

Store 提供了与任何框架集成的方法：

```ts
const store = createStore(initialState, state, { name: "App" });

// 订阅更改
const unsubscribe = store.subscribe((state) => {
  console.log("状态已更改:", state);
});

// 派发 Action
store.dispatch("ActionType", payload);

// 查询状态
const isReady = store.isInState("Ready");
const readyState = store.getState("Ready");
const value = store.select("property");
```

## 框架集成

### 直接集成

在组件中直接访问 Store：

```ts
// 在任何组件中
const store = getStoreFromContext(); // 框架特定方法

// 订阅
const unsubscribe = store.subscribe((state) => {
  // 根据状态更新 UI
});

// 派发
store.dispatch("action", payload);

// 清理
unsubscribe();
```

### 响应式集成

创建响应式包装器：

```ts
// 原生订阅管理器
const createSubscriber = (store) => {
  const listeners = new Set();

  const unsubscribe = store.subscribe((state) => {
    listeners.forEach((fn) => fn(state));
  });

  return {
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    dispatch: store.dispatch,
    select: store.select,
  };
};
```

### 组件中的 Selector

导出计算值：

```ts
const createSelector = (store, selector) => {
  let current = selector(store.stateValue);

  store.subscribe(() => {
    const next = selector(store.stateValue);
    if (next !== current) {
      current = next;
      notifyListeners();
    }
  });

  return () => current;
};
```

## Store 访问模式

### 单例模式 (Singleton)

应用程序使用单一的 Store：

```ts
// store.ts
export const store = createStore(initialState, state);

// 其他位置
import { store } from "./store";
store.dispatch("action", payload);
```

### 上下文模式 (Context)

通过上下文提供 Store：

```ts
// 上下文创建 (框架无关)
const TagixContext = {
  Provider: (store, children) => children,
  Consumer: (store, render) => render(store),
};
```

### 依赖注入 (Dependency Injection)

将 Store 注入组件：

```ts
interface AppServices {
  store: TagixStore<State>;
  logger: Logger;
}

const createServices = (): AppServices => ({
  store: createStore(initialState, state),
  logger: new Logger(),
});

// 在需要的地方注入
const service = createServices();
```

## 多个 Store

合多个 Store：

```ts
const authStore = createStore(authInitial, authState);
const dataStore = createStore(dataInitial, dataState);
const uiStore = createStore(uiInitial, uiState);

// 在父级合并
const rootState = taggedEnum({
  Auth: authStore.stateValue,
  Data: dataStore.stateValue,
  UI: uiStore.stateValue,
});
```

## 分叉 (Forking) Store

为测试创建独立的副本：

```ts
const mainStore = createStore(initialState, state);

// 创建分叉
const testStore = mainStore.fork();

// 测试 Action
testStore.dispatch("action", payload);

// 验证
expect(testStore.stateValue).toMatchObject({
  /* 预期结果 */
});

// 原始 Store 保持不变
expect(mainStore.stateValue).toBe(originalState);
```

## 清理

务必清理订阅：

```ts
// 推荐
const unsubscribe = store.subscribe(handler);
return () => unsubscribe();

// 不推荐 - 内存泄漏
store.subscribe(handler);
// 未清理
```

## 下一步

| 主题                             | 描述                       |
| -------------------------------- | -------------------------- |
| [错误处理](/docs/error-handling) | 通过结构化状态处理错误     |
| [类型安全](/docs/type-safety)    | 利用 TypeScript 确保正确性 |
