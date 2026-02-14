---
category: Features
alias: hooks
title: フックユーティリティ
description: TagixContext を通じて状態へのアクセスやアクションのディスパッチを行う、型安全なユーティリティ
order: 24
---

# フックユーティリティ

フックユーティリティは、`TagixContext` を通じて状態へのアクセスやアクションのディスパッチを行うための便利な機能を提供します。これらは、フックのパターンをサポートするあらゆるフレームワークで使用できます。

## useMatch

現在の状態に対して網羅的なパターンマッチングを行います。すべてのバリアントタグを処理する必要があり、コンパイラによって網羅性が強制されます。すべてのハンドラの戻り値の型の和型を返します。

```ts
const name = useMatch(context, {
  LoggedIn: (s) => s.name,
  LoggedOut: () => "ゲスト",
});
// name は string として推論されます
```

## useWhen

現在の状態を特定のタグのバリアントに絞り込みます。一致した場合はそのバリアントのプロパティ（`_tag` を除く）を返し、一致しない場合は `undefined` を返します。

```ts
const user = useWhen(context, "LoggedIn");
if (user) {
  console.log(user.name); // 完全に型定義されています
}
```

## useDispatch

型定義されたディスパッチ関数を返します。完全な型安全性のために **アクションオブジェクトによるディスパッチ**（推奨）をサポートしているほか、レガシーな文字列ベースのディスパッチもサポートしています。

```ts
const dispatch = useDispatch(context);

// 推奨: アクション参照による型安全なディスパッチ
dispatch(loginAction, { username: "chris" });

// レガシー: 文字列ベースのディスパッチ (非推奨)
dispatch("Login", { username: "chris" });
```

## useActionGroup

アクショングループから型定義されたディスパッチャを作成します。グループ内の各キーが型定義されたメソッドになります。

```ts
const UserActions = createActionGroup("Auth", { login, logout });
const dispatch = useActionGroup(context, UserActions);

dispatch.login({ username: "chris" }); // 完全に型定義されています
```

## useMatchPartial

非網羅的なパターンマッチングを行います。指定したバリアントのみを処理し、それ以外は `undefined` を返します。

```ts
const greeting = useMatchPartial(context, {
  LoggedIn: (s) => `ようこそ、${s.name}さん`,
});
// greeting: string | undefined
```

## useStore

コンテキストから現在の状態のスナップショットを返します。

```ts
const state = useStore(context);
```

## useSelector

セレクタ関数を通じて、状態から派生した値を返します。

```ts
const itemCount = useSelector(context, (s) => (s._tag === "Items" ? s.items.length : 0));
```

## useSubscribe

コールバックを使用して状態の変更を監視します。アンサブスクライブ（購読解除）関数を返します。

```ts
const unsubscribe = useSubscribe(context, (state) => {
  console.log("新しい状態:", state._tag);
});
```

## createSelector

呼び出されるたびに最新の状態を読み取るセレクタ関数を構築します。

```ts
const getName = createSelector(context, (s) => s.user?.name);
const name = getName();
```

---

## レガシー / 非推奨のフック

これらのフックは後方互換性のために保持されていますが、次のメジャーバージョンで削除される予定です。

### useGetState

**非推奨**: 代わりに `useMatch` または `useWhen` を使用してください。手動でのジェネリクス指定と二重のカリー化が必要です。

### useKey

**非推奨**: バリアントを意識したアクセスを確保するために、代わりに `useWhen` または `useMatch` を使用してください。

### getStateProp

**非推奨**: tagged enum コンストラクタの `$match` を直接使用してください。

---

## 完全な例

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

// 1. 網羅的なマッチング
const name = useMatch(context, {
  LoggedIn: (s) => s.name,
  LoggedOut: () => "ビジター",
});

// 2. 構造的な絞り込み
const user = useWhen(context, "LoggedIn");
if (user) {
  console.log(user.email);
}

// 3. 型定義されたディスパッチ (アクショングループ)
const dispatch = useActionGroup(context, UserActions);
dispatch.login({ username: "chris" });

// 4. 型定義されたディスパッチ (個別アクション)
const directDispatch = useDispatch(context);
directDispatch(login, { username: "michael" });
```
