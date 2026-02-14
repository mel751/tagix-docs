---
category: Features
alias: hooks
title: Hook 工具
description: 通过 TagixContext 访问状态和派发 Action 的类型安全工具
order: 24
---

# Hook 工具

Hook 工具提供了通过 `TagixContext` 访问状态和派发 Action 的便捷函数。这些工具适用于任何支持 Hook 模式的框架。

## useMatch

对当前状态进行详尽模式匹配。每一个变体标签都必须被处理——编译器将强制执行详尽性。返回所有处理器返回类型的联合。

```ts
const name = useMatch(context, {
  LoggedIn: (s) => s.name,
  LoggedOut: () => "访客",
});
// name 被推导为 string
```

## useWhen

通过标签将当前状态收窄为单一变体。如果匹配，则返回变体的属性（不带 `_tag`），否则返回 `undefined`。

```ts
const user = useWhen(context, "LoggedIn");
if (user) {
  console.log(user.name); // 完全类型化
}
```

## useDispatch

返回一个类型化的派发函数。支持 **Action 对象派发**（推荐）以实现完全的类型安全性，以及传统的基于字符串的派发。

```ts
const dispatch = useDispatch(context);

// 推荐：通过 Action 引用进行类型化派发
dispatch(loginAction, { username: "chris" });

// 传统：基于字符串的派发（已弃用）
dispatch("Login", { username: "chris" });
```

## useActionGroup

从 Action 组创建类型化的派发器。组中的每个键都会变成一个类型化的方法。

```ts
const UserActions = createActionGroup("Auth", { login, logout });
const dispatch = useActionGroup(context, UserActions);

dispatch.login({ username: "chris" }); // 完全类型化
```

## useMatchPartial

非详尽模式匹配。仅处理指定的变体；其他变体返回 `undefined`。

```ts
const greeting = useMatchPartial(context, {
  LoggedIn: (s) => `欢迎，${s.name}`,
});
// greeting: string | undefined
```

## useStore

从上下文中返回当前的状态快照。

```ts
const state = useStore(context);
```

## useSelector

通过 Selector 函数返回状态的派生值。

```ts
const itemCount = useSelector(context, (s) => (s._tag === "Items" ? s.items.length : 0));
```

## useSubscribe

通过回调函数监听状态更改。返回一个取消订阅函数。

```ts
const unsubscribe = useSubscribe(context, (state) => {
  console.log("新状态:", state._tag);
});
```

## createSelector

构建一个 Selector 函数，每次调用时都会读取最新的状态。

```ts
const getName = createSelector(context, (s) => s.user?.name);
const name = getName();
```

---

## 传统 / 已弃用的 Hook

这些 Hook 为了向后兼容而保留，但将在下一个大版本中删除。

### useGetState

**已弃用**：请使用 `useMatch` 或 `useWhen` 代替。需要手动指定泛型和双重柯里化。

### useKey

**已弃用**：请使用 `useWhen` 或 `useMatch` 代替，以确保变体感知的访问。

### getStateProp

**已弃用**：请直接使用 tagged enum 构造函数上的 `$match`。

---

## 完整示例

```ts
import { createContext, createStore, createAction, taggedEnum, createActionGroup } from "tagix";
import { useMatch, useWhen, useDispatch, useActionGroup } from "tagix";

const UserState = taggedEnum({
  LoggedOut: {},
  LoggedIn: { name: "", email: "" },
});

const login = createAction("Login")
  .withPayload({ username: "" })
  .withState((_, p) => UserState.LoggedIn({ name: p.username, email: "" }));

const UserActions = createActionGroup("Auth", { login });

const store = createStore(UserState.LoggedOut({}), UserState);
store.registerGroup(UserActions);
const context = createContext(store);

// 1. 详尽匹配
const name = useMatch(context, {
  LoggedIn: (s) => s.name,
  LoggedOut: () => "Visitor",
});

// 2. 结构化收窄
const user = useWhen(context, "LoggedIn");
if (user) {
  console.log(user.email);
}

// 3. 类型化派发 (Action 组)
const dispatch = useActionGroup(context, UserActions);
dispatch.login({ username: "chris" });

// 4. 类型化派发 (单个 Action)
const directDispatch = useDispatch(context);
directDispatch(login, { username: "michael" });
```
