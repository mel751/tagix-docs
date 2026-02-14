---
category: Features
alias: middleware
title: 中间件
description: 通过中间件扩展派发行为
order: 21
---

# 中间件

## 中间件基础

## 创建中间件

中间件是一个返回链式处理器的函数：

```ts
const loggerMiddleware = () => (next) => (action) => {
  console.log("Action:", action.type, action.payload);
  return next(action);
};
```

## 中间件结构

```ts
type Middleware<S> = (
  context: MiddlewareContext<S>
) => (
  next: (action: Action | AsyncAction) => boolean
) => (action: Action | AsyncAction) => boolean | void;
```

## 内置中间件

### Logger 中间件

记录所有 Action 和状态更改：

```ts
import { createLoggerMiddleware } from "tagix";

const store = createStore(initial, state, {
  middlewares: [
    createLoggerMiddleware({
      collapsed: true, // 折叠日志组
      duration: true, // 显示耗时
      timestamp: true, // 包含时间戳
    }),
  ],
});
```

## 自定义中间件示例

### 分析中间件

追踪用户 Action：

```ts
const analyticsMiddleware = () => (next) => (action) => {
  if (action.type.startsWith("tagix/action/")) {
    // 发送到分析服务
    trackEvent("action", {
      type: action.type,
      hasPayload: "payload" in action,
    });
  }
  return next(action);
};
```

### 节流中间件

限制 Action 的频率：

```ts
const throttleMiddleware = (ms: number) => {
  const lastCalls = new Map<string, number>();

  return () => (next) => (action) => {
    const now = Date.now();
    const last = lastCalls.get(action.type) ?? 0;

    if (now - last < ms) {
      return false; // 跳过 Action
    }

    lastCalls.set(action.type, now);
    return next(action);
  };
};

const store = createStore(initial, state, {
  middlewares: [throttleMiddleware(1000)],
});
```

### 身份验证中间件

为请求附加 Auth Token：

```ts
const authMiddleware = (getToken: () => string | null) => () => (next) => (action) => {
  if (action.type === "tagix/action/APIRequest") {
    const token = getToken();
    if (token) {
      // 附加 Token 到请求
      (action as any).payload.headers = {
        ...(action as any).payload.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return next(action);
};
```

### 撤销/重做中间件

实现撤销功能：

```ts
const createUndoMiddleware = () => {
  const history: unknown[] = [];

  return () => (next) => (action) => {
    if (action.type === "tagix/action/Undo") {
      const previous = history.pop();
      if (previous) {
        store.replaceState(previous);
      }
      return false;
    }

    // 在 Action 之前存储上一个状态
    const previous = store.stateValue;
    const result = next(action);

    if (result !== false) {
      history.push(previous);
    }

    return result;
  };
};
```

### 验证中间件

在处理前验证 Action：

```ts
const validationMiddleware =
  (schemas: Record<string, (payload: unknown) => boolean>) => () => (next) => (action) => {
    const schema = schemas[action.type];
    if (schema && !schema(action.payload)) {
      console.warn("无效的 Action Payload:", action);
      return false; // 阻止 Action
    }
    return next(action);
  };
```

## 组合中间件

中间件的顺序至关重要：

```ts
const store = createStore(initial, state, {
  middlewares: [
    // 第一：日志记录 (看到原始 Action)
    createLoggerMiddleware(),

    // 第二：分析 (看到已记录的 Action)
    analyticsMiddleware(),

    // 第三：验证 (验证 Action)
    validationMiddleware(schemas),

    // 第四：节流 (应用频率限制)
    throttleMiddleware(1000),

    // 最后：Store 接收处理后的 Action
  ],
});
```

## 阻止 Action

返回 `false` 以阻止 Action：

```ts
const blockingMiddleware = () => (next) => (action) => {
  if (action.type === "tagix/action/DeleteAll") {
    const confirm = window.confirm("确定删除所有内容吗？");
    if (!confirm) return false;
  }
  return next(action);
};
```

对于异步 Action，阻止会导致 Effect 不运行。

## 另请参阅

- [Action](/docs/actions) - Action 流程
- [异步 Action](/docs/async-actions) - 异步中间件
- [错误处理](/docs/error-handling) - 错误中间件

## 下一步

| 主题                             | 描述                   |
| -------------------------------- | ---------------------- |
| [上下文](/docs/context)          | 框架无关的集成         |
| [错误处理](/docs/error-handling) | 通过结构化状态处理错误 |
