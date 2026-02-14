---
category: State Management
alias: async-actions
title: 异步 Action
description: 使用 Effect、成功和错误处理器处理异步操作
order: 12
---

# 异步 Action

使用 Effect、成功和错误处理器处理异步操作。

## 创建 异步 Action

对于涉及 Promise 的操作，请使用 `createAsyncAction`：

```ts
import { createAsyncAction } from "tagix";

const fetchUser = createAsyncAction<{ id: number }, UserState, User>("FetchUser")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload) => {
    const response = await fetch(`/api/users/${payload.id}`);
    if (!response.ok) throw new Error("用户未找到");
    return response.json();
  })
  .onSuccess((s, user) => ({ ...s, _tag: "Loaded", user }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));
```

## 组件

### 状态处理器

Action 开始时的初始状态转换：

```ts
.state((currentState) => ({
  ...currentState,
  _tag: "Loading",
}))
```

### Effect 处理器

异步操作：

```ts
.effect(async (payload) => {
  const result = await someAsyncOperation(payload);
  return result; // 这将成为成功时的 Payload
})
```

### onSuccess 处理器

当 Effect 完成（resolve）时调用：

```ts
.onSuccess((currentState, result) => ({
  ...currentState,
  _tag: "Ready",
  data: result,
}))
```

### onError 处理器

当 Effect 失败（reject）时调用：

```ts
.onError((currentState, error) => ({
  ...currentState,
  _tag: "Error",
  message: error instanceof Error ? error.message : "未知错误",
}))
```

## 完整示例

```ts
const fetchPosts = createAsyncAction<void, PostsState, Post[]>("FetchPosts")
  .state(() => PostsState.Loading({}))
  .effect(async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("获取失败");
    return response.json();
  })
  .onSuccess((_, posts) => PostsState.Loaded({ posts }))
  .onError((_, error) => PostsState.Error({ message: error.message }));

store.register("FetchPosts", fetchPosts);

// 派发异步 Action
await store.dispatch(fetchPosts);
```

## 派发异步 Action

异步 Action 返回 Promise：

```ts
// 等待结果
await store.dispatch(fetchUser, { id: 1 });

// 错误处理
try {
  await store.dispatch(fetchUser, { id: 999 });
} catch (error) {
  console.error("Action 失败:", error);
}
```

## 错误处理

### 结构化错误

在您的状态中定义错误类型：

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

### 重试逻辑

在 Effect 中实现重试：

```ts
const fetchWithRetry = createAsyncAction<{ id: number }, State, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload, { signal }) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fetchWithSignal(`/api/${payload.id}`, signal);
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error("达到最大重试次数");
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message, retryable: true }));
```

## 取消 Action

使用 `AbortSignal` 进行取消：

```ts
const fetchData = createAsyncAction<{ id: number }, State, Data>("Fetch")
  .state((s) => ({ ...s, _tag: "Loading" }))
  .effect(async (payload, { signal }) => {
    const controller = new AbortController();
    signal.addEventListener("abort", () => controller.abort());

    const response = await fetch(`/api/${payload.id}`, {
      signal: controller.signal,
    });
    return response.json();
  })
  .onSuccess((s, data) => ({ ...s, _tag: "Success", data }))
  .onError((s, error) => ({ ...s, _tag: "Error", message: error.message }));
```

## 并发 Action

多个异步 Action 可以并发运行：

```ts
await Promise.all([
  store.dispatch(fetchUser, { id: 1 }),
  store.dispatch(fetchPosts),
  store.dispatch(fetchNotifications),
]);
```

## 进度追踪

追踪上传或下载的进度：

```ts
const uploadFile = createAsyncAction<{ file: File }, UploadState, UploadResult>("UploadFile")
  .state((s) => ({ ...s, _tag: "Uploading", progress: 0 }))
  .effect(async (payload, { signal }) => {
    const formData = new FormData();
    formData.append("file", payload.file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formBody,
      signal,
    });

    return response.json();
  })
  .onSuccess((s, result) => ({ ...s, _tag: "Complete", result }))
  .onError((s, error) => ({ ...s, _tag: "Failed", error: error.message }));
```

## 另请参阅

- [Action](/docs/actions) - 同步 Action
- [错误处理](/docs/error-handling) - 错误模式
- [中间件](/docs/middleware) - 请求中间件

## 下一步

| 主题                           | 描述         |
| ------------------------------ | ------------ |
| [状态机](/docs/state-machines) | 建模状态转换 |
| [Selector](/docs/selectors)    | 提取和派生值 |
