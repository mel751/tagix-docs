---
category: Features
alias: selectors
title: セレクタ
description: 状態から値を抽出し、派生させる
order: 20
---

# セレクタ

状態から値を抽出し、派生させます。

## ストアセレクタ

ストアは基本的な選択機能を提供します：

```ts
const store = createStore(initialState, state);

// 特定のプロパティを取得
const value = store.select("user");

// 状態タグを確認
if (store.isInState("Loaded")) {
  // 状態が Loaded の場合
}

// 型定義された状態を取得
const loadedState = store.getState("Loaded");
if (loadedState) {
  // loadedState.data にアクセス可能
}
```

## カスタムセレクタ

再利用可能なセレクタ関数を作成します：

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
    return user?.name ?? "ゲスト";
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

## セレクタの使用

```ts
const user = selectors.getUser(store.stateValue);
const name = selectors.getUserName(store.stateValue);
const count = selectors.getPostCount(store.stateValue);
```

## 派生セレクタ

他のセレクタを組み合わせるセレクタを作成します：

```ts
const derivedSelectors = {
  getUserDisplay: (state: AppStateType) => {
    const user = selectors.getUser(state);
    if (!user) return "匿名ユーザー";
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

## メモ化されたセレクタ

計算負荷の高い処理には、セレクタをメモ化します：

```ts
import { memoize } from "tagix";

const expensiveSelector = memoize((state: AppStateType) => {
  // 負荷の高い計算
  return computeHeavyValue(state);
});
```

## セレクタの合成

単純なセレクタから複雑なセレクタを構築します：

```ts
const dashboardSelectors = {
  getDashboardData: (state: AppStateType) => ({
    user: selectors.getUser(state),
    postCount: selectors.getPostCount(state),
    theme: state._tag === "Ready" ? "ダーク" : "ライト",
  }),

  isUserReady: (state: AppStateType) => {
    return selectors.getUser(state) !== null;
  },

  canCreatePost: (state: AppStateType) => {
    return selectors.getUser(state) !== null && !state._tag.startsWith("Loading");
  },
};
```

## ベストプラクティス

### セレクタを純粋に保つ

セレクタは状態を変更してはいけません：

```ts
// 良い例 - 純粋なセレクタ
const getValue = (state: State) => state.value;

// 避けるべき例 - 状態を直接変更している
const getValue = (state: State) => {
  state.value += 1; // 副作用が発生！
  return state.value;
};
```

### 安定した型を返す

オプションの値には Null 可能（nullable）な型を使用します：

```ts
// 良い例
const getUser = (state: State): User | null => {
  return state._tag === "Ready" ? state.user : null;
};
```

### コンポーネントレベルでの選択

コンポーネントは必要なデータのみを選択すべきです：

```ts
// 良い例 - 特定のデータのみを選択
const userName = useTagixState((state) => (state._tag === "Ready" ? state.user.name : null));

// 避けるべき例 - 全状態を購読している
const fullState = useTagixState((state) => state);
```

## 参照

- [コンテキスト](/docs/context) - フレームワーク統合
- [パフォーマンス](/docs/performance) - 最適化手法

## 次のステップ

| トピック                         | 説明                           |
| -------------------------------- | ------------------------------ |
| [ミドルウェア](/docs/middleware) | ディスパッチ動作の拡張         |
| [コンテキスト](/docs/context)    | フレームワークに依存しない統合 |
