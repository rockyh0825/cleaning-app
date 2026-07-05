# Tasks Document — 間取りエディタ v2（操作性改善・UIリッチ化）

変更はモバイルのみ（API・バックエンドは不変）。各タスクは独立した小さなPRとしてレビューできる粒度に分割している。フェーズ内のタスクは基本的に上から順に着手する。

**TDDポリシー**: 各実装タスクにテストを内包する（CLAUDE.md準拠）。Red → Green → Refactor を厳守。

## フェーズ1: 基盤（ジェスチャー・テーマ・純関数）

- [x] 1. react-native-gesture-handler / react-native-reanimated の導入
  - File: mobile/package.json, mobile/babel.config.js, mobile/jest.config（jestSetup追加）, mobile/app/_layout.tsx（GestureHandlerRootView）
  - `npx expo install react-native-gesture-handler react-native-reanimated` で Expo SDK 53 互換バージョンを導入し、babel plugin と jest モックを設定する
  - Purpose: ドラッグ・ピンチ操作の実装基盤（このタスクでは機能追加しない）
  - **確認方法**: `npx jest` で既存全テストが Green のまま、`npx expo start` でアプリが起動すること
  - _Requirements: 1, 2, 4, 5_

- [x] 2. shared/theme: デザイントークンと ThemeProvider / useAppTheme
  - File: mobile/src/shared/theme/{tokens.ts, ThemeProvider.tsx, useAppTheme.ts}
  - light / dark の semantic tokens（colors・spacing・radius・typography・elevation）と部屋種別アクセント（fill / accent / icon）を定義。`useColorScheme` に追従
  - Purpose: 全UIタスクの色・余白の唯一の供給源（Requirement 6 の基盤）
  - **Red**: `shared/theme/__tests__/tokens.test.ts` を先に作成し `npx jest src/shared/theme` で失敗を確認
  - **テスト対象**:
    - 正常系: light / dark 両テーマで全 semantic トークンが定義されている
    - 正常系: 全 RoomType（LIVING〜OTHER）にアクセント定義がある
    - 正常系: ThemeProvider 配下の useAppTheme がカラースキームに応じたテーマを返す
  - _Requirements: 6_

- [x] 3. shared/utils/grid.ts: findFreePosition（空き位置探索）
  - File: mobile/src/shared/utils/grid.ts（追記）
  - 左上から行優先で走査し、`rectsOverlap` で既存矩形と衝突しない最初の位置を返す純粋関数。空きが無ければ null
  - Purpose: 部屋追加時の重なり解消（Requirement 3.1）の計算部
  - **Red**: `shared/utils/__tests__/grid.test.ts` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 障害物なし → (0,0) を返す
    - 正常系: (0,0) に障害物 → 次の空き位置を返す
    - 境界値: 残りスペースにぴったり収まるサイズ → その位置を返す
    - 異常系: 全面が埋まっている → null を返す
  - _Requirements: 3_

- [x] 4. shared/utils/grid.ts: pxOffsetToGridDelta（ドラッグ量→グリッド差分変換）
  - File: mobile/src/shared/utils/grid.ts（追記）
  - px単位の累積ドラッグオフセットとセルサイズからグリッド差分（整数）を返す純粋関数。ズーム倍率も引数で受ける
  - Purpose: ジェスチャーAPIから分離したテスト可能なドラッグ計算の中核
  - **Red**: grid.test.ts にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: セルサイズちょうどのオフセット → ±1 セル
    - 境界値: セル半分ちょうど → 丸め方向が仕様どおり（四捨五入）
    - 正常系: ズーム 2x 時は px 換算が 1/2 になる
    - 異常系: cellSize が 0 → 差分 0 を返す
  - _Requirements: 1, 4_

## フェーズ2: 動かせるようにする

- [x] 5. usecases: UpdateRoomUseCase（モバイル）
  - File: mobile/src/features/floor-plan/usecases/UpdateRoomUseCase.ts
  - 座標・サイズ更新をキャンバス境界（20×20）に `clampWithin` してから repository.updateRoom を呼ぶ。最小サイズ 1×1 を下回る入力は 1×1 に補正
  - Purpose: 部屋の移動・リサイズのビジネスルール（React非依存）
  - **Red**: `usecases/__tests__/UpdateRoomUseCase.test.ts` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 座標がそのまま repository.updateRoom に渡る
    - 境界値: キャンバスをはみ出す座標 → クランプされる
    - 境界値: gridW/gridH に 0 → 1 に補正される
  - _Leverage: mobile/src/shared/utils/grid.ts_
  - _Requirements: 1, 2_

- [x] 6. repositories: FloorPlanRepository に updateRoom / updateFurniture を追加
  - File: mobile/src/features/floor-plan/repositories/FloorPlanRepository.ts
  - 生成クライアントの `updateRoom(roomId, RoomUpdate)` / `updateFurniture(furnitureId, FurnitureUpdate)` をラップ（updateFurniture が未配線の場合のみ）
  - Purpose: PATCH API との接続点
  - **Red**: `repositories/__tests__/FloorPlanRepository.test.ts` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: updateRoom が生成クライアントを userId ヘッダ付きで呼び、Room を返す
    - 正常系: updateFurniture 同上
  - _Requirements: 1, 2, 4_

- [x] 7. hooks: useFloorPlan に updateRoom mutation（楽観的更新）
  - File: mobile/src/features/floor-plan/hooks/useFloorPlan.ts
  - `buildUpdateRoomMutationOptions` を追加。キャッシュ上の該当部屋の座標・サイズを楽観的に差し替え、失敗時ロールバック
  - Purpose: ドラッグ確定時の保存経路（Requirement 1.4 / 2.4）
  - **Red**: `hooks/__tests__/useFloorPlan.test.ts` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: mutate 直後にキャッシュの該当部屋の座標が更新される（他の部屋は不変）
    - 異常系: 保存失敗時に元の座標へロールバックされる
  - _Leverage: buildAddRoomMutationOptions のパターン_
  - _Requirements: 1, 2_

- [x] 8. hooks: useFloorPlan に updateFurniture mutation（楽観的更新）
  - File: mobile/src/features/floor-plan/hooks/useFloorPlan.ts
  - 既存の `UpdateFurnitureUseCase`（clampWithin 内蔵）を配線し、該当家具の座標を楽観的更新
  - Purpose: 家具ドラッグ確定時の保存経路（Requirement 4.3）
  - **Red**: useFloorPlan.test.ts にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: mutate 直後にキャッシュの該当家具の座標が更新される
    - 異常系: 保存失敗時にロールバックされる
  - _Leverage: mobile/src/features/floor-plan/usecases/UpdateFurnitureUseCase.ts_
  - _Requirements: 4_

- [x] 9. 部屋追加時の自動空き配置
  - File: mobile/app/floor-plan/index.tsx（handleAddRoom）
  - 固定 (0,0) をやめ、`findFreePosition` で空き位置を探索して addRoom に渡す。null の場合は (0,0) に配置
  - Purpose: 「追加するたびに重なる」問題の解消（Requirement 3.1 / 3.2）
  - **Red**: `app/floor-plan/__tests__/index.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 既存部屋が (0,0) にあるとき、追加された部屋の座標が重ならない位置になる
    - 異常系: 空きが無いとき (0,0) で追加される（クラッシュしない）
  - _Leverage: mobile/src/shared/utils/grid.ts findFreePosition_
  - _Requirements: 3_

- [x] 10. hooks: useDragToGrid（共通ドラッグフック）
  - File: mobile/src/features/floor-plan/hooks/useDragToGrid.ts
  - Gesture.Pan + Reanimated shared value でドラッグ中は transform プレビューのみ行い、onEnd で `pxOffsetToGridDelta` → `snapToGrid` → `clampWithin` を通した確定矩形を onCommit に渡す
  - Purpose: 部屋・家具・リサイズハンドルで共有するドラッグの心臓部（60fps 要件）
  - **Red**: `hooks/__tests__/useDragToGrid.test.ts` を先に作成し失敗を確認
  - **テスト対象**（確定計算を担う純関数 `commitDrag` を export してテスト）:
    - 正常系: オフセット 1.4 セル分 → 1 セル移動で onCommit
    - 境界値: bounds の外へ 3 セル分ドラッグ → 境界にクランプされた矩形で onCommit
    - 正常系: 移動量 0 → onCommit が呼ばれない
  - _Leverage: mobile/src/shared/utils/grid.ts_
  - _Requirements: 1, 4_

- [x] 11. RoomShape のドラッグ移動対応
  - File: mobile/src/features/floor-plan/components/{RoomShape.tsx, FloorPlanCanvas.tsx}
  - RoomShape に useDragToGrid を組み込み（bounds = キャンバス 20×20）、onCommit で updateRoom.mutate を呼ぶ。TouchableOpacity は GestureDetector + Animated.View に置き換え、タップ選択は Gesture.Tap で維持
  - Purpose: 部屋を動かせるようにする（Requirement 1）
  - **Red**: `components/__tests__/RoomShape.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: タップで onPress（選択）が呼ばれる（既存挙動の維持）
    - 正常系: ドラッグ確定でスナップ済み座標を引数に onDragEnd が呼ばれる
  - _Leverage: useDragToGrid, useFloorPlan.updateRoom_
  - _Requirements: 1_

- [x] 12. 重なり警告の表示
  - File: mobile/src/features/floor-plan/components/{FloorPlanCanvas.tsx, RoomShape.tsx}
  - 描画時に全部屋ペアを `rectsOverlap` で判定し、重なっている部屋に警告スタイル（danger トークンの枠 + 警告アイコン）を付与する
  - Purpose: 重なりの可視化（Requirement 3.3）
  - **Red**: `components/__tests__/FloorPlanCanvas.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 2部屋が重なっている → 両方に警告表示（testID で検証）
    - 正常系: 辺が接しているだけ → 警告なし
  - _Leverage: mobile/src/shared/utils/grid.ts rectsOverlap_
  - _Requirements: 3_

- [x] 13. ResizeHandle コンポーネントと部屋リサイズ
  - File: mobile/src/features/floor-plan/components/ResizeHandle.tsx, RoomShape.tsx（選択時に表示）
  - 選択中の部屋の右下にハンドルを表示し、ドラッグで gridW/gridH を変更（最小 1×1）。確定時に updateRoom.mutate。内包家具のはみ出しは UpdateRoomUseCase / サーバー仕様に従いクライアントでクランプ
  - Purpose: 部屋の広さ調整（Requirement 2）
  - **Red**: `components/__tests__/ResizeHandle.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: ハンドルのドラッグ確定でグリッド単位の新サイズが onCommit に渡る
    - 境界値: 1×1 より小さくなるドラッグ → 1×1 で確定
  - _Leverage: useDragToGrid_
  - _Requirements: 2_

- [x] 14. FurnitureItem のドラッグ移動対応（部屋詳細画面）
  - File: mobile/src/features/floor-plan/components/FurnitureItem.tsx, mobile/app/floor-plan/[roomId].tsx
  - FurnitureItem に useDragToGrid を組み込み（bounds = 所属部屋の矩形）、onCommit で updateFurniture.mutate を呼ぶ
  - Purpose: 家具を動かせるようにする（Requirement 4）
  - **Red**: `components/__tests__/FurnitureItem.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: ドラッグ確定でスナップ済み座標が onDragEnd に渡る
    - 境界値: 部屋の外へのドラッグ → 部屋境界内にクランプされる
  - _Leverage: useDragToGrid, useFloorPlan.updateFurniture_
  - _Requirements: 4_

- [x] 15. キャンバスのパン・ズーム
  - File: mobile/src/features/floor-plan/components/FloorPlanCanvas.tsx, mobile/app/floor-plan/index.tsx
  - ScrollView 入れ子を廃止し、Gesture.Pinch（0.5x〜2x）+ Gesture.Pan（背景）で置き換える。部屋・家具のドラッグ中はキャンバスパンを抑止（`blocksExternalGesture`）。ズーム倍率は useDragToGrid の px→グリッド変換に渡す
  - Purpose: 全体俯瞰と部分拡大（Requirement 5）
  - **Red**: `components/__tests__/FloorPlanCanvas.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: ズーム倍率のクランプ計算（純関数化した clampScale）が 0.5〜2 に収まる
    - 正常系: ScrollView が存在しなくてもキャンバスと全部屋が描画される
  - _Requirements: 5_

## フェーズ3: UIリッチ化

- [x] 16. FloorPlanCanvas / RoomShape / FurnitureItem のビジュアル刷新
  - File: mobile/src/features/floor-plan/components/{FloorPlanCanvas,RoomShape,FurnitureItem}.tsx
  - ハードコード色を全て useAppTheme のトークンに置換。部屋は種別アクセントの塗り＋アイコン＋角丸＋シャドウ、選択時はアクセント枠強調。グリッド線は淡色トークン。家具はサーフェス調のカード表現
  - Purpose: エディタ本体の見た目の底上げ（Requirement 6.1 / 6.3 / 7.4）
  - **Red**: 既存 components テストに「種別アイコンが表示される」「リテラル色が style に残らない（トークン参照）」ケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: KITCHEN の部屋に種別アイコンが表示される
    - 正常系: 選択時に選択スタイル用 testID が付与される
  - _Leverage: mobile/src/shared/theme_
  - _Requirements: 6, 7_

- [x] 17. shared/components: BottomSheet と FloatingActionButton
  - File: mobile/src/shared/components/{BottomSheet.tsx, FloatingActionButton.tsx}
  - 背景オーバーレイ＋下からのスライドイン（Reanimated）を持つ汎用ボトムシートと、右下固定のFAB。どちらもテーマトークンのみ参照
  - Purpose: モーダル・ボタン刷新の部品（他featureでも再利用）
  - **Red**: `shared/components/__tests__/{BottomSheet,FloatingActionButton}.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: visible=true で children が表示され、オーバーレイタップで onClose が呼ばれる
    - 正常系: FAB を押すと onPress が呼ばれる
  - _Leverage: mobile/src/shared/theme_
  - _Requirements: 7_

- [x] 18. AddRoomModal のボトムシート化と種別ピッカー刷新
  - File: mobile/src/features/floor-plan/components/AddRoomModal.tsx
  - BottomSheet ベースに置き換え、部屋種別をアイコン＋アクセントカラーのカードグリッドで選択できるようにする（既存の onSubmit インターフェースは維持）
  - Purpose: 追加体験のリッチ化（Requirement 7.1）
  - **Red**: 既存 `components/__tests__/AddRoomModal.test.tsx` が Green のまま通ることを確認したうえで、種別カード選択のケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 種別カードをタップして送信すると選択種別で onSubmit が呼ばれる（既存テスト互換）
    - 正常系: 名前未入力では送信できない
  - _Leverage: BottomSheet, mobile/src/shared/theme_
  - _Requirements: 7_

- [ ] 19. AddFurnitureModal のボトムシート化とプリセットピッカー刷新
  - File: mobile/src/features/floor-plan/components/AddFurnitureModal.tsx
  - BottomSheet ベースに置き換え、プリセット家具をアイコン付きチップ／カードで選択。自由名称入力も維持
  - Purpose: 家具追加体験のリッチ化（Requirement 7.1）
  - **Red**: 既存 AddFurnitureModal テスト互換＋プリセット選択ケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: プリセット選択で presetKey 付きの onSubmit が呼ばれる
    - 正常系: 自由名称入力で presetKey なしの onSubmit が呼ばれる
  - _Leverage: BottomSheet, mobile/src/shared/theme_
  - _Requirements: 7_

- [ ] 20. 画面クローム刷新（FAB・empty state・テーマ適用）
  - File: mobile/app/floor-plan/{index.tsx, [roomId].tsx}, mobile/app/_layout.tsx（ThemeProvider 配線）
  - 全幅「部屋を追加」ボタンを FAB に置換。empty state をイラスト（SVG/絵文字）＋説明＋CTA構成に刷新。画面背景・ヘッダーをテーマトークンに置換し、ThemeProvider をアプリルートに配線
  - Purpose: 画面全体の仕上げ（Requirement 6.2 / 7.2 / 7.3）
  - **Red**: `app/floor-plan/__tests__/index.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 部屋ゼロのとき empty state と CTA が表示される（既存テスト互換）
    - 正常系: FAB タップで AddRoomModal（ボトムシート）が開く
  - _Leverage: FloatingActionButton, mobile/src/shared/theme_
  - _Requirements: 6, 7_

- [ ] 21. ダークモード対応の検証と調整
  - File: mobile/src/shared/theme/tokens.ts（調整）, 各コンポーネント（漏れ修正のみ）
  - ライト／ダーク両テーマで全画面を目視確認し、コントラスト不足・トークン参照漏れ（ハードコード色の残り）を潰す
  - Purpose: v1 Usability 要件「ダークモード対応」の完了（Requirement 6.2）
  - **確認方法**: `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/features/floor-plan mobile/app/floor-plan` でリテラル色が theme 以外に残っていないこと。シミュレータで外観切り替えして目視確認
  - _Requirements: 6_

## フェーズ4: 統合

- [ ] 22. E2E シナリオ追加（Maestro）
  - 「部屋追加 → 重ならず配置 → ドラッグ移動 → アプリ再起動 → 位置が保持」のシナリオを issue #68 の E2E 基盤に追加する（基盤未整備の場合は issue にシナリオ追記のみ）
  - _Requirements: 1, 3_
