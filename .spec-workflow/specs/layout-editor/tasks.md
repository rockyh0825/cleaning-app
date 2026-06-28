# Tasks Document — 間取りエディタ

実装順序は契約ファースト（tech.md ADR-003）に従い、OpenAPIスキーマ → バックエンド → モバイルの順で進める。各タスクは structure.md のレイヤー構成・命名規則・コードサイズ上限に準拠する。

**TDDポリシー**: 各実装タスクにテストを内包する（CLAUDE.md準拠）。

## フェーズ1: API契約定義

- [x] 1. OpenAPIスキーマに間取りエディタのエンドポイント・スキーマを定義
  - File: api/openapi.yaml, api/components/schemas/{Room,Furniture,Part}.yaml
  - Room / Furniture / Part のスキーマと、GET /floor-plan・POST /rooms・PATCH /rooms/{roomId}・DELETE /rooms/{roomId}・POST /rooms/{roomId}/furniture・PATCH /furniture/{furnitureId}・DELETE /furniture/{furnitureId} を定義
  - 全リソースのID型はUUID、座標はグリッド整数（gridX/gridY/gridW/gridH）
  - Purpose: クライアント・サーバー間の唯一の契約を確立する
  - _Requirements: 1, 2, 3_

- [x] 2. APIクライアント・サーバースタブを生成
  - File: scripts/generate-api-client.sh の実行（mobile/src/shared/api/ と backend スタブ）
  - Purpose: 手書きAPI呼び出しを排除し型安全な契約を得る
  - _Leverage: scripts/generate-api-client.sh_
  - _Requirements: 1, 2, 3_

## フェーズ2: バックエンド（Spring Boot + Kotlin）

- [x] 3. Flywayマイグレーションで room / furniture / part テーブルを作成
  - File: backend/src/main/resources/db/migration/V1__layout_initial.sql, V2__layout_furniture_part.sql ✅ 適用済み
  - UUID主キー・user_id インデックスを定義
  - Purpose: 間取りの永続化基盤を作る
  - _Requirements: 3_

- [x] 4. domain層: Room / Furniture / Part ドメインモデルとRoomType・プリセット定義 ✅ 実装済み
  - File: backend/.../floorplan/domain/{Room,Furniture,Part,RoomType,PresetPartDefinition}.kt
  - ⚠️ TDDルール適用前に実装済み。domain層の単体テストが存在しない場合は後続PRで補完すること
  - Purpose: Springに非依存なビジネスルールを確立
  - _Requirements: 1, 2_

- [x] 5. infrastructure層: MyBatis Mapperとリポジトリ実装 ✅ 実装済み
  - File: backend/.../floorplan/infrastructure/{RoomMapper,FurnitureMapper,PartMapper,*RepositoryImpl}.kt
  - ⚠️ TDDルール適用前に実装済み
  - Purpose: domainとPostgreSQLを橋渡しする
  - _Requirements: 3_

- [x] 6. application層: AddRoom / UpdateRoom / DeleteRoom / AddFurniture / UpdateFurniture / DeleteFurniture ユースケース ✅ 実装済み
  - File: backend/.../floorplan/application/*UseCase.kt
  - ⚠️ TDDルール適用前に実装済み。MockKを使ったユニットテストが存在しない場合は後続PRで補完すること
  - Purpose: ビジネスロジックとトランザクション管理
  - _Requirements: 1, 2, 3_

- [x] 7. presentation層: RoomController / FurnitureController / FloorPlanController ✅ 実装済み
  - File: backend/.../floorplan/presentation/{RoomController,FurnitureController,FloorPlanController}.kt
  - ⚠️ TDDルール適用前に実装済み。@WebMvcTestによるControllerテストが存在しない場合は後続PRで補完すること
  - Purpose: HTTP入出力の実装
  - _Requirements: 1, 2, 3_

- [x] 8. Konsist アーキテクチャテスト ✅ 実装済み
  - File: backend/src/test/kotlin/com/cleaningapp/architecture/ArchitectureTest.kt
  - UseCase/Controller/Mapperの命名・配置、domain層のSpringアノテーション禁止を検証済み
  - Purpose: アーキテクチャ遵守の継続的な保証
  - _Requirements: 1, 2, 3_
  - 追加が必要な場合: presentation → application → domain の一方向依存検証、feature間直接参照禁止

## フェーズ3: モバイル（Expo / React Native）

- [x] 9. shared/utils: グリッドスナップ・矩形衝突・境界制約の純粋関数 ✅ 実装済み
  - File: mobile/src/shared/utils/grid.ts
  - ⚠️ TDDルール適用前に実装済み。境界値テストが存在しない場合は後続PRで補完すること
  - Purpose: 描画から分離した軽量な座標計算ロジック
  - _Requirements: 1, 2_

- [x] 10. features/layout: types.ts と LayoutRepository ✅ 実装済み
  - File: mobile/src/features/layout/{types.ts, repositories/LayoutRepository.ts}
  - ⚠️ TDDルール適用前に実装済み
  - Purpose: データアクセス層の確立
  - _Requirements: 3_

- [ ] 11. features/layout/usecases: AddRoom / DeleteRoom / AddFurniture / UpdateFurniture / DeleteFurniture ユースケース
  - File: mobile/src/features/layout/usecases/{AddRoomUseCase,DeleteRoomUseCase,AddFurnitureUseCase,UpdateFurnitureUseCase,DeleteFurnitureUseCase}.ts
  - grid.ts の clampWithin で AddFurniture / UpdateFurniture 時に家具を部屋境界内に収める
  - Purpose: React非依存のビジネスロジック
  - **Red**: `usecases/__tests__/*.test.ts` を先に作成し `npx jest src/features/layout/usecases` で失敗を確認
  - **テスト対象** (`usecases/__tests__/`):
    - 正常系: `AddRoomUseCase` → repository.createRoom が userId・input で呼ばれ Room を返す
    - 正常系: `AddFurnitureUseCase` → 家具がクランプされてから repository.createFurniture が呼ばれる
    - 境界値: 家具が部屋ぴったりのサイズ → クランプ不要でそのまま渡る
    - 境界値: 家具が部屋をはみ出す → clampWithin で座標が調整される
    - 正常系: `DeleteRoomUseCase` → repository.deleteRoom が呼ばれる
  - _Leverage: mobile/src/shared/utils/grid.ts_
  - _Requirements: 1, 2_

- [ ] 12. features/layout/hooks: useLayout（TanStack Query統合）
  - File: mobile/src/features/layout/hooks/useLayout.ts
  - useQueryで取得、useMutationで楽観的更新、保存失敗時のロールバック
  - Purpose: UIとユースケースの橋渡し・サーバー状態管理
  - **Red**: `hooks/__tests__/useLayout.test.ts` を先に作成し `npx jest src/features/layout/hooks` で失敗を確認
  - **テスト対象** (`hooks/__tests__/useLayout.test.ts`): `@tanstack/react-query` の `QueryClient` をテスト用に生成して使う
    - 正常系: フロアプランを取得して返す
    - 正常系: 部屋追加時にキャッシュが楽観的更新される
    - 異常系: 保存失敗時に楽観的更新がロールバックされる
  - _Leverage: TanStack Query_
  - _Requirements: 1, 2, 3_

- [ ] 13. features/layout/components: LayoutCanvas と部屋種別・家具追加モーダル
  - File: mobile/src/features/layout/components/{LayoutCanvas,RoomShape,FurnitureItem,AddRoomModal,AddFurnitureModal}.tsx
  - React Native Skiaでグリッド・部屋・家具を描画、タッチイベントをhooksへ
  - Purpose: 視覚操作によるUI
  - **Red**: `components/__tests__/*.test.tsx` を先に作成し `npx jest src/features/layout/components` で失敗を確認
  - **テスト対象** (`components/__tests__/`): `@testing-library/react-native` を使う
    - 正常系: `AddRoomModal` → 部屋名を入力して送信するとuseLayoutのaddRoomが呼ばれる
    - 正常系: `AddFurnitureModal` → 家具名を入力して送信するとuseLayoutのaddFurnitureが呼ばれる
    - 正常系: `RoomShape` → タップイベントが onPress に渡る
    - ※ Skia描画（LayoutCanvas本体）はスナップショットテストで最低限カバーする
  - _Leverage: React Native Skia, mobile/src/shared/components_
  - _Requirements: 1, 2_

- [ ] 14. app/layout: 画面ルートとオンボーディング誘導・空状態
  - File: mobile/app/layout/index.tsx, mobile/app/layout/[roomId].tsx
  - 間取りが無い場合のempty state、初回起動時の誘導、初回UUID発行（AsyncStorage）
  - Purpose: 画面の組み立てとオンボーディング
  - **Red**: `app/layout/__tests__/index.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: フロアプランが空のとき empty state が表示される
    - 正常系: UUID未発行のとき AsyncStorage に新しい UUID が保存される
  - _Requirements: 4_

- [x] 15. capabilities/LayoutCapability と DI配線
  - File: mobile/src/capabilities/LayoutCapability.ts, mobile/src/shared/app-root/providers/di.ts
  - heatmapが部屋・家具情報を読むための境界インターフェースと実装の配線
  - Purpose: feature間依存の逆転
  - **Red**: `capabilities/__tests__/LayoutCapability.test.ts` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: `LayoutCapabilityImpl.getRooms()` が LayoutRepository を経由して部屋一覧を返す
    - 正常系: di.ts 経由でインスタンス化した capability が正しく動作する
  - _Requirements: 1, 2_

- [x] 16. eslint-plugin-boundaries 設定（アーキテクチャガード）
  - File: mobile/.eslintrc.js（または eslint.config.js）
  - `features/<A>` から `features/<B>` への直接 import を ESLint エラーにする
  - Purpose: feature間の直接依存をCIで自動検出する
  - **確認方法**: `npx eslint src/` を実行し、意図的に違反コードを書いて ERROR が出ることを確認してから削除する
  - _Requirements: 1, 2, 3_

## フェーズ4: 統合

- [ ] 17. E2E統合とCIパイプライン組み込み
  - File: .github/workflows/ci.yml
  - 空状態→部屋追加→種別選択→家具配置→再起動復元のE2Eフロー確認、CIにlint/test/アーキテストを組み込む
  - Purpose: 一連のユーザー体験とCI自動化の確立
  - _Requirements: All_
