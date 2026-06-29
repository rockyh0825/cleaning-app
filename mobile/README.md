# mobile

Expo 53 / React Native 0.76.7 / TypeScript で構築された掃除管理アプリのモバイルクライアントです。

## コンポーネントテストのセットアップ（Skiaモック対応）

### 使用しているテストライブラリと理由

| ライブラリ | バージョン | 採用理由 |
|---|---|---|
| `jest` | ^29 | テストランナー |
| `ts-jest` | ^29 | TypeScript のトランスパイル（ユニットテスト） |
| `babel-jest` + `babel-preset-expo` | - | React Native コンポーネントの JS 変換 |
| `@testing-library/react-native` | ^13 | コンポーネントのレンダリング・インタラクションテスト |
| `react-test-renderer` | 18.3.1 | RNTL が内部で使用するレンダラー（React バージョンと一致させる） |

> **注意**: `@testing-library/react-native` v14 は React Native >= 0.78 が必要です。本プロジェクトでは v13 系を使用しています。

### @shopify/react-native-skia をどのようにモックするか

`@shopify/react-native-skia` はネイティブモジュールを使用するため、Jest 環境では動作しません。
`mobile/__mocks__/@shopify/react-native-skia.js` にマニュアルモックを配置することで Jest が自動的に使用します。

```
mobile/
└── __mocks__/
    └── @shopify/
        └── react-native-skia.js   ← Canvas, Group, Line などを View/null に差し替え
```

テストファイルで明示的に `jest.mock('@shopify/react-native-skia')` を呼ぶことで、このモックが適用されます。

### テストコマンドの実行方法

```bash
# 全テスト実行
cd mobile && npx jest

# コンポーネントテストのみ
cd mobile && npx jest --testPathPattern="src/features/floorplan/components"

# ユニットテストのみ（unit project）
cd mobile && npx jest --selectProjects unit

# 単一テストファイル
cd mobile && npx jest src/features/floorplan/components/__tests__/AddRoomModal.test.tsx
```

### 既存のユニットテスト（hooks/usecases）との共存方法

`package.json` の jest 設定に `projects` を使い、2 つのプロジェクトを並立させています。

| プロジェクト名 | 対象ファイル | トランスパイラ | 環境 |
|---|---|---|---|
| `unit` | `**/__tests__/**/*.test.ts` | `ts-jest` | `node` |
| `components` | `**/__tests__/**/*.test.tsx` | `ts-jest`（tsx）+ `babel-jest`（js） | react-native |

- `unit` プロジェクト：hooks / usecases / repositories のテスト。React 非依存なので `node` 環境で高速に実行。
- `components` プロジェクト：UI コンポーネントのテスト。`react-native` プリセットを使用してネイティブモジュールのモックを設定。

### 注意点

- **ネイティブモジュールはモックが必要**: `@shopify/react-native-skia` のような C++ ネイティブコードを持つモジュールは `__mocks__/` で置き換える必要があります。
- **react-test-renderer のバージョン固定**: `react-test-renderer` は React のバージョン（`18.3.1`）と完全に一致させてください。バージョン不一致はランタイムエラーになります。
- **transformIgnorePatterns**: `react-native` や Expo のパッケージは ES Module 形式で配布されるため、`transformIgnorePatterns` で変換対象から除外しないよう設定が必要です。
- **コンポーネントテストは `.tsx` 拡張子**: `testMatch` パターンで `.tsx` と `.ts` を両方含めてください。`projects` 設定では `displayName` でプロジェクトを区別できます。
