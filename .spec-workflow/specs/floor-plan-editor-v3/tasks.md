# Tasks Document — 間取りエディタ v3（編集の完結性: 削除・リサイズ・リネーム・サイズ指定）

変更はモバイルのみ（API・バックエンドは不変）。各タスクは独立した小さなPRとしてレビューできる粒度に分割している。

**TDDポリシー**: 各実装タスクにテストを内包する（CLAUDE.md準拠）。Red → Green → Refactor を厳守。

## フェーズ1: mutation の補完

- [x] 1. hooks: useFloorPlan に deleteFurniture mutation（楽観的更新）
  - File: mobile/src/features/floor-plan/hooks/useFloorPlan.ts
  - `buildDeleteFurnitureMutationOptions` を追加。キャッシュから該当家具を楽観的に除去し、失敗時ロールバック。既存の `DeleteFurnitureUseCase` / `FloorPlanRepository.deleteFurniture` を配線
  - Purpose: 家具削除の保存経路（Requirement 2）
  - **Red**: `hooks/__tests__/useFloorPlan.test.ts` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: mutate 直後にキャッシュから該当家具が消える（他の家具・部屋は不変）
    - 異常系: 保存失敗時に家具が復元される
  - _Leverage: buildDeleteRoomMutationOptions（deleteRoom）のパターン_
  - _Requirements: 2_

- [x] 2. hooks: name のみの部分更新の動作保証
  - File: mobile/src/features/floor-plan/hooks/useFloorPlan.ts（テスト追加のみの見込み）
  - `updateRoom` / `updateFurniture` に name のみの input を渡した場合、キャッシュの name が楽観的に差し替わり座標が保たれることをテストで保証する
  - Purpose: リネームの保存経路（Requirement 4）
  - **Red**: useFloorPlan.test.ts にケースを追加し失敗を確認（既に通る場合は境界の明文化としてそのまま採用）
  - **テスト対象**:
    - 正常系: name のみ指定 → name だけ更新、gridX/Y/W/H は不変
    - 異常系: 保存失敗時に元の name にロールバック
  - _Requirements: 4_

- [ ] 12. hooks: deleteRoom の楽観的更新＋失敗時ロールバック・通知
  - File: mobile/src/features/floor-plan/hooks/useFloorPlan.ts
  - 現状の deleteRoom は mutationFn + invalidate のみで、Requirement 1.4（削除失敗時のロールバックと通知）を満たさない。buildDeleteFurnitureMutationOptions と同型の buildDeleteRoomMutationOptions を追加し、キャッシュからの楽観的除去・onError ロールバック・失敗通知を実装する（PR #114 レビュー指摘のフォロー）
  - _Leverage: buildDeleteFurnitureMutationOptions_
  - _Requirements: 1_

## フェーズ2: 削除・リネームの導線

- [x] 3. components: SelectionActions（選択対象への操作バー）
  - File: mobile/src/features/floor-plan/components/SelectionActions.tsx
  - 選択中の対象名と「名称変更」「削除」ボタンを持つ操作バー。削除ボタンは danger トークン。テーマトークンのみ参照
  - Purpose: 削除・リネームへの2タップ以内の導線（Requirement 1, 2, 4 / NFR Usability）
  - **Red**: `components/__tests__/SelectionActions.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 対象名が表示され、各ボタン押下で onRename / onDelete が呼ばれる
  - _Leverage: mobile/src/shared/theme_
  - _Requirements: 1, 2, 4_

- [x] 4. components: RenameSheet（名称編集ボトムシート）
  - File: mobile/src/features/floor-plan/components/RenameSheet.tsx
  - BottomSheet ベース。initialName を初期値に表示し、空・空白のみの場合は確定ボタンを無効化
  - Purpose: 名称編集UI（Requirement 4）
  - **Red**: `components/__tests__/RenameSheet.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 初期値が表示され、変更して確定すると onSubmit(newName) が呼ばれる
    - 異常系: 空白のみの入力では確定できない
  - _Leverage: mobile/src/shared/components/BottomSheet_
  - _Requirements: 4_

- [x] 5. 間取り画面: 部屋の削除・リネーム組み込み
  - File: mobile/app/(tabs)/floor-plan/index.tsx
  - 部屋選択時に SelectionActions を表示。削除は `Alert.alert`（カスケード削除の明示文言＋破壊的スタイル）を挟んで deleteRoom.mutate、リネームは RenameSheet → updateRoom.mutate
  - Purpose: 部屋の削除・リネーム完成（Requirement 1, 4）
  - **Red**: `app/floor-plan/__tests__/index.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 部屋選択で SelectionActions が表示される
    - 正常系: 削除確定で deleteRoom.mutate が該当 roomId で呼ばれる（Alert はモック）
    - 正常系: リネーム確定で updateRoom.mutate が name 付きで呼ばれる
  - _Leverage: SelectionActions, RenameSheet, useFloorPlan.deleteRoom_
  - _Requirements: 1, 4_

- [x] 6. 部屋詳細画面: 家具の削除・リネーム組み込み
  - File: mobile/app/(tabs)/floor-plan/[roomId].tsx
  - 家具選択時に SelectionActions を表示。削除は Alert 確認 → deleteFurniture.mutate、リネームは RenameSheet → updateFurniture.mutate
  - Purpose: 家具の削除・リネーム完成（Requirement 2, 4）
  - **Red**: `app/floor-plan/__tests__/[roomId].test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 家具選択で SelectionActions が表示される
    - 正常系: 削除確定で deleteFurniture.mutate が該当 furnitureId で呼ばれる
    - 正常系: リネーム確定で updateFurniture.mutate が name 付きで呼ばれる
  - _Leverage: SelectionActions, RenameSheet, useFloorPlan.deleteFurniture_
  - _Requirements: 2, 4_

## フェーズ3: 家具のリサイズ

- [ ] 7. FurnitureItem に ResizeHandle を組み込み
  - File: mobile/src/features/floor-plan/components/FurnitureItem.tsx, FloorPlanCanvas.tsx
  - 選択中の家具の右下に ResizeHandle を表示（bounds = 所属部屋の相対矩形、最小 1×1）。確定時に onResizeEnd でスナップ済みサイズを親へ渡し、updateFurniture.mutate を呼ぶ
  - Purpose: 家具の大きさ調整（Requirement 3）
  - **Red**: `components/__tests__/FurnitureItem.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: ハンドルのドラッグ確定でグリッド単位の新サイズが onResizeEnd に渡る
    - 境界値: 1×1 より小さくなるドラッグ → 1×1 で確定
    - 境界値: 部屋境界を超えるサイズ → 部屋内にクランプ
  - _Leverage: ResizeHandle, useDragToGrid, UpdateFurnitureUseCase_
  - _Requirements: 3_

## フェーズ4: 追加時サイズ指定・空き配置

- [ ] 8. AddRoomModal にサイズステッパー追加
  - File: mobile/src/features/floor-plan/components/AddRoomModal.tsx
  - 幅・高さのステッパー（1〜キャンバス上限、既定 4×4）を追加し、onSubmit のペイロードに gridW/gridH を含める
  - Purpose: 部屋の追加時サイズ指定（Requirement 5.1 / 5.2）
  - **Red**: `components/__tests__/AddRoomModal.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: サイズ未変更で送信 → 4×4 で onSubmit（既存テスト互換）
    - 正常系: ステッパーで 6×5 に変更して送信 → 6×5 で onSubmit
    - 境界値: 1 未満・キャンバス上限超過にはできない
  - _Requirements: 5_

- [x] 9. 家具プリセットに既定サイズを定義し AddFurnitureModal に反映
  - File: mobile/src/features/floor-plan/constants.ts, components/AddFurnitureModal.tsx
  - 各プリセットに `defaultSize` を追加（例: ベッド 2×3、冷蔵庫 1×1）。プリセット選択でサイズ初期値に反映し、onSubmit に gridW/gridH を含める。自由名称入力は 1×1
  - Purpose: 家具の追加時サイズ指定（Requirement 5.3 / 5.4）
  - **Red**: `components/__tests__/AddFurnitureModal.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 全プリセットに defaultSize が定義されている
    - 正常系: プリセット選択で該当サイズ付きの onSubmit が呼ばれる
    - 正常系: 自由名称入力では 1×1 で onSubmit
  - _Requirements: 5_

- [ ] 10. 家具追加の空き配置と相対座標バグ修正
  - File: mobile/app/floor-plan/[roomId].tsx（handleAddFurniture）
  - 指定サイズを部屋サイズにクランプ → `findFreePosition`（bounds = {0,0,room.gridW,room.gridH}、障害物 = 既存家具）で空き探索 → null なら (0,0)。**現状 room.gridX/gridY（絶対座標）を相対座標として渡しているバグをここで修正する**
  - Purpose: 家具が重なって追加される問題と座標系バグの解消（Requirement 6）
  - **Red**: `app/floor-plan/__tests__/[roomId].test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: (0,0) に既存家具があるとき、追加家具が重ならない相対位置で addFurniture が呼ばれる
    - 正常系: 部屋が (5,5) にあっても追加家具の座標は部屋内相対（0 起点）
    - 異常系: 部屋が満杯 → (0,0) で追加される（クラッシュしない）
  - _Leverage: mobile/src/shared/utils/grid.ts findFreePosition_
  - _Requirements: 6_

## フェーズ5: 統合

- [ ] 11. E2E シナリオ追加（Maestro）
  - 「部屋追加（サイズ指定）→ 家具追加（重ならない）→ 家具リサイズ → 部屋リネーム → 部屋削除 → 再起動して反映が保持」のシナリオを issue #68/#70 の E2E 基盤に追加する
  - _Requirements: All_
