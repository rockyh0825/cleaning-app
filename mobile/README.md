# mobile

Expo 53 / React Native 0.79.6 / React 19 / TypeScript で構築された掃除管理アプリのモバイルクライアントです。

## セットアップ

### 必要なもの

| ツール | 用途 | 確認コマンド |
|---|---|---|
| Node.js 20+ | 実行環境 | `node -v` |
| Xcode 16+ (Mac) | iOS シミュレーター・ビルド | `xcodebuild -version` |
| CocoaPods | iOS ネイティブ依存管理 | `pod --version` |

> **注意**: `@shopify/react-native-skia` はネイティブモジュールのため、**Expo Go では動作しません**。  
> Xcode が必要な Development Build（後述）で起動してください。

### Xcode の初期設定（初回のみ・重要）

Xcode を App Store から入れただけの状態だと、コマンドラインツールの参照先が
Command Line Tools のままになっていることがあります。この状態では
**pod install（glog の configure）や iOS シミュレーターの検出が失敗します**。

```bash
# 現在の参照先を確認
xcode-select -p
# → /Library/Developer/CommandLineTools と表示されたら要修正
# → /Applications/Xcode.app/Contents/Developer なら OK

# Xcode 本体に切り替える（要管理者パスワード）
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# ライセンス同意がまだの場合
sudo xcodebuild -license accept
```

### 依存インストール

```bash
cd mobile
npm install
```

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

### 手順まとめ（初回）

```bash
# 0. Xcode の参照先を確認・修正（前述「Xcode の初期設定」参照）
xcode-select -p

# 1. 依存インストール
cd mobile
npm install

# 2. ビルド & シミュレーター起動（ネイティブプロジェクト生成・pod install も自動実行）
npx expo run:ios
```

`npx expo run:ios` は以下を自動で行います:

1. `ios/` ディレクトリが無ければ `expo prebuild` で生成（git 管理対象外）
2. `pod install`（CocoaPods 依存の解決。初回は数分かかる）
3. `xcodebuild` でビルド（**初回は 5〜10 分程度**。2回目以降は差分ビルドで高速）
4. iOS シミュレーターの起動とアプリのインストール・起動
5. Metro（開発サーバー）の起動

起動すると「間取り」画面にサンプルの部屋（リビング・寝室・キッチン）が表示されます。
バックエンドを起動していなければ Mock モード（前述）で動作するので、
**バックエンドなしでそのまま動作確認できます**。

確認できる操作:

- 部屋をタップ → 部屋詳細画面へ遷移
- 「部屋を追加」→ 部屋名・種別を入力して追加（楽観的更新で即時反映）
- 部屋詳細の「家具を追加」→ 家具名を入力して追加

### 2回目以降（JS のみ変更した場合）

ネイティブの再ビルドは不要です。開発サーバーだけ起動し、
シミュレーター内のインストール済みアプリを開けば接続されます。

```bash
npx expo start --dev-client
```

> **再ビルドが必要になるケース**: ネイティブモジュールを含むパッケージを
> 追加・更新したとき（`expo install` で依存を足したときなど）は
> `npx expo run:ios` で再ビルドしてください。

### トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| `xcodebuild: error: tool 'xcodebuild' requires Xcode` | `xcode-select` が Command Line Tools を指している。「Xcode の初期設定」の手順で切り替える |
| pod install 中に `cp: src/glog/logging.h: No such file or directory` | 同上。glog の configure がフル Xcode のツールチェーンを要求するため |
| `Can't determine id of Simulator app` | 同上（`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` 後に再実行） |
| ビルド中に `fmt/format-inl.h` で `call to consteval function ... is not a constant expression` | Xcode 26 の clang と RN 同梱 fmt 11.0.2 の非互換。`plugins/withFmtXcode26Fix.js` が対処済み（後述）。エラーが出る場合は `npx expo prebuild -p ios --clean` で Podfile を再生成する |
| `Unable to resolve "../../App"` | エントリポイント設定の問題。`package.json` の `"main": "expo-router/entry"` が消えていないか確認 |
| `Cannot find native module 'ExpoLinking'` | ネイティブモジュール追加後に再ビルドしていない。`npx expo run:ios` を実行 |
| ポート 8081 が使用中 | 既存の Metro を終了（`pkill -f "expo start"`）するか `--port` で変更 |

### Xcode 26 対応パッチについて

React Native 0.79 同梱の fmt 11.0.2 は Xcode 26 の clang でコンパイルエラーになります。
`plugins/withFmtXcode26Fix.js`（`app.json` の `plugins` に登録済み）が
prebuild 時に Podfile へ「fmt ターゲットのみ C++17 でビルドする」設定を自動注入して回避しています。
RN が fmt を更新したらこの plugin は削除できます。

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
npm install                     # 依存インストール
npx expo run:ios                # iOS シミュレーターで起動（初回ビルド含む）
npx expo start --dev-client     # 開発サーバーのみ起動（再ビルド不要）
npx jest                        # 全テスト実行
npx jest path/to/test.ts        # 単一テスト実行
npx eslint src/                 # 静的解析
npx tsc --noEmit                # 型チェック
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
│   ├── index.tsx               # ルート（/floor-plan へリダイレクト）
│   └── floor-plan/
│       ├── index.tsx           # 間取り一覧画面
│       └── [roomId].tsx        # 部屋詳細画面
├── src/
│   ├── features/               # 機能ごとのモジュール
│   │   ├── floor-plan/         # 間取りエディタ
│   │   └── cleaning-record/    # 掃除記録
│   ├── capabilities/           # feature 間の境界インターフェース
│   └── shared/                 # 共通ユーティリティ・フック・APIクライアント
│       ├── hooks/useUserId.ts  # 端末保存の匿名ユーザーID（UUID）
│       └── api-fallback/       # バックエンド未起動時の Mock フォールバック
├── plugins/                    # Expo config plugin（Podfile パッチ等）
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
| `react-test-renderer` | ^19.0.0 | RNTL が内部で使用するレンダラー（**React 本体とメジャーバージョンを一致させる**） |

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
- **react-test-renderer のバージョン固定**: `react-test-renderer` は React 本体のバージョン（現在 `19.0.0`）と一致させてください。バージョン不一致はテスト実行時エラーになります。
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
