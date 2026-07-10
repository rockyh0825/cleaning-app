# heatmap feature

## 概要

`features/heatmap` は、部屋・家具（エリア）ごとの掃除の経過状況を色（緑／黄／赤／中立）で塗り分けて表示する read-only の feature モジュールです。自身のデータ・API・repository を持たず、floor-plan の配置情報と cleaning-record の掃除状態を読み取って可視化のみを行います。

## 主なユースケース

| ユースケース | 説明 |
|---|---|
| ヒートマップ表示 | `HeatmapView` が全エリアを経過割合に応じた色で塗り分けて表示 |
| 色の凡例 | `HeatmapLegend` が色の意味をラベル付きで表示（色のみに依存しない） |
| エリア詳細への遷移 | エリア（部屋・家具）タップで `/area/{areaId}` に遷移 |
| 表示のたび再計算 | タブのフォーカス復帰ごとにエリア状態を再取得し、現在時刻基準で色を再計算 |

## レイヤー構成

```
features/heatmap/
├── components/
│   ├── HeatmapView.tsx        # FloorPlanCanvas を read-only + heat 色で描画するラッパー
│   ├── HeatmapLegend.tsx      # 色の凡例（アクセシビリティ配慮）
│   └── __tests__/
├── hooks/
│   ├── useHeatmap.ts          # 2つの Capability を合成し、areaId→hex の Map を返す
│   └── __tests__/
└── usecases/                  # 純粋関数（React 非依存）
    ├── computeElapsedRatio.ts # (lastCleanedAt, recommendedCycleDays, now) → 経過割合
    ├── resolveHeatStatus.ts   # (ratio, thresholds) → 'fresh'|'due'|'overdue'
    └── __tests__/
```

repositories は持ちません（読み取り専用・Capability を DI で受け取るのみ）。

## 依存関係

- **データ参照は Capability 経由のみ**（feature 間直接 import 禁止・boundaries ルール）
  - `FloorPlanCapability.getRooms(userId)`: 部屋＋内包家具（エリアの集合）
  - `CleaningStatusCapability.getAreaStatuses(userId)`: 全エリアの最大経過割合
- **例外: floor-plan の描画コンポーネントの再利用**
  - `FloorPlanCanvas` は共有描画基盤として直接 import を許可（heatmap 用に別キャンバスを新造しない。design.md 参照）。`readOnly` + `areaColors` プロップで塗り色だけ差し替える
- **shared/theme**: heat セマンティックトークン（`heatFresh` / `heatDue` / `heatOverdue` / `heatNeutral`）を状態→hex の解決に使用（ライト・ダーク両対応）

## query key 契約

heatmap 専用の invalidate 配線は持たず、既存 feature の mutation が invalidate する query key に **prefix 相乗り**して自動追従します。

| query key | 相乗り先 prefix | 巻き込まれる mutation |
|---|---|---|
| `['floorPlan', userId, 'heatmap-rooms']` | `['floorPlan', userId]` | floor-plan の部屋・家具の変更 |
| `['parts', { userId }, 'area-statuses']` | `['parts']` | cleaning-record の記録の登録・修正・削除 |

末尾セグメントで exact key を分けているのは、相乗り先とデータ形状が異なるためのキャッシュ衝突回避です。加えて、経過割合は取得時の現在時刻で決まるため、`useFocusEffect` によりタブのフォーカス復帰ごとにエリア状態クエリを invalidate します（Requirement 5.1）。
