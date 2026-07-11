# Tasks Document — 掃除ヒートマップ（heatmap）

変更はモバイルのみ（API・バックエンドは不変）。heatmap は読み取り専用 feature で、既存の `FloorPlanCanvas` と 2つの Capability を再利用する。各タスクは structure.md のレイヤー構成・命名規則・コードサイズ上限に準拠し、独立した小さなPRとしてレビューできる粒度に分割している。

**TDDポリシー**: 各実装タスクにテストを内包する（CLAUDE.md準拠）。色判定ロジックは純粋関数として厚めに単体テストする。

## フェーズ1: 色判定ロジック（純粋関数・UI非依存）

- [x] 1. usecases: computeElapsedRatio（経過割合の算出）
  - File: mobile/src/features/heatmap/usecases/computeElapsedRatio.ts
  - `(lastCleanedAt, recommendedCycleDays, now) => number`。null は Infinity、recommendedCycleDays <= 0 は Infinity、それ以外は `(now - lastCleanedAt) / (cycleDays * 86_400_000)`
  - Purpose: パーツ単位の経過割合を求める土台
  - **Red**: `usecases/__tests__/computeElapsedRatio.test.ts` を先に作成し `npx jest src/features/heatmap/usecases` で失敗を確認
  - **テスト対象**:
    - 正常系: 周期14日に対し7日経過 → 0.5
    - 境界値: ちょうど周期経過 → 1.0
    - 異常系: lastCleanedAt が null → Infinity
    - 異常系: recommendedCycleDays が 0・負値 → Infinity
  - _Requirements: 1_

- [x] 2. usecases: resolveHeatStatus（経過割合 → 状態）
  - File: mobile/src/features/heatmap/usecases/resolveHeatStatus.ts
  - `HeatStatus = 'fresh' | 'due' | 'overdue' | 'neutral'` と `DEFAULT_THRESHOLDS = { green: 0.8, red: 1.0 }` を定義。ratio < green → fresh、ratio < red → due、それ以外 → overdue（neutral は呼び出し側が付与）。閾値は引数で差し替え可能
  - Purpose: 色分類の中核。閾値をパラメータ化し閾値カスタマイズ spec が差し込めるようにする
  - **Red**: `usecases/__tests__/resolveHeatStatus.test.ts` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 0.5 → fresh / 0.9 → due / 1.5 → overdue / Infinity → overdue
    - 境界値: ちょうど 0.8 → due、ちょうど 1.0 → overdue
    - 正常系: 閾値を引数で差し替えると分類が変わる（green=0.5 で 0.6 → due）
  - _Requirements: 1_

## フェーズ2: Capability 拡張（cleaning-record 側で実装）

- [x] 3. capability: CleaningStatusCapability に getAreaStatuses を追加
  - File: mobile/src/capabilities/CleaningStatusCapability.ts, mobile/src/features/cleaning-record/repositories/CleaningStatusCapabilityImpl.ts
  - インターフェースに `AreaStatus = { areaId; maxElapsedRatio }` と `getAreaStatuses(userId)` を追加。実装は `listParts(userId)` を ownerId でグルーピングし各グループの経過割合の最大値を返す。既存 getOverdueAreas の比率計算を private ヘルパーに抽出して共有する
  - Purpose: 黄（0.8〜1.0）を含む全エリアの状態を heatmap へ供給する。既存 getOverdueAreas は ratio > 1.0 で filter 済みのため黄が取れない
  - **Red**: `repositories/__tests__/CleaningStatusCapabilityImpl.test.ts` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 1エリアに複数パーツ → 最大 elapsedRatio を返す
    - 正常系: 全パーツ未掃除（null）のエリア → Infinity
    - 正常系: 複数エリアが areaId 単位で集約される
    - 回帰: 既存 getOverdueAreas の挙動がヘルパー抽出後も変わらない
  - _Leverage: computeElapsedRatio（フェーズ1）, CleaningRecordRepository.listParts_
  - _Requirements: 1, 4_

## フェーズ3: テーマトークン

- [x] 4. theme: heat セマンティックトークンを追加（light/dark）
  - File: mobile/src/shared/theme/tokens.ts
  - `AppTheme.colors` に heatFresh / heatDue / heatOverdue / heatNeutral を追加し、lightTheme・darkTheme 双方で palette から具体色を割り当てる（緑=emerald系 / 黄=amber系 / 赤=red系 / 中立=surfaceAlt系）
  - Purpose: 状態→hex の変換をテーマ層で担い、ダークモードで視認性を保つ
  - **Red**: `shared/theme/__tests__` の既存テーマテストに両テーマで4トークンが定義されている検証を追加し失敗を確認
  - **テスト対象**:
    - 正常系: lightTheme / darkTheme とも heatFresh/heatDue/heatOverdue/heatNeutral を持つ
    - 正常系: light と dark で値が異なる
  - _Leverage: mobile/src/shared/theme/tokens.ts（palette）_
  - _Requirements: 2_

## フェーズ4: 描画基盤の拡張（floor-plan と共有・後方互換）

- [x] 5. RoomShape / FurnitureItem に fillColor prop を追加
  - File: mobile/src/features/floor-plan/components/{RoomShape,FurnitureItem}.tsx
  - 任意 prop `fillColor?: string` を追加。指定時は `theme.roomAccents[...].fill` の代わりに fillColor で塗る。未指定なら従来どおり種別色
  - Purpose: ヒートマップの色をエリアごとに差し込む口
  - **Red**: 各コンポーネントの `__tests__` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: fillColor 指定時、その色が矩形の背景に反映される
    - 回帰: fillColor 未指定時は従来の種別色のまま（既存テストが通る）
  - _Requirements: 2_

- [x] 6. FloorPlanCanvas に areaColors / readOnly prop を追加
  - File: mobile/src/features/floor-plan/components/FloorPlanCanvas.tsx
  - 任意 prop `areaColors?: Map<string, string>`（areaId→hex）と `readOnly?: boolean` を追加。areaColors 指定時は各 room/furniture の fillColor に該当色を渡す。readOnly=true では onRoomDragEnd/onFurnitureDragEnd・リサイズハンドル・選択枠を無効化しタップのみ許可。未指定なら従来の編集挙動
  - Purpose: 既存キャンバスを read-only ヒートマップ表示として再利用
  - **Red**: `components/__tests__/FloorPlanCanvas.test.tsx` にケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: areaColors 指定で各エリアに対応 fillColor が渡る
    - 正常系: readOnly=true でドラッグ確定コールバックが呼ばれない（タップは有効）
    - 回帰: prop 未指定時は既存の編集挙動が不変
  - _Leverage: RoomShape.fillColor, FurnitureItem.fillColor（タスク5）_
  - _Requirements: 2, 3_

## フェーズ5: フック（Capability 合成）

- [x] 7. hooks: useHeatmap（floor-plan × 掃除状態の合成）
  - File: mobile/src/features/heatmap/hooks/useHeatmap.ts
  - floorPlanCapability.getRooms と cleaningStatusCapability.getAreaStatuses を react-query で取得し、各エリア（room.id / furniture.id）の maxElapsedRatio を resolveHeatStatus にかけ theme で hex 化した `areaColors: Map<string,string>` を返す。パーツ0件のエリアは heatNeutral。掃除記録更新後にタブへ戻ると最新化されるよう refetchOnMount・staleTime を設定
  - Purpose: 画面が使う整形済みデータを1フックに集約
  - **Red**: `hooks/__tests__/useHeatmap.test.ts` を先に作成し失敗を確認（fake Capability を注入）
  - **テスト対象**:
    - 正常系: 緑・黄・赤が混在する入力から各 areaId に期待色の Map を返す
    - 正常系: 状態が無いエリアは heatNeutral 色になる
    - 正常系: getRooms が家具を含む場合、家具 areaId も Map に含まれる
    - 異常系: 掃除状態取得のみ失敗 → 全エリア neutral にフォールバックしエラーを surface
  - _Leverage: resolveHeatStatus, computeElapsedRatio, di.ts（floorPlanCapability / cleaningStatusCapability）_
  - _Requirements: 1, 4, 5_

## フェーズ6: 画面・コンポーネント

- [x] 8. components: HeatmapLegend（凡例）
  - File: mobile/src/features/heatmap/components/HeatmapLegend.tsx
  - 緑/黄/赤/中立の意味を色スウォッチ + ラベル（例「そろそろ」「要掃除」「記録なし」）で表示。色のみに依存しない
  - Purpose: 色のみに依存しない状態表示（アクセシビリティ）
  - **Red**: `components/__tests__/HeatmapLegend.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 4状態のラベルがすべて表示される
    - 正常系: 各スウォッチが対応する heat トークン色を使う
  - _Leverage: mobile/src/shared/theme_
  - _Requirements: 2_

- [x] 9. components: HeatmapView（本体ラッパー）
  - File: mobile/src/features/heatmap/components/HeatmapView.tsx
  - useHeatmap(userId) の結果を FloorPlanCanvas（readOnly + areaColors）に渡し HeatmapLegend を併置。loading / error / 空状態（部屋0件 → 間取り作成導線）を出し分け。onRoomPress/onFurniturePress で `router.push('/area/'+areaId)`
  - Purpose: ヒートマップ画面の中身
  - **Red**: `components/__tests__/HeatmapView.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 色付きのエリアが描画される（fake Capability）
    - 正常系: エリアタップで router.push が該当 areaId で呼ばれる
    - 異常系: 部屋0件 → 空状態が表示される
    - 異常系: loading / error 状態が表示される
  - _Leverage: FloorPlanCanvas, HeatmapLegend, useHeatmap_
  - _Requirements: 2, 3, 5_

- [x] 10. 画面: ヒートマップタブを追加
  - File: mobile/app/(tabs)/heatmap.tsx, mobile/app/(tabs)/_layout.tsx
  - heatmap.tsx で userId を解決し HeatmapView をマウント。_layout.tsx に「ヒートマップ」タブ（🔥）を間取り・履歴と並べて追加
  - Purpose: ヒートマップへの導線
  - **Red**: `app/(tabs)/__tests__/heatmap.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: userId 解決後に HeatmapView がマウントされる
    - 正常系: userId 未解決時はローディングを表示
  - _Leverage: useUserId, HeatmapView_
  - _Requirements: 2_

- [x] 11. 掃除記録更新後の色反映を確認（query 連携）
  - File: mobile/src/features/heatmap/hooks/useHeatmap.ts
  - 掃除記録の登録/修正/削除後にヒートマップタブへ戻ると色が最新化されることを結合テストで担保。境界を跨ぐ直接依存を作らず、refetchOnMount もしくは共有 query key の無効化で実現する
  - Purpose: 掃除記録と色表示の整合（状態の鮮度）
  - **Red**: `hooks/__tests__/useHeatmap.test.ts` に再取得ケースを追加し失敗を確認
  - **テスト対象**:
    - 正常系: 掃除記録 mutation 成功 → 再取得で該当エリア色が overdue → fresh に変わる
  - _Requirements: 3, 5_

## フェーズ7: 統合

- [x] 12. E2E統合（Maestro）
  - File: mobile/.maestro/（既存 flows に追記）
  - ヒートマップタブを開く→エリアが色付き表示（スクリーンショット）→赤エリアをタップ→掃除記録→タブに戻ると色が変化、のE2Eを既存 iOS Simulator 基盤に追加。Skia Canvas 上要素は座標タップ + スクリーンショット検証
  - Purpose: クリティカルパスの回帰検知
  - _Leverage: 既存 Maestro flows / mobile-ci.yml の e2e ジョブ_
  - _Requirements: All_
