---
category: Features
alias: selectors
title: Selector
description: 从状态中提取和派生值
order: 20
---

# Selector

从状态中提取和派生值。

## Store Selector

Store 提供基本的选择功能：

```ts
const store = createStore(initialState, state);

// 获取特定属性
const value = store.select("user");

// 检查状态标签
if (store.isInState("Loaded")) {
  // 状态为 Loaded
}

// 获取类型化状态
const loadedState = store.getState("Loaded");
if (loadedState) {
  // 访问 loadedState.data
}
```

## 自定义 Selector

创建可重用的 Selector 函数：

```ts
const AppState = taggedEnum({
  Ready: {
    user: { name: string; email: string },
    posts: Array<{ id: number; title: string }>,
  },
  Loading: {},
});

const selectors = {
  getUser: (state: AppStateType) => {
    if (state._tag !== "Ready") return null;
    return state.user;
  },

  getUserName: (state: AppStateType) => {
    const user = selectors.getUser(state);
    return user?.name ?? "访客";
  },

  getPostCount: (state: AppStateType) => {
    if (state._tag !== "Ready") return 0;
    return state.posts.length;
  },

  getPostTitles: (state: AppStateType) => {
    if (state._tag !== "Ready") return [];
    return state.posts.map((p) => p.title);
  },
};
```

## 使用 Selector

```ts
const user = selectors.getUser(store.stateValue);
const name = selectors.getUserName(store.stateValue);
const count = selectors.getPostCount(store.stateValue);
```

## 派生 Selector

创建组合其他 Selector 的 Selector：

```ts
const derivedSelectors = {
  getUserDisplay: (state: AppStateType) => {
    const user = selectors.getUser(state);
    if (!user) return "匿名用户";
    return `${user.name} (${user.email})`;
  },

  hasPosts: (state: AppStateType) => {
    return selectors.getPostCount(state) > 0;
  },

  firstPostTitle: (state: AppStateType) => {
    const titles = selectors.getPostTitles(state);
    return titles[0] ?? null;
  },
};
```

## 记忆化 Selector

对于开销较大的计算，请使用记忆化 Selector：

```ts
import { memoize } from "tagix";

const expensiveSelector = memoize((state: AppStateType) => {
  // 昂贵的计算
  return computeHeavyValue(state);
});
```

## Selector 组合

从简单的 Selector 构建复杂的 Selector：

```ts
const dashboardSelectors = {
  getDashboardData: (state: AppStateType) => ({
    user: selectors.getUser(state),
    postCount: selectors.getPostCount(state),
    theme: state._tag === "Ready" ? "深色" : "浅色",
  }),

  isUserReady: (state: AppStateType) => {
    return selectors.getUser(state) !== null;
  },

  canCreatePost: (state: AppStateType) => {
    return selectors.getUser(state) !== null && !state._tag.startsWith("Loading");
  },
};
```

## 最佳实践

### 保持 Selector 纯净

Selector 不应修改状态：

```ts
// 推荐 - 纯 Selector
const getValue = (state: State) => state.value;

// 不推荐 - 修改了状态
const getValue = (state: State) => {
  state.value += 1; // 副作用！
  return state.value;
};
```

### 返回稳定的类型

对于可选值使用可空类型：

```ts
// 推荐
const getUser = (state: State): User | null => {
  return state._tag === "Ready" ? state.user : null;
};
```

### 在组件层级进行选择

组件应仅选择其所需的内容：

```ts
// 推荐 - 选择特定数据
const userName = useTagixState((state) => (state._tag === "Ready" ? state.user.name : null));

// 不推荐 - 订阅了整个状态
const fullState = useTagixState((state) => state);
```

## 另请参阅

- [上下文](/docs/context) - 框架集成
- [性能](/docs/performance) - 优化技术

## 下一步

| 主题                       | 描述           |
| -------------------------- | -------------- |
| [中间件](/docs/middleware) | 扩展派发行为   |
| [上下文](/docs/context)    | 框架无关的集成 |
