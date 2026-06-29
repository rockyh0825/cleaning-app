# floor-plan-editor feature

## 概要

`features/floor-plan` は間取りエディタ機能を担う feature モジュールです。ユーザーが部屋（Room）・家具（Furniture）を配置し、フロアプランを視覚的に編集できます。

## 主なユースケース

| ユースケース | 説明 |
|---|---|
| 部屋の追加 | `AddRoomModal` で部屋名・種別（RoomType）を入力して追加 |
| 家具の追加 | `AddFurnitureModal` で家具名を入力して特定の部屋に追加 |
| フロアプランの描画 | `FloorPlanCanvas` でグリッド上に部屋・家具を一覧表示 |
| 部屋・家具の選択 | `RoomShape` / `FurnitureItem` をタップして選択状態を切り替え |

## 提供する Capability

`FloorPlanCapabilityImpl`（`mobile/src/capabilities/`）を通じて、他の feature（例: heatmap）が部屋・家具情報を読み取れるインターフェースを提供します。

```
features/floor-plan (データ所有)
    ↓ implements
FloorPlanCapabilityImpl
    ↓ satisfies
FloorPlanCapability (インターフェース)
    ↑ depends on
features/heatmap（など）
```

feature 間の直接 import は eslint-plugin-boundaries によって禁止されており、`FloorPlanCapability` インターフェース経由でのみアクセスできます。

## ディレクトリ構成

```
features/floor-plan/
├── components/          # UI コンポーネント（View のみ、hooks に依存）
│   ├── AddRoomModal.tsx
│   ├── AddFurnitureModal.tsx
│   ├── FloorPlanCanvas.tsx  # グリッド描画（Skia）+ Room/Furniture 一覧
│   ├── RoomShape.tsx
│   ├── FurnitureItem.tsx
│   └── __tests__/
├── hooks/               # TanStack Query 統合（楽観的更新）
│   └── useFloormap.ts
├── repositories/        # API アクセス層
│   └── FloorPlanRepository.ts
├── usecases/            # ビジネスロジック（React 非依存）
│   ├── AddRoomUseCase.ts
│   ├── DeleteRoomUseCase.ts
│   ├── AddFurnitureUseCase.ts
│   ├── UpdateFurnitureUseCase.ts
│   └── DeleteFurnitureUseCase.ts
└── types.ts             # ドメイン型（Room, Furniture, FloorPlan, RoomType）
```

## アーキテクチャ制約

- `components/` は `hooks/` にのみ依存（`usecases/` を直接 import しない）
- `features/floor-plan` から他の feature への import は禁止（boundaries ルール）
- コンポーネントは 200 行以内、関数は 40 行以内を上限とする
