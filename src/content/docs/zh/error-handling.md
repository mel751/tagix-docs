---
category: Features
alias: error-handling
title: 错误处理
description: 在 Tagix 中使用结构化状态和 Action 处理错误
order: 23
---

# 错误处理

在 Tagix 中使用结构化状态处理错误。

## 错误状态

在您的 `taggedEnum` 状态定义中定义错误状态：

```ts
const ApiState = taggedEnum({
  Idle: {},
  Loading: {},
  Success: { data: unknown },
  Error: {
    code: string;
    message: string;
    retryable: boolean;
  },
});
```

## Action 中的错误处理器

### 同步 Action

在同步 Action 中捕获错误：

```ts
const riskyOperation = createAction<{ input: unknown }, ApiState>("Risky")
  .withPayload({ input: null })
  .withState((state, payload) => {
    try {
      const result = process(payload.input);
      return { ...state, _tag: "Success", data: result };
    } catch (error) {
      return {
        ...state,
        _tag: "Error",
        code: "PROCESSING_ERROR",
        message: error instanceof Error ? error.message : "未知错误",
        retryable: true,
      };
    }
  });
```

### 异步 Action

使用 `.onError()` 处理异步 Action 中的错误：

```ts
const fetchData = createAsyncAction<{ url: string }, ApiState, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload) => {
    const response = await fetch(payload.url);
    if (!response.ok) {
      throw new Error("请求失败");
    }
    return response.json();
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({
    ...s,
    _tag: "Error",
    code: "FETCH_ERROR",
    message: error instanceof Error ? error.message : "网络错误",
    retryable: true,
  }));
```

## 错误恢复

### 重试逻辑

在异步 Action 的 Effect 中实现重试：

```ts
const fetchWithRetry = createAsyncAction<{ id: number }, ApiState, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload, { signal }) => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetch(`/api/${payload.id}`, { signal });
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error("达到最大重试次数");
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({
    ...s,
    _tag: "Error",
    code: "FETCH_ERROR",
    message: error.message,
    retryable: true,
  }));
```

### 手动重试 Action

当错误可重试时，派发一个重试 Action：

```ts
const retryFetch = createAction<void, ApiState>("Retry")
  .withPayload(undefined)
  .withState((s) => {
    if (s._tag !== "Error" || !s.retryable) return s;
    return { ...s, _tag: "Loading" };
  });

store.dispatch("tagix/action/Retry");
```

## 另请参阅

- [异步 Action](/docs/async-actions) - 带有错误处理的异步操作
- [中间件](/docs/middleware) - 错误日志记录中间件
- [测试](/docs/testing) - 测试错误场景

## 下一步

| 主题                          | 描述                       |
| ----------------------------- | -------------------------- |
| [类型安全](/docs/type-safety) | 利用 TypeScript 确保正确性 |
| [测试](/docs/testing)         | 应用程序测试策略           |
