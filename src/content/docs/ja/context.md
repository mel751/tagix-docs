---
category: Features
alias: context
title: コンテキスト
description: フレームワークに依存しないストア統合
order: 22
---

# コンテキスト

## ストアコンテキスト

ストアは、あらゆるフレームワークと統合するためのメソッドを提供します：

```ts
const store = createStore(initialState, state, { name: "App" });

// 変更を購読
const unsubscribe = store.subscribe((state) => {
  console.log("状態が変更されました:", state);
});

// アクションをディスパッチ
store.dispatch("ActionType", payload);

// 状態をクエリ
const isReady = store.isInState("Ready");
const readyState = store.getState("Ready");
const value = store.select("property");
```

## フレームワーク統合

### 直接統合

コンポーネント内でストアに直接アクセスします：

```ts
// 任意のコンポーネント内
const store = getStoreFromContext(); // フレームワーク固有の方法

// 購読
const unsubscribe = store.subscribe((state) => {
  // 状態に基づいて UI を更新
});

// ディスパッチ
store.dispatch("action", payload);

// クリーンアップ
unsubscribe();
```

### リアクティブな統合

リアクティブなラッパーを作成します：

```ts
// バニラ JS 用のサブスクリプションマネージャ
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

### コンポーネント内のセレクタ

計算された値を派生させます：

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

## ストアアクセスのパターン

### シングルトンパターン

アプリケーション全体で単一のストアを使用します：

```ts
// store.ts
export const store = createStore(initialState, state);

// 他の場所
import { store } from "./store";
store.dispatch("action", payload);
```

### コンテキストパターン

コンテキストを通じてストアを提供します：

```ts
// コンテキスト作成（フレームワークに依存しない）
const TagixContext = {
  Provider: (store, children) => children,
  Consumer: (store, render) => render(store),
};
```

### 依存性の注入 (Dependency Injection)

コンポーネントにストアを注入します：

```ts
interface AppServices {
  store: TagixStore<State>;
  logger: Logger;
}

const createServices = (): AppServices => ({
  store: createStore(initialState, state),
  logger: new Logger(),
});

// 必要に応じて注入
const service = createServices();
```

## 複数のストア

複数のストアを組み合わせます：

```ts
const authStore = createStore(authInitial, authState);
const dataStore = createStore(dataInitial, dataState);
const uiStore = createStore(uiInitial, uiState);

// 親で統合
const rootState = taggedEnum({
  Auth: authStore.stateValue,
  Data: dataStore.stateValue,
  UI: uiStore.stateValue,
});
```

## ストアのフォーク（Forking）

テスト用に隔離されたコピーを作成します：

```ts
const mainStore = createStore(initialState, state);

// フォークを作成
const testStore = mainStore.fork();

// アクションをテスト
testStore.dispatch("action", payload);

// 検証
expect(testStore.stateValue).toMatchObject({
  /* 期待される値 */
});

// 元のストアは変更されません
expect(mainStore.stateValue).toBe(originalState);
```

## クリーンアップ

購読は必ずクリーンアップしてください：

```ts
// 良い例
const unsubscribe = store.subscribe(handler);
return () => unsubscribe();

// 悪い例 - メモリリークの原因
store.subscribe(handler);
// クリーンアップなし
```

## 次のステップ

| トピック                                   | 説明                              |
| ------------------------------------------ | --------------------------------- |
| [エラーハンドリング](/docs/error-handling) | 構造化された状態によるエラー処理  |
| [型安全](/docs/type-safety)                | TypeScript を活用した正当性の確保 |
