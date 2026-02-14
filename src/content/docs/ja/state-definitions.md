---
category: State Management
alias: state-definitions
title: 状態定義
description: Tagged Unionsを使用してアプリケーションの状態を定義する
order: 10
---

# 状態定義

Tagged Unionsを使用してアプリケーションの状態を定義します。

## taggedEnum の使用

`taggedEnum` 関数は、型安全性を備えた完全な状態定義を作成します：

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

## 生成されるアーティファクト

`taggedEnum` は以下を生成します：

1. **コンストラクタ** - 状態インスタンスの作成
2. **State 型** - すべてのバリアントの和型
3. **パターンヘルパー** - 型安全な状態アクセス

```ts
// コンストラクタ
const unauthenticated = UserState.Unauthenticated({});
const authenticating = UserState.Authenticating({ loading: true });
const authenticated = UserState.Authenticated({
  user: { id: 1, email: "test@example.com", name: "Test" },
  token: "abc123",
});

// State 型 (推論)
type UserStateType = typeof UserState.State;

// 型は以下の通りです：
// { readonly _tag: "Unauthenticated" } |
// { readonly _tag: "Authenticating"; readonly loading: boolean } |
// { readonly _tag: "Authenticated"; readonly user: {...}; readonly token: string } |
// { readonly _tag: "AuthError"; readonly message: string }
```

## 空のバリアントとデータを持つバリアント

バリアントはプロパティを持つことも、空にすることもできます：

```ts
const LoadingState = taggedEnum({
  Idle: {}, // プロパティなし
  Loading: { progress: number }, // プロパティあり
});
```

## ネストされた構造

状態には複雑にネストされた構造を含めることができます：

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

## 型の絞り込み

`_tag` プロパティにより、網羅的な型チェックが可能です：

```ts
function processUser(state: UserStateType) {
  switch (state._tag) {
    case "Unauthenticated":
      // TypeScript は state に user プロパティがないことを認識します
      return "ログインしてください";
    case "Authenticating":
      // TypeScript は state.loading が存在することを認識します
      return state.loading ? "読み込み中..." : "開始中";
    case "Authenticated":
      // TypeScript は state.user が存在することを認識します
      return `こんにちは、${state.user.name}さん`;
    case "AuthError":
      // TypeScript は state.message が存在することを認識します
      return state.message;
    default:
      // 網羅性チェック
      return assertNever(state);
  }
}
```

## Extract ヘルパー

特定のバリアント型を取得するには `Extract` を使用します：

```ts
import { Extract } from "tagix";

type AuthenticatedState = Extract<UserStateType, { _tag: "Authenticated" }>;

// AuthenticatedState は以下の通りです：
// {
//   readonly _tag: "Authenticated";
//   readonly user: { id: number; email: string; name: string };
//   readonly token: string;
// }
```

## ベストプラクティス

### ドメインごとに一つの状態

異なるドメインに対しては個別の状態定義を作成します：

```ts
// ユーザー状態
const UserState = taggedEnum({
  /* ... */
});

// 投稿状態
const PostsState = taggedEnum({
  /* ... */
});

// ルート状態で統合
const AppState = taggedEnum({
  User: UserState,
  Posts: PostsState,
});
```

### 可能な限りフラットにする

フラットな代替案が機能する場合は、深くネストされた構造を避けます：

```ts
// 推奨される方法
const FormState = taggedEnum({
  Idle: {},
  Submitting: { values: Record<string, unknown> },
  Success: { data: unknown },
  Error: { errors: Record<string, string> },
});

// 深くネストされた方法（避けるべき）
const DeepFormState = taggedEnum({
  Form: {
    Status: {
      Idle: {},
      Submitting: { values: Record<string, unknown> },
      // ... さらにネスト
    },
  },
});
```

### 意味のあるタグ名

説明的なタグ名を使用します：

```ts
// 良い例
const StatusState = taggedEnum({
  Pending: {},
  Processing: {},
  Completed: {},
  Failed: { reason: string },
});

// 避けるべき例
const StatusState = taggedEnum({
  One: {},
  Two: {},
  Three: {},
});
```

## 参照

- [アクション](/docs/actions) - 状態の変更
- [ステートマシン](/docs/state-machines) - 状態遷移
- [型安全](/docs/type-safety) - TypeScript パターン

## 次のステップ

| トピック                                | 説明                       |
| --------------------------------------- | -------------------------- |
| [アクション](/docs/actions)             | 同期的な状態更新を作成する |
| [非同期アクション](/docs/async-actions) | 非同期操作を処理する       |
