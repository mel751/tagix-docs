---
category: State Management
alias: state-definitions
title: 状态定义
description: 使用 Tagged Unions 定义应用程序状态
order: 10
---

# 状态定义

使用 Tagged Unions（辨识联合）定义您的应用程序状态。

## 使用 taggedEnum

`taggedEnum` 函数创建具有类型安全性的完整状态定义：

```ts
import { taggedEnum } from "tagix";

const UserState = taggedEnum({
  Unauthenticated: {},
  Authenticating: { loading: true },
  Authenticated: {
    user: { id: number; email: string; name: string },
    token: string,
  },
  AuthError: { message: string },
});
```

## 生成的产物

`taggedEnum` 生成：

1. **构造函数** - 创建状态实例
2. **State 类型** - 所有变体的联合类型
3. **模式助手** - 类型安全的状态访问

```ts
// 构造函数
const unauthenticated = UserState.Unauthenticated({});
const authenticating = UserState.Authenticating({ loading: true });
const authenticated = UserState.Authenticated({
  user: { id: 1, email: "test@example.com", name: "Test" },
  token: "abc123",
});

// State 类型 (推导)
type UserStateType = typeof UserState.State;

// 类型为：
// { readonly _tag: "Unauthenticated" } |
// { readonly _tag: "Authenticating"; readonly loading: boolean } |
// { readonly _tag: "Authenticated"; readonly user: {...}; readonly token: string } |
// { readonly _tag: "AuthError"; readonly message: string }
```

## 空变体与带数据的变体

变体可以拥有属性，也可以为空：

```ts
const LoadingState = taggedEnum({
  Idle: {}, // 无属性
  Loading: { progress: number }, // 带属性
});
```

## 嵌套结构

状态可以包含复杂的嵌套结构：

```ts
const AppState = taggedEnum({
  Ready: {
    user: {
      profile: {
        settings: {
          theme: "light" | "dark";
          notifications: boolean;
        };
      };
    };
    posts: Array<{ id: number; title: string }>;
  },
});
```

## 类型收窄

`_tag` 属性实现了详尽的类型检查：

```ts
function processUser(state: UserStateType) {
  switch (state._tag) {
    case "Unauthenticated":
      // TypeScript 知道状态没有 user 属性
      return "请登录";
    case "Authenticating":
      // TypeScript 知道 state.loading 存在
      return state.loading ? "加载中..." : "启动中";
    case "Authenticated":
      // TypeScript 知道 state.user 存在
      return `你好，${state.user.name}`;
    case "AuthError":
      // TypeScript 知道 state.message 存在
      return state.message;
    default:
      // 详尽性检查
      return assertNever(state);
  }
}
```

## Extract 助手

使用 `Extract` 获取特定变体的类型：

```ts
import { Extract } from "tagix";

type AuthenticatedState = Extract<UserStateType, { _tag: "Authenticated" }>;

// AuthenticatedState 为：
// {
//   readonly _tag: "Authenticated";
//   readonly user: { id: number; email: string; name: string };
//   readonly token: string;
// }
```

## 最佳实践

### 每个领域一个状态

为不同的领域创建独立的状态定义：

```ts
// 用户状态
const UserState = taggedEnum({
  /* ... */
});

// 帖子状态
const PostsState = taggedEnum({
  /* ... */
});

// 在根状态中合并
const AppState = taggedEnum({
  User: UserState,
  Posts: PostsState,
});
```

### 尽可能扁平化

如果扁平化方案可行，请避免深层嵌套结构：

```ts
// 推荐
const FormState = taggedEnum({
  Idle: {},
  Submitting: { values: Record<string, unknown> },
  Success: { data: unknown },
  Error: { errors: Record<string, string> },
});

// 避免深层嵌套
const DeepFormState = taggedEnum({
  Form: {
    Status: {
      Idle: {},
      Submitting: { values: Record<string, unknown> },
      // ... 更多嵌套
    },
  },
});
```

### 有意义的标签名

使用描述性的标签名称：

```ts
// 推荐
const StatusState = taggedEnum({
  Pending: {},
  Processing: {},
  Completed: {},
  Failed: { reason: string },
});

// 避免
const StatusState = taggedEnum({
  One: {},
  Two: {},
  Three: {},
});
```

## 另请参阅

- [Action](/docs/actions) - 修改状态
- [状态机](/docs/state-machines) - 状态转换
- [类型安全](/docs/type-safety) - TypeScript 模式

## 下一步

| 主题                               | 描述             |
| ---------------------------------- | ---------------- |
| [Action](/docs/actions)            | 创建同步状态更新 |
| [异步 Action](/docs/async-actions) | 处理异步操作     |
