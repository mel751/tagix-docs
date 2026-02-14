---
category: State Management
alias: state-machines
title: ステートマシン
description: 状態遷移を有限ステートマシンとしてモデル化する
order: 13
---

# ステートマシン

状態遷移を有限ステートマシンとしてモデル化します。

## ステートマシンパターン

Tagixの状態定義は、自然に有限ステートマシンをモデル化します：

```ts
const OrderState = taggedEnum({
  Pending: {},
  Processing: { startedAt: string },
  Shipped: { trackingNumber: string; shippedAt: string },
  Delivered: { deliveredAt: string },
  Cancelled: { reason: string; cancelledAt: string },
});
```

## 有効な遷移

どのアクションがどの状態から遷移可能かを定義します：

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
      if (s._tag === "Delivered") return s; // 配達済みはキャンセル不可
      return OrderState.Cancelled({
        reason: p.reason,
        cancelledAt: new Date().toISOString(),
      });
    }),
};
```

## 遷移ガード

無効な遷移を防止します：

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
    // 遷移を実行
    return performTransition(s, p.to);
  });
```

## 状態の検証

状態の整合性を検証します：

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

複雑な動作をモデル化します：

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

## 遷移時のサイドエフェクト

遷移中にアクションをトリガーします：

```ts
const withSideEffects = (action: Action) =>
  createAction(action.type, action.payload)
    .withState(action.withState)
    .withEffect(async (payload) => {
      // 状態遷移後のサイドエフェクト
      await sendAnalytics("action_completed", payload);
      await notifyWebhook(payload);
    });
```

## 参照

- [状態定義](/docs/state-definitions) - 状態構造
- [アクション](/docs/actions) - 状態遷移
- [非同期アクション](/docs/async-actions) - 非同期遷移

## 次のステップ

| トピック                         | 説明                   |
| -------------------------------- | ---------------------- |
| [セレクタ](/docs/selectors)      | 値の抽出と派生         |
| [ミドルウェア](/docs/middleware) | ディスパッチ動作の拡張 |
