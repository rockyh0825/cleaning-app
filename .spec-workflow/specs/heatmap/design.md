# Design Document — 掃除ヒートマップ（heatmap）

## Overview

heatmap は、floor-plan の部屋・家具配置（`FloorPlanCapability`）と cleaning-record の掃除状態（`CleaningStatusCapability`）を**Capability 経由で読み取り**、各エリア（部屋・家具）を経過割合に応じた色で塗り分けて表示する read-only feature。自身のデータ・API・repository を持たず、既存の描画基盤（`FloorPlanCanvas` / `RoomShape` / `FurnitureItem`）を再利用する。

設計の要点は3つ:
1. **色判定は純粋関数**（経過割合 → 状態 → 色）に切り出し、閾値をパラメータ化して後続の「閾値カスタマイズ」spec が差し込める形にする。
2. **既存 `FloorPlanCanvas` を編集モードと共有**し、エリアごとの塗り色を外から差し込む口（`areaColors`）だけを足す。ヒートマップ用に別キャンバスを新造しない。
3. **Capability を1つ拡張する**。現状の `CleaningStatusCapability.getOverdueAreas()` は「期限超過（ratio>1.0）」のみ返すため、黄（80〜100%）の判定に必要な**全エリアの最大経過割合**が取得できない。全エリア分の状態を返す `getAreaStatuses()` を追加する（requirements の色判定を満たす前提条件）。

## Steering Document Alignment

### Technical Standards (tech.md)

- 状態管理は TanStack Query v5（ADR-006）。heatmap の取得は `useHeatmap` フックが react-query でキャッシュし、掃除記録の変更で無効化する
- feature 間直接 import 禁止（structure.md Capability パターン）を厳守。floor-plan / cleaning-record へは Capability 経由のみ
- 描画は `@shopify/react-native-skia`（グリッド）＋ RN View（部屋・家具矩形）の既存構成を踏襲。Skia 不在環境（Jest）は既存の View フォールバックがそのまま効く
- アーキテスト（eslint-plugin-boundaries）で `features/heatmap` から他 feature への import を禁止する

### Project Structure (structure.md)

```
mobile/src/features/heatmap/
├── components/
│   ├── HeatmapView.tsx        # FloorPlanCanvas を read-only + heat色で描画するラッパー
│   └── HeatmapLegend.tsx      # 色の凡例（アクセシビリティ）
├── hooks/
│   └── useHeatmap.ts          # 2つのCapabilityを合成し、areaId→色 を返す
├── usecases/
│   ├── computeElapsedRatio.ts # (lastCleanedAt, recommendedCycleDays, now) → ratio
│   └── resolveHeatStatus.ts   # (ratio, thresholds) → 'fresh'|'due'|'overdue'|'neutral'
└── README.md
mobile/app/(tabs)/heatmap.tsx  # ヒートマップタブ画面
```

heatmap は repositories を持たない（読み取り専用・Capability を DI で受け取るのみ）。

## Code Reuse Analysis

### Existing Components to Leverage

- **`FloorPlanCanvas`**（`features/floor-plan/components`）: 部屋・家具の配置描画・グリッド・パン/ズームを既に持つ。`onRoomPress` / `onFurniturePress` も既存。ヒートマップは編集ジェスチャ（ドラッグ・リサイズ）を無効化し、塗り色だけ差し替えて再利用する
- **`RoomShape` / `FurnitureItem`**: fill 色は現在 `theme.roomAccents[room.type]` 由来。エリアごとの heat 色を外から受け取れるようにする（下記 Components 参照）
- **`FloorPlanCapability.getRooms(userId)`**: `RoomWithFurniture[]`（部屋＋内包家具）を返す。エリアの集合＝全 room.id ∪ 全 furniture.id
- **`CleaningStatusCapability`**: 掃除状態の唯一の参照口。`getAreaStatuses()` を追加して全エリアの経過割合を取得する
- **`shared/theme`（tokens / useAppTheme）**: セマンティックトークンに heat 色（fresh/due/overdue/neutral）を追加してライト・ダーク両対応にする
- **`app/area/[areaId].tsx`**: エリアタップ後の遷移先（パーツ一覧・掃除記録）として既存。roomId でも furnitureId でも areaId として遷移できる

### Integration Points

- **DI（`shared/app-root/providers/di.ts`）**: 既に export 済みの `floorPlanCapability` / `cleaningStatusCapability` を `useHeatmap` に渡す。新規配線は不要（cleaningStatusCapability に getAreaStatuses が生えるのみ）
- **タブ（`app/(tabs)/_layout.tsx`）**: 「ヒートマップ」タブ（🔥 等）を追加。間取り（🏠）・履歴（🕒）と並ぶ3タブ構成
- **react-query キャッシュ**: 掃除記録の登録/修正/削除（cleaning-record 側の mutation）で使われる query key を無効化対象に含め、記録後にヒートマップ色が最新化されるようにする

## Architecture

### Modular Design Principles

- **色判定ロジックは UI 非依存の純粋関数**（`computeElapsedRatio` / `resolveHeatStatus`）。閾値は引数で受け取り、既定値 `{ green: 0.8, red: 1.0 }` を定数に置く。これにより「閾値カスタマイズ」spec が同じ関数へグローバル/個別閾値を渡すだけで拡張できる
- **色 → 具体色（hex）への変換は theme 層**が担う。純粋関数は状態 enum（`'fresh'|'due'|'overdue'|'neutral'`）までを返し、hex は持たない（ダーク/ライトで色が変わるため）
- **描画の再利用**: heatmap 専用キャンバスを作らず、`FloorPlanCanvas` に「編集させない・色を差し込む」プロップを足す最小拡張にとどめる

```
app/(tabs)/heatmap.tsx
  └─ HeatmapView
       ├─ useHeatmap(userId)                     ← hooks
       │    ├─ floorPlanCapability.getRooms()
       │    ├─ cleaningStatusCapability.getAreaStatuses()
       │    ├─ computeElapsedRatio / resolveHeatStatus   ← usecases（純粋）
       │    └─ theme で status→hex 解決
       ├─ FloorPlanCanvas (readOnly + areaColors)  ← floor-plan 再利用
       └─ HeatmapLegend
```

## Components and Interfaces

### HeatmapView (components・新規)

- **Purpose:** `useHeatmap` の結果を `FloorPlanCanvas` に流し、read-only の塗り分けと凡例を表示する
- **Props:** `{ userId: string }`
- **振る舞い:**
  - `floorPlan` と `areaColors: Map<string, string>`（areaId→hex）を Canvas に渡す
  - `onRoomPress` / `onFurniturePress` で `router.push('/area/'+areaId)` へ遷移
  - loading / error / 空状態（部屋0件 → 間取り作成導線）を出し分け（`app/area/[areaId].tsx` と同じパターン）
- **Reuses:** `FloorPlanCanvas`, `HeatmapLegend`, `useHeatmap`

### FloorPlanCanvas / RoomShape / FurnitureItem (floor-plan・拡張)

- **追加 Prop（後方互換・任意）:**
  - `FloorPlanCanvas`: `areaColors?: Map<string, string>`（未指定なら従来の種別色）／ `readOnly?: boolean`（true でドラッグ・リサイズ・選択枠を無効化）
  - `RoomShape` / `FurnitureItem`: `fillColor?: string`（指定時は `theme.roomAccents[...].fill` の代わりにこれを塗る）
- **設計判断:** `selectedRoomId` などと同じ「未指定なら従来挙動」の後方互換パターンで足すため、既存の編集画面テストは無改修で通る。`readOnly` 時は `onDragEnd` / `onResizeEnd` / リサイズハンドルを描画しない
- **代替案:** heatmap 専用に描画コンポーネントを複製 → 二重管理になるため不採用

### useHeatmap (hooks・新規)

- **Signature:** `useHeatmap(userId: string): { rooms: RoomWithFurniture[]; areaColors: Map<string,string>; isPending; isError }`
- **処理:**
  1. `useQuery(['floorPlan', userId], () => floorPlanCapability.getRooms(userId))`
  2. `useQuery(['areaStatuses', userId], () => cleaningStatusCapability.getAreaStatuses(userId))`
  3. 各 area（room.id / furniture.id）について、`getAreaStatuses` の maxElapsedRatio を `resolveHeatStatus(ratio, DEFAULT_THRESHOLDS)` にかけ、`theme` で hex 化して Map に詰める。ステータスが無いエリア（パーツ0件）は `neutral`
- **無効化:** 掃除記録の mutation 成功時に `['areaStatuses', userId]` を invalidate（cleaning-record 側と query key を共有）

### computeElapsedRatio / resolveHeatStatus (usecases・新規、純粋関数)

```ts
// (lastCleanedAt: Date | null, recommendedCycleDays: number, now: number) => number
export function computeElapsedRatio(lastCleanedAt, recommendedCycleDays, now): number
//  lastCleanedAt === null              → Infinity（未掃除＝最優先）
//  recommendedCycleDays <= 0           → Infinity（周期未設定は最優先扱い）
//  else                                → (now - lastCleanedAt) / (cycleDays * 86_400_000)

export type HeatStatus = 'fresh' | 'due' | 'overdue' | 'neutral';
export function resolveHeatStatus(ratio: number, t = DEFAULT_THRESHOLDS): HeatStatus
//  ratio  < t.green (0.8)  → 'fresh'   （緑）
//  ratio  < t.red   (1.0)  → 'due'     （黄）
//  ratio >= t.red          → 'overdue' （赤）
//  ※ neutral はパーツ0件のエリアに対して呼び出し側が付与する
```

境界値（ちょうど 0.8・ちょうど 1.0）の分類はテストで固定する。

### HeatmapLegend (components・新規)

- 緑/黄/赤/中立の意味を色 + ラベル（例: 「掃除どき」「要掃除」）で示す。色覚特性に配慮し、色のみに依存させない（Requirement 2.3）

## Data Models

### AreaStatus（Capability 拡張の戻り値・新規）

```ts
// mobile/src/capabilities/CleaningStatusCapability.ts に追加
export type AreaStatus = {
  areaId: string;          // room.id または furniture.id（= Part.ownerId）
  maxElapsedRatio: number; // エリア内パーツの最大経過割合。未掃除は Infinity
};

export interface CleaningStatusCapability {
  getOverdueAreas(userId: string): Promise<OverdueArea[]>;   // 既存（通知用）
  getLastCleanedAt(userId: string, areaId: string): Promise<Date | null>; // 既存
  getAreaStatuses(userId: string): Promise<AreaStatus[]>;    // ★ 追加
}
```

- **実装（cleaning-record 側 `CleaningStatusCapabilityImpl`）:** `listParts(userId)` を ownerId でグルーピングし、各グループの `computeElapsedRatio` の最大値を `maxElapsedRatio` として返す。既存 `getOverdueAreas` の ratio 計算ロジックと重複するため、比率計算を private ヘルパーに抽出して共有する
- **なぜ既存 `getOverdueAreas` を使わないか:** あちらは ratio>1.0 で filter 済みのため、黄（0.8〜1.0）のエリアが欠落する。ヒートマップは全エリアの色が要るので別メソッドが必要

### 閾値（定数・後で差し替え可能に）

```ts
export const DEFAULT_THRESHOLDS = { green: 0.8, red: 1.0 } as const;
```

「閾値カスタマイズ」spec では、この定数の代わりにグローバル設定＋エリア/パーツ個別上書きを解決した値を `resolveHeatStatus` に渡す。純粋関数の signature は変えない。

### theme heat トークン（追加）

`AppTheme.colors` にセマンティックトークンを追加（ライト・ダーク両定義）:

| status | 意味 | light（例） | dark（例） |
|---|---|---|---|
| heatFresh | 緑（0〜80%） | emerald300 系 | emerald 濃色 |
| heatDue | 黄（80〜100%） | amber300 系 | amber 濃色 |
| heatOverdue | 赤（100%超） | red500/red400 | red400 |
| heatNeutral | パーツ無し | surfaceAlt/gray | gray |

具体 hex は実装時に palette から選び、ダークで視認性を検証する。

## Error Handling

### Error Scenarios

1. **floor-plan 取得失敗**: エラー状態を表示（間取りが読めなければ色付けラベルも無意味）。再試行導線を出す
2. **掃除状態取得失敗**: floor-plan は取れている場合、配置は表示しつつ全エリアを `neutral` にフォールバックし、状態取得エラーのバナーを出す（配置だけでも見える方が有用）
3. **データ欠損（lastCleanedAt=null / cycleDays<=0 / パーツ0件）**: 純粋関数側で Infinity / neutral に定義どおりフォールバックし、例外を投げない
4. **部屋0件**: 空状態（間取り作成タブへの導線）を表示（Requirement 5.3）
5. **areaId に対応する遷移先が無い**: 通常は起きない（area 詳細は roomId/furnitureId 共通）が、存在しない場合は area 画面の not-found 表示に委ねる

## Testing Strategy

### Unit Testing

- `computeElapsedRatio`: 正常（半分経過=0.5）・境界（ちょうど周期=1.0）・未掃除(null)=Infinity・cycleDays<=0=Infinity
- `resolveHeatStatus`: 0.79→fresh / 0.8→due / 0.99→due / 1.0→overdue / 2.0→overdue（境界を明示）
- `CleaningStatusCapabilityImpl.getAreaStatuses`: 複数パーツを持つエリアで最大 ratio を返す / 全 null エリアは Infinity / パーツ0件エリアは戻り値に含まれない（呼び出し側で neutral 化）
- `useHeatmap`（RNTL + fake capabilities）: rooms と statuses を合成し areaId→色 Map を正しく作る／状態欠損エリアが neutral 色になる

### Integration Testing

- `HeatmapView`: fake Capability で「緑・黄・赤・中立が混在する間取り」を描画し、各エリアに期待 fill 色が付くこと。エリアタップで `/area/{id}` に遷移すること
- 掃除記録 mutation → `['areaStatuses']` invalidate → 該当エリア色が緑に戻ることを query 連携で確認
- ダークモードで heat トークンが切り替わること

### End-to-End Testing

- Maestro フロー（既存 iOS Simulator CI）: ヒートマップタブを開く → エリアが色付き表示される（スクリーンショット artifact）→ 赤エリアをタップ → 掃除記録 → タブに戻ると色が変化。Skia Canvas 上要素は座標タップ + スクリーンショット検証（[[e2e-ci-strategy]] の方針に従う）
- E2E 本数は最小限にし、色判定ロジックは Unit で厚く担保する

## Out of Scope（本 design では扱わない）

- 閾値のグローバル設定・エリア/パーツ個別上書き（別 spec。本 design は差し込み口＝閾値パラメータ化のみ用意）
- リマインダー通知（別 spec）
- 統計ダッシュボード（Future Vision）
