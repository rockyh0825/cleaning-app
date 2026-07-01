# mobile

Expo 53 / React Native 0.76.7 / TypeScript で構築された掃除管理アプリのモバイルクライアントです。

## セットアップ

### 必要なもの

| ツール | 用途 | 確認コマンド |
|---|---|---|
| Node.js 20+ | 実行環境 | `node -v` |
| Xcode 16+ (Mac) | iOS シミュレーター・ビルド | App Store からインストール |
| CocoaPods | iOS ネイティブ依存管理 | `pod --version` |

> **注意**: `@shopify/react-native-skia` はネイティブモジュールのため、**Expo Go では動作しません**。  
> Xcode が必要な Development Build（後述）で起動してください。

### 依存インストール

```bash
cd mobile
npm install --legacy-peer-deps
```

> `jest-expo` の peerDependency 競合があるため `--legacy-peer-deps` が必要です。

---

## 起動モード

アプリにはバックエンド API の有無に応じて 2 つの起動モードがあります。

### Mock モード（バックエンド不要）

バックエンドが未起動の場合、アプリは自動的に `MockDefaultApi` にフォールバックします。  
部屋・家具（間取り）は AsyncStorage に永続化され、アプリを再起動してもデータが復元されます。  
パーツ・掃除記録はセッション内メモリのみで保持され、アプリ再起動でリセットされます（cleaning-record 側の永続化は別issue対応）。

**フォールバックの条件**: ネットワークエラー（`Failed to fetch` 相当）が発生した場合のみ。  
バックエンドが起動しているが 4xx / 5xx を返す場合はフォールバックせず、エラーをそのまま伝播します。

```bash
# バックエンドを起動せず、そのままアプリを起動するだけ
npx expo run:ios
```

初回起動時は fixture データ（サンプルの部屋・家具）が表示されます。  
`EXPO_PUBLIC_MOCK_START_EMPTY=true` を設定して起動すると、fixture をシードせず空状態から開始します（E2Eテストで使用）。

> **実装詳細**: `src/shared/api-fallback/MockDefaultApi.ts` / `FloorPlanStore.ts` / `FallbackApi.ts`  
> 参照 issue: [#64](https://github.com/rockyh0825/cleaning-app/issues/64)

### バックエンド API モード（実データ）

ローカルでバックエンドを起動しておくと、実 API が使われます（mock は呼ばれません）。

```bash
# 1. PostgreSQL を起動しておく（Docker 等）

# 2. バックエンド起動
cd ../backend
./gradlew bootRun

# 3. 別ターミナルでモバイル起動
cd ../mobile
npx expo start --dev-client
```

バックエンドのデフォルト URL は `http://localhost:8080`（`src/shared/api/runtime.ts` の `BASE_PATH`）です。

---

## iOS シミュレーターで起動する（推奨）

### 初回のみ: ネイティブプロジェクト生成

```bash
cd mobile
npx expo prebuild --platform ios
```

`ios/` ディレクトリが生成されます（git 管理対象外）。

### ビルド & 起動

```bash
npx expo run:ios
```

Xcode が自動的にビルドし、iOS シミュレーターでアプリが起動します。

### 2回目以降（JS のみ変更した場合）

```bash
npx expo start --dev-client
```

開発サーバーを起動し、既にインストール済みのアプリから接続します。

---

## EAS Build（Xcode なしでビルドしたい場合）

EAS Build を使うとクラウドでビルドでき、Xcode のローカルインストールが不要です。

```bash
# EAS CLI インストール
npm install -g eas-cli

# Expo アカウントでログイン
eas login

# eas.json を初期化（初回のみ）
eas build:configure

# iOS シミュレーター用ビルド（クラウド実行）
eas build --profile development --platform ios

# ビルド完了後、.tar.gz をダウンロードしてシミュレーターにインストール
# Finder でダブルクリック → シミュレーターにドラッグ
```

---

## 実機（iPhone）で確認する

1. iPhone を Mac に USB 接続（または同一 Wi-Fi）
2. Expo アカウントと Apple Developer アカウントが必要
3. `npx expo run:ios --device` で実機ビルド

---

## 開発コマンド

```bash
npm install --legacy-peer-deps  # 依存インストール
npx expo run:ios                # iOS シミュレーターで起動（初回ビルド含む）
npx expo start --dev-client     # 開発サーバーのみ起動（再ビルド不要）
npx jest                        # 全テスト実行
npx jest path/to/test.ts        # 単一テスト実行
npx eslint src/                 # 静的解析
```

---

## プロジェクト構成

```
mobile/
├── .maestro/                   # Maestro E2E フロー定義・スクリーンショット
│   ├── config.yaml
│   ├── flows/
│   │   └── floor-plan-onboarding.yaml
│   └── screenshots/             # `maestro test` 実行時に生成（コミット対象外）
├── app/                        # Expo Router によるファイルベースルーティング
│   ├── _layout.tsx             # ルートレイアウト（QueryClient, Stack）
│   ├── index.tsx                # ルートパス → /floor-plan へリダイレクト
│   └── floor-plan/
│       ├── index.tsx           # 間取り一覧画面
│       └── [roomId].tsx        # 部屋詳細画面
├── src/
│   ├── features/               # 機能ごとのモジュール
│   │   ├── floor-plan/         # 間取りエディタ
│   │   └── cleaning-record/    # 掃除記録
│   ├── capabilities/           # feature 間の境界インターフェース
│   └── shared/                 # 共通ユーティリティ・コンポーネント
└── __mocks__/                  # Jest 用ネイティブモジュールモック
```

---

## テストのセットアップ（Skia モック対応）

### 使用しているテストライブラリ

| ライブラリ | バージョン | 採用理由 |
|---|---|---|
| `jest` | ^29 | テストランナー |
| `ts-jest` | ^29 | TypeScript のトランスパイル（ユニットテスト） |
| `babel-jest` + `babel-preset-expo` | - | React Native コンポーネントの JS 変換 |
| `@testing-library/react-native` | ^13 | コンポーネントのレンダリング・インタラクションテスト |
| `react-test-renderer` | 18.3.1 | RNTL が内部で使用するレンダラー（React バージョンと一致させる） |

> **注意**: `@testing-library/react-native` v14 は React Native >= 0.78 が必要です。本プロジェクトでは v13 系を使用しています。

### @shopify/react-native-skia のモック

`@shopify/react-native-skia` はネイティブモジュールを使用するため、Jest 環境では動作しません。  
`mobile/__mocks__/@shopify/react-native-skia.js` にマニュアルモックを配置することで Jest が自動的に使用します。

```
mobile/
└── __mocks__/
    └── @shopify/
        └── react-native-skia.js   ← Canvas, Group, Line などを View/null に差し替え
```

テストファイルで明示的に `jest.mock('@shopify/react-native-skia')` を呼ぶことで、このモックが適用されます。

### テストコマンド

```bash
# 全テスト実行
cd mobile && npx jest

# コンポーネントテストのみ
cd mobile && npx jest --testPathPattern="src/features/floor-plan/components"

# ユニットテストのみ（unit project）
cd mobile && npx jest --selectProjects unit

# 単一テストファイル
cd mobile && npx jest src/features/floor-plan/components/__tests__/AddRoomModal.test.tsx
```

### Jest プロジェクト構成

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

---

## E2Eテスト（Maestro）

floor-plan editor の一連のユーザー体験（空状態 → 部屋追加 → 種別選択 → 部屋がキャンバスに表示される →
家具配置 → アプリ再起動後もデータが復元される）を [Maestro](https://maestro.mobile.dev/) で検証します。
バックエンド未起動（[#64](https://github.com/rockyh0825/cleaning-app/issues/64) の MockDefaultApi fallback）を前提としたローカル実行です。

### Maestro CLI のインストール（初回のみ）

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH":"$HOME/.maestro/bin"
```

### ローカルでの実行方法

```bash
cd mobile
npx expo prebuild --platform ios

# EXPO_PUBLIC_MOCK_START_EMPTY=true でビルドすることで、
# fixture 部屋をシードせず空状態から検証できる
EXPO_PUBLIC_MOCK_START_EMPTY=true npx expo run:ios --configuration Release

maestro test .maestro/flows/floor-plan-onboarding.yaml
```

> `EXPO_PUBLIC_MOCK_START_EMPTY` を付けずに起動した場合、fixture の部屋が最初から表示されるため
> `empty-state` の表示アサーションで失敗します。E2E実行時は必ず付与してください。

### スクリーンショットの確認方法

各ステップの `takeScreenshot` コマンドにより、`mobile/.maestro/screenshots/` 配下に PNG が出力されます
（Git管理対象外）。実装変更の前後でこのディレクトリの画像を目視比較することで、UIの差分を確認できます。

CI（GitHub Actions）では `.github/workflows/mobile-ci.yml` の `e2e` ジョブが同じフローを実行し、
`maestro-screenshots` / `maestro-report` アーティファクトとしてアップロードします。PRのActionsタブから
ダウンロードして確認してください。
