# floormap-editor feature

## 概要

`features/floormap` は間取りエディタ機能を担う feature モジュールです。ユーザーが部屋（Room）・家具（Furniture）を配置し、フロアプランを視覚的に編集できます。

## 主なユースケース

| ユースケース | 説明 |
|---|---|
| 部屋の追加 | `AddRoomModal` で部屋名・種別（RoomType）を入力して追加 |
| 家具の追加 | `AddFurnitureModal` で家具名を入力して特定の部屋に追加 |
| フロアプランの描画 | `FloormapCanvas` でグリッド上に部屋・家具を一覧表示 |
| 部屋・家具の選択 | `RoomShape` / `FurnitureItem` をタップして選択状態を切り替え |

## 提供する Capability

`FloormapCapabilityImpl`（`mobile/src/capabilities/`）を通じて、他の feature（例: heatmap）が部屋・家具情報を読み取れるインターフェースを提供します。

```
features/floormap (データ所有)
    ↓ implements
FloormapCapabilityImpl
    ↓ satisfies
FloormapCapability (インターフェース)
    ↑ depends on
features/heatmap（など）
```

feature 間の直接 import は eslint-plugin-boundaries によって禁止されており、`FloormapCapability` インターフェース経由でのみアクセスできます。

## ディレクトリ構成

```
features/floormap/
├── components/          # UI コンポーネント（View のみ、hooks に依存）
│   ├── AddRoomModal.tsx
│   ├── AddFurnitureModal.tsx
│   ├── FloormapCanvas.tsx  # グリッド描画（Skia）+ Room/Furniture 一覧
│   ├── RoomShape.tsx
│   ├── FurnitureItem.tsx
│   └── __tests__/
├── hooks/               # TanStack Query 統合（楽観的更新）
│   └── useFloormap.ts
├── repositories/        # API アクセス層
│   └── FloormapRepository.ts
├── usecases/            # ビジネスロジック（React 非依存）
│   ├── AddRoomUseCase.ts
│   ├── DeleteRoomUseCase.ts
│   ├── AddFurnitureUseCase.ts
│   ├── UpdateFurnitureUseCase.ts
│   └── DeleteFurnitureUseCase.ts
└── types.ts             # ドメイン型（Room, Furniture, FloorMap, RoomType）
```

## アーキテクチャ制約

- `components/` は `hooks/` にのみ依存（`usecases/` を直接 import しない）
- `features/floormap` から他の feature への import は禁止（boundaries ルール）
- コンポーネントは 200 行以内、関数は 40 行以内を上限とする
