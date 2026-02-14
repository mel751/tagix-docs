---
category: Advanced
alias: testing
title: テスト
description: Tagix アプリケーションのテスト戦略
order: 41
---

# テスト

## アクションのユニットテスト

アクションを単独でテストします：

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
  it("値をインクリメントすべきである", () => {
    const state = CounterState.Idle({ value: 0 });
    const nextState = increment.handler(state, { amount: 5 });
    expect(nextState.value).toBe(5);
  });

  it("負の値を処理すべきである", () => {
    const state = CounterState.Ready({ value: 10 });
    const nextState = increment.handler(state, { amount: -3 });
    expect(nextState.value).toBe(7);
  });
});
```

## ストアのテスト

```ts
describe("Store", () => {
  it("アクションをディスパッチすべきである", () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    store.register("Increment", increment);
    store.dispatch("tagix/action/Increment", { amount: 5 });

    const state = store.stateValue as Extract<typeof CounterState.State, { _tag: "Ready" }>;
    expect(state.value).toBe(5);
  });

  it("購読者に通知すべきである", () => {
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

## 非同期アクションのテスト

```ts
describe("Async Actions", () => {
  it("非同期フローを処理すべきである", async () => {
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

  it("エラーを処理すべきである", async () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    const failingAction = createAsyncAction<void, typeof CounterState.State, never>("Failing")
      .state((s) => ({ ...s, _tag: "Ready" }))
      .effect(async () => {
        throw new Error("テストエラー");
      })
      .onSuccess((s) => s)
      .onError((s, error) => ({ ...s, _tag: "Idle" }));

    store.register("Failing", failingAction);
    await store.dispatch(failingAction);

    expect(store.stateValue._tag).toBe("Idle");
  });
});
```

## テストのためのフォーキング

フォークを使用してテストを隔離します：

```ts
describe("Fork Testing", () => {
  it("メインストアに影響を与えないべきである", () => {
    const mainStore = createStore(CounterState.Idle({ value: 0 }), CounterState);

    const fork = mainStore.fork();

    // フォークを変更
    fork.dispatch("tagix/action/Increment", { amount: 100 });

    // フォークが変更されたことを確認
    const forkState = fork.stateValue;
    expect(forkState.value).toBe(100);

    // メインストアが変更されていないことを確認
    const mainState = mainStore.stateValue;
    expect(mainState.value).toBe(0);
  });
});
```

## セレクタのテスト

```ts
describe("Selectors", () => {
  const selectors = {
    getValue: (state: typeof CounterState.State) => (state._tag === "Ready" ? state.value : 0),
  };

  it("Ready 状態から値を抽出すべきである", () => {
    const state = CounterState.Ready({ value: 42 });
    expect(selectors.getValue(state)).toBe(42);
  });

  it("Idle 状態に対しては 0 をすべきである", () => {
    const state = CounterState.Idle({ value: 0 });
    expect(selectors.getValue(state)).toBe(0);
  });
});
```

## 結合テスト

```ts
describe("Integration", () => {
  it("完全なワークフローを処理すべきである", async () => {
    const store = createStore(CounterState.Idle({ value: 0 }), CounterState);

    store.register("Increment", increment);

    // 初期状態
    expect(store.stateValue.value).toBe(0);

    // 複数のアクションをディスパッチ
    store.dispatch("tagix/action/Increment", { amount: 5 });
    expect(store.stateValue.value).toBe(5);

    store.dispatch("tagix/action/Increment", { amount: 3 });
    expect(store.stateValue.value).toBe(8);

    // 監視して検証
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

## 依存関係のモック化

```ts
describe("With Mocks", () => {
  it("モックされた API を使用すべきである", async () => {
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

## 参照

- [状態定義](/docs/state-definitions) - テスト用の状態
- [アクション](/docs/actions) - アクションのテスト
- [非同期アクション](/docs/async-actions) - 非同期フローのテスト

## 次のステップ

おめでとうございます！ Tagix のドキュメントをすべて完了しました。その他のリソース：

| リソース                                                     | 説明                                                 |
| :----------------------------------------------------------- | :--------------------------------------------------- |
| [GitHub リポジトリ](https://github.com/chrismichaelps/tagix) | ソースコード、イシュー、ディスカッションへのアクセス |
| [インストール](/docs/installation)                           | セットアップガイドで環境を確認する                   |
| [クイックスタート](/docs/quick-start)                        | 最初のアプリを構築し、機能を試す                     |
