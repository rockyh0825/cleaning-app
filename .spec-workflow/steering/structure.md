# プロジェクト構造

## 設計方針

**Package by Feature + Layer within Feature + Capability for cross-feature**

- コードは**機能（feature）単位**でディレクトリを切る
- 各featureの内部は**レイヤー（layer）**で整理する
- featureをまたぐ依存が必要な場合は**capability（インターフェース）**を経由する（直接importしない）

```
features/
└── <feature-name>/
    ├── components/     # UIレイヤー
    ├── hooks/          # UIとロジックをつなぐReactフック
    ├── usecases/       # ビジネスロジック（ユースケース）
    ├── repositories/   # データアクセス抽象
    └── types.ts        # この機能の型定義

capabilities/           # feature間の境界インターフェース
└── <CapabilityName>.ts # 依存される側ではなく依存する側が定義
```

### Capabilityパターン

featureのユースケースが他featureのデータを必要とする場合、他featureを直接importせず、`capabilities/` に抽象インターフェースを定義して依存を逆転させる。

```
notification/usecases/ScheduleCleaningReminder.ts
    ↓ 依存（interface）
capabilities/CleaningStatusCapability.ts
    ↑ 実装
cleaning-record/repositories/CleaningStatusCapabilityImpl.ts
```

## ディレクトリ構成

```
cleaning-app/
├── api/                               # OpenAPI仕様（契約の唯一の正本）
│   ├── openapi.yaml
│   └── components/
│       ├── schemas/
│       └── responses/
├── mobile/
│   ├── app/                           # Expo Router ルート（画面定義のみ）
│   │   ├── (tabs)/
│   │   │   ├── index.tsx              # ホーム → features/heatmap を使う
│   │   │   └── history.tsx            # 履歴 → features/cleaning-record を使う
│   │   ├── floorplan/
│   │   │   ├── index.tsx
│   │   │   └── [roomId].tsx
│   │   └── _layout.tsx
│   └── src/
│       ├── features/
│       │   ├── floorplan/             # 間取り図機能
│       │   │   ├── components/        # FloorplanCanvas, RoomShape, FurnitureItem ...
│       │   │   ├── hooks/             # useFloormap, useDragDrop ...
│       │   │   ├── usecases/          # AddRoomUseCase, PlaceFurnitureUseCase ...
│       │   │   ├── repositories/      # FloorplanRepository（API呼び出し実装）
│       │   │   └── types.ts
│       │   ├── heatmap/               # ヒートマップ機能
│       │   │   ├── components/        # HeatmapOverlay, AreaColorBadge ...
│       │   │   ├── hooks/             # useHeatmapColors ...
│       │   │   ├── usecases/          # CalculateHeatmapUseCase
│       │   │   └── types.ts
│       │   ├── cleaning-record/       # 掃除記録機能
│       │   │   ├── components/        # RecordButton, CleaningTimeline ...
│       │   │   ├── hooks/             # useCleaningHistory ...
│       │   │   ├── usecases/          # LogCleaningUseCase, GetOverdueAreasUseCase ...
│       │   │   ├── repositories/      # CleaningRecordRepository
│       │   │   │                      # CleaningStatusCapabilityImpl ← capability実装
│       │   │   └── types.ts
│       │   └── notification/          # 通知機能
│       │       ├── hooks/             # useNotificationPermission ...
│       │       ├── usecases/          # ScheduleCleaningReminderUseCase
│       │       │                      #   ↑ CleaningStatusCapabilityに依存
│       │       └── types.ts
│       ├── capabilities/              # feature間境界インターフェース
│       │   ├── CleaningStatusCapability.ts   # 掃除状態の照会（notification→cleaning-record）
│       │   └── FloorplanCapability.ts        # 間取り情報の照会（heatmap→floorplan）
│       └── shared/                    # 機能横断の共通コード
│           ├── api/                   # 生成されたAPIクライアント（コミット対象外）
│           ├── components/            # 汎用UIパーツ（Button, Card, Icon ...）
│           ├── hooks/                 # 汎用フック（useDebounce, useAsync ...）
│           ├── utils/                 # 純粋ユーティリティ関数
│           └── app-root/
│               └── providers/
│                   └── di.ts          # Capability実装の配線（DI集中管理）
├── backend/
│   └── src/main/kotlin/com/cleaningapp/
│       ├── floorplan/                 # 間取り図機能
│       │   ├── presentation/          # FloormapController（APIスタブ実装）
│       │   ├── application/           # AddRoomUseCase, PlaceFurnitureUseCase ...
│       │   ├── domain/                # Floormap, Room, Furniture（ドメインモデル）
│       │   └── infrastructure/        # FloorplanRepositoryImpl, FloormapMapper（MyBatis）
│       ├── cleaningrecord/            # 掃除記録機能
│       │   ├── presentation/          # CleaningRecordController
│       │   ├── application/           # LogCleaningUseCase, GetOverdueAreasUseCase
│       │   │                          # CleaningStatusPortImpl ← port実装
│       │   ├── domain/                # CleaningRecord, CleaningSchedule
│       │   └── infrastructure/        # CleaningRecordRepositoryImpl, CleaningRecordMapper（MyBatis）
│       ├── notification/              # 通知設定機能（サーバー側設定管理）
│       │   ├── presentation/
│       │   ├── application/           # ↑ CleaningStatusPortに依存
│       │   └── domain/
│       ├── capabilities/              # feature間境界インターフェース（Port）
│       │   └── CleaningStatusPort.kt  # 掃除状態の照会ポート
│       └── shared/                    # 機能横断の共通コード
│           ├── config/                # Spring設定
│           ├── exception/             # 共通例外・エラーハンドラー
│           └── web/                   # 共通レスポンス型
└── scripts/
    └── generate-api-client.sh
```

## レイヤーの責務（feature内）

### モバイル

| レイヤー | 責務 | 依存先 |
|---|---|---|
| `components/` | 描画のみ。ビジネスロジックを持たない | `hooks/`のみ |
| `hooks/` | UIとユースケースをつなぐ。状態管理 | `usecases/`, `capabilities/` |
| `usecases/` | ビジネスロジック。Reactに非依存 | `repositories/`, `capabilities/` |
| `repositories/` | API呼び出し・ローカルストレージの実装 | `shared/api/` |

### バックエンド

| レイヤー | 責務 | 依存先 |
|---|---|---|
| `presentation/` | HTTPの入出力のみ。バリデーション | `application/` |
| `application/` | ユースケース実装。トランザクション境界 | `domain/`, `capabilities/` |
| `domain/` | ビジネスルール。Springに非依存 | なし（純粋Kotlin） |
| `infrastructure/` | MyBatis Mapper・リポジトリ実装 | `domain/` |

## 依存方向のルール

```
【モバイル】
app/ → features/<name>/components/
              ↓
         hooks/ → usecases/ → repositories/ → shared/api/
                      ↓
                 capabilities/   ←  他featureのrepositories/が実装

【バックエンド】
presentation/ → application/ → domain/
                     ↓
               capabilities/  ← 他featureのinfrastructure/が実装
```

- `features/` 内のレイヤーは上から下への一方向依存のみ
- `features/<A>/` から `features/<B>/` への直接importは**禁止**
- feature間の依存は必ず `capabilities/` のインターフェース経由

## DI配線（Capability実装の結合）

Capabilityインターフェースとそのfeatureごとの実装は `shared/app-root/providers/di.ts` で一括して結合する。

```typescript
// shared/app-root/providers/di.ts
import { CleaningStatusCapabilityImpl } from '@/features/cleaning-record/repositories/CleaningStatusCapabilityImpl';
import { ScheduleCleaningReminderUseCase } from '@/features/notification/usecases/ScheduleCleaningReminderUseCase';

// Capability実装をインスタンス化
const cleaningStatusCapability = new CleaningStatusCapabilityImpl(/* repository */);

// 依存先に注入してユースケースを組み立てる
export const scheduleCleaningReminderUseCase = new ScheduleCleaningReminderUseCase(cleaningStatusCapability);
```

- `features/` 同士が直接importし合う唯一の例外が `di.ts`
- `di.ts` はCapabilityの配線**のみ**を行う。ビジネスロジックを含めない
- 新しいCapabilityを追加したら必ずここに配線を追加する

## Capabilityの定義ルール

```typescript
// capabilities/CleaningStatusCapability.ts
// 「依存する側（notification）」のニーズに合わせたインターフェースを定義する
export interface CleaningStatusCapability {
  getOverdueAreas(): Promise<OverdueArea[]>;
  getLastCleanedAt(areaId: string): Promise<Date | null>;
}
```

- インターフェースは**使う側（notification等）の視点**で設計する
- 実装は**提供する側（cleaning-record等）**のrepositories/に置く
- DIによりインターフェースと実装を結合する

## 命名規則

### ファイル

| 種別 | 形式 | 例 |
|---|---|---|
| Reactコンポーネント | PascalCase + `.tsx` | `HeatmapOverlay.tsx` |
| カスタムフック | `use` + PascalCase + `.ts` | `useCleaningHistory.ts` |
| ユースケース | PascalCase + `UseCase.ts` | `LogCleaningUseCase.ts` |
| リポジトリ（interface） | PascalCase + `Repository.ts` | `CleaningRecordRepository.ts` |
| capability（interface） | PascalCase + `Capability.ts` | `CleaningStatusCapability.ts` |
| Kotlin ユースケース | PascalCase + `UseCase.kt` | `LogCleaningUseCase.kt` |
| Kotlin Port（interface） | PascalCase + `Port.kt` | `CleaningStatusPort.kt` |
| MyBatis Mapper（interface） | PascalCase + `Mapper.kt` | `FloormapMapper.kt` |
| MyBatis Mapper XML | PascalCase + `Mapper.xml` | `FloormapMapper.xml` |
| Flywayマイグレーション | `V{番号}__{機能}_{説明}.sql` | `V1__floorplan_initial.sql` |

### コード

**TypeScript**:
- クラス・インターフェース・型: `PascalCase`
- 関数・変数・フック: `camelCase`
- 定数: `UPPER_SNAKE_CASE`
- コンポーネントのprops型: `ComponentNameProps`

**Kotlin**:
- クラス・インターフェース・データクラス: `PascalCase`
- 関数・変数: `camelCase`
- 定数（companion object）: `UPPER_SNAKE_CASE`
- パッケージ: 全小文字 `com.cleaningapp.cleaningrecord`

### APIエンドポイント

- リソース名は複数形・kebab-case: `/cleaning-records`, `/floor-maps`
- IDはUUID: `/rooms/{roomId}`
- ネストは最大2階層: `/rooms/{roomId}/areas/{areaId}`

## コードサイズガイドライン

| 種別 | 目安 |
|---|---|
| ファイルサイズ | 300行以内 |
| コンポーネント | 200行以内（ロジックはhooksへ） |
| ユースケースクラス | 100行以内（1ユースケース1クラス） |
| 関数・メソッド | 40行以内 |
| ネスト深さ | 最大4階層 |

## ドキュメント標準

- 各 `features/<name>/` に `README.md` を置き、機能概要・主なユースケース・担当capabilityを記載
- `capabilities/` の各ファイルに、誰が依存し誰が実装するかをコメントで明記
- OpenAPIスキーマの全エンドポイントに `summary` と `description` を記載
