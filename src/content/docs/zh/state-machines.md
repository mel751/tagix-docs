---
category: State Management
alias: state-machines
title: 状态机
description: 将状态转换建模为有限状态机
order: 13
---

# 状态机

将状态转换建模为有限状态机。

## 状态机模式

Tagix 状态定义可以很自然地建模有限状态机：

```ts
const OrderState = taggedEnum({
  Pending: {},
  Processing: { startedAt: string },
  Shipped: { trackingNumber: string; shippedAt: string },
  Delivered: { deliveredAt: string },
  Cancelled: { reason: string; cancelledAt: string },
});
```

## 有效转换

定义允许哪些转换：

```ts
const OrderActions = {
  submit: createAction<void, OrderState>("Submit")
    .withPayload(undefined)
    .withState((s) => {
      if (s._tag !== "Pending") return s;
      return OrderState.Processing({ startedAt: new Date().toISOString() });
    }),

  ship: createAction<{ trackingNumber: string }, OrderState>("Ship")
    .withPayload({ trackingNumber: "" })
    .withState((s, p) => {
      if (s._tag !== "Processing") return s;
      return OrderState.Shipped({
        trackingNumber: p.trackingNumber,
        shippedAt: new Date().toISOString(),
      });
    }),

  deliver: createAction<void, OrderState>("Deliver")
    .withPayload(undefined)
    .withState((s) => {
      if (s._tag !== "Shipped") return s;
      return OrderState.Delivered({ deliveredAt: new Date().toISOString() });
    }),

  cancel: createAction<{ reason: string }, OrderState>("Cancel")
    .withPayload({ reason: "" })
    .withState((s, p) => {
      if (s._tag === "Delivered") return s; // 已送达无法取消
      return OrderState.Cancelled({
        reason: p.reason,
        cancelledAt: new Date().toISOString(),
      });
    }),
};
```

## 转换守卫

防止无效转换：

```ts
const canTransition = (from: string, to: string): boolean => {
  const allowed: Record<string, string[]> = {
    Pending: ["Processing", "Cancelled"],
    Processing: ["Shipped", "Cancelled"],
    Shipped: ["Delivered"],
    Cancelled: [],
    Delivered: [],
  };
  return allowed[from]?.includes(to) ?? false;
};

const safeTransition = createAction<{ to: string }, OrderState>("Transition")
  .withPayload({ to: "" })
  .withState((s, p) => {
    if (!canTransition(s._tag, p.to)) return s;
    // 执行转换
    return performTransition(s, p.to);
  });
```

## 状态验证

验证状态完整性：

```ts
const validateOrder = (state: OrderState): boolean => {
  switch (state._tag) {
    case "Processing":
      return state.startedAt !== undefined;
    case "Shipped":
      return state.trackingNumber.length > 0;
    case "Delivered":
      return state.deliveredAt !== undefined;
    default:
      return true;
  }
};
```

建模复杂行为：

```ts
const PaymentState = taggedEnum({
  NotStarted: {},
  Processing: {
    method: "card" | "bank" | "crypto";
    attempts: number;
  },
  Completed: { transactionId: string },
  Failed: { reason: string; retryable: boolean },
  Refunded: { refundId: string; reason: string },
});
```

## 转换时的副作用

在转换过程中触发 Action：

```ts
const withSideEffects = (action: Action) =>
  createAction(action.type, action.payload)
    .withState(action.withState)
    .withEffect(async (payload) => {
      // 状态转换后的副作用
      await sendAnalytics("action_completed", payload);
      await notifyWebhook(payload);
    });
```

## 另请参阅

- [状态定义](/docs/state-definitions) - 状态结构
- [Action](/docs/actions) - 状态转换
- [异步 Action](/docs/async-actions) - 异步转换

## 下一步

| 主题                        | 描述         |
| --------------------------- | ------------ |
| [Selector](/docs/selectors) | 提取和派生值 |
| [中间件](/docs/middleware)  | 扩展派发行为 |
