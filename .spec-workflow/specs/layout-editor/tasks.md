# Tasks Document — 間取りエディタ

実装順序は契約ファースト（tech.md ADR-003）に従い、OpenAPIスキーマ → バックエンド → モバイルの順で進める。各タスクは structure.md のレイヤー構成・命名規則・コードサイズ上限に準拠する。

## フェーズ1: API契約定義

- [ ] 1. OpenAPIスキーマに間取りエディタのエンドポイント・スキーマを定義
  - File: api/openapi.yaml, api/components/schemas/{Room,Furniture,Part}.yaml
  - Room / Furniture / Part のスキーマと、GET /floor-plan・POST /rooms・PATCH /rooms/{roomId}・DELETE /rooms/{roomId}・POST /rooms/{roomId}/furniture・PATCH /furniture/{furnitureId}・DELETE /furniture/{furnitureId} を定義
  - 全リソースのID型はUUID、座標はグリッド整数（gridX/gridY/gridW/gridH）
  - Purpose: クライアント・サーバー間の唯一の契約を確立する
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: API設計者（OpenAPI 3.1 / REST設計の専門家） | Task: design.md のData Models・API表に基づき、Room/Furniture/Part スキーマと7エンドポイントを api/openapi.yaml に定義する。UUID主キー・グリッド整数座標・最大2階層ネストを守る | Restrictions: 住所/実寸/GPS項目を含めない、全エンドポイントにsummaryとdescriptionを記載、structure.mdの命名規則（複数形kebab-case）に従う | Success: スキーマがlintを通り、OpenAPI Generatorでクライアント・スタブ生成が成功する_

- [ ] 2. APIクライアント・サーバースタブを生成
  - File: scripts/generate-api-client.sh の実行（mobile/src/shared/api/ と backend スタブ）
  - Purpose: 手書きAPI呼び出しを排除し型安全な契約を得る
  - _Leverage: scripts/generate-api-client.sh_
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: ビルドエンジニア | Task: generate-api-client.sh を実行し、TypeScriptクライアントとSpring Bootスタブを生成、生成物が各プロジェクトでビルドできることを確認する | Restrictions: 生成ディレクトリはコミット対象外（.gitignore準拠）、手動でクライアントコードを書かない | Success: 生成クライアントがimport可能、スタブインターフェースがコンパイルできる_

## フェーズ2: バックエンド（Spring Boot + Kotlin）

- [x] 3. Flywayマイグレーションで room テーブルを作成（スライス1）
  - File: backend/src/main/resources/db/migration/V1__layout_initial.sql ✅ 適用済み
  - UUID主キー・user_id インデックスを定義。furniture / part は後続スライスで V2 以降に追加する
  - Purpose: 間取りの永続化基盤（room のみ）を作る
  - _Requirements: 3_
  - _Prompt: Role: データベースエンジニア（PostgreSQL/Flyway） | Task: design.mdのData Modelsに沿ってroom/furniture/partテーブルを作成するFlywayマイグレーションを書く。UUID主キー、連鎖削除制約、user_idインデックスを含める | Restrictions: 連番ID禁止、住所カラムを作らない、Flyway命名規則（V2__layout_furniture_part.sql 等）に従う | Success: マイグレーションが適用でき、連鎖削除がDBレベルで機能する_

- [ ] 4. domain層: Layout / Room / Furniture / Part ドメインモデルとRoomType・プリセット定義
  - File: backend/.../layout/domain/{Room,Furniture,Part,RoomType}.kt
  - RoomType enum と種別→プリセットパーツのマッピングをdomainに定義（KITCHEN→シンク/コンロ/換気扇/床 等）
  - Purpose: Springに非依存なビジネスルールを確立
  - _Requirements: 1, 2_
  - _Prompt: Role: Kotlinドメインモデル設計者 | Task: design.mdに沿ってRoom/Furniture/Partのデータクラスと、RoomTypeごとのプリセットパーツseed定義をdomain層に純粋Kotlinで実装する | Restrictions: Springアノテーション禁止、1ファイル300行以内、null安全性を活用 | Success: domainがフレームワーク非依存でコンパイルでき、プリセットマッピングが網羅的_

- [ ] 5. infrastructure層: MyBatis Mapperとリポジトリ実装
  - File: backend/.../layout/infrastructure/{LayoutMapper.kt, LayoutMapper.xml, LayoutRepositoryImpl.kt}
  - Room/Furniture/PartのSQLをMapperに記述し、resultMapでdomainモデルにマッピング
  - Purpose: domainとPostgreSQLを橋渡しする
  - _Leverage: shared/config_
  - _Requirements: 3_
  - _Prompt: Role: バックエンド開発者（MyBatis） | Task: Room/Furniture/PartのCRUD SQLをMyBatis Mapper（XMLまたはアノテーション）に記述し、LayoutRepositoryImplでdomainモデルとの変換を行う | Restrictions: domainモデルにMyBatis依存を漏らさない、UUID主キーを使用、連鎖削除はDBのON DELETE CASCADEに委ねる | Success: CRUD・連鎖削除がMapper経由で動作する_

- [ ] 6. application層: AddRoom / UpdateRoom / DeleteRoom / AddFurniture / UpdateFurniture / DeleteFurniture ユースケース
  - File: backend/.../layout/application/*UseCase.kt
  - 部屋追加時に種別プリセットパーツをseed、削除時に配下を連鎖削除（トランザクション境界）
  - Purpose: ビジネスロジックとトランザクション管理
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: バックエンド開発者（サービス層設計） | Task: 各ユースケースを1クラス1責務で実装。AddRoomUseCaseは種別に応じたPartをseed、Delete系は連鎖削除をトランザクション内で行う | Restrictions: 1ユースケース100行以内、domainとinfrastructureのみに依存、presentation非依存 | Success: 各ユースケースが単体で動作、seed・連鎖削除が正しい_

- [ ] 7. presentation層: LayoutController（生成スタブ実装）とバリデーション
  - File: backend/.../layout/presentation/LayoutController.kt
  - UUIDをHTTPヘッダから取得しスコープを限定。生成スタブインターフェースを実装
  - Purpose: HTTP入出力の実装
  - _Leverage: shared/web, shared/exception_
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: バックエンド開発者（REST API） | Task: 生成されたスタブインターフェースを実装し、各ユースケースに委譲。UUIDヘッダでデータスコープを限定、入力バリデーションを行う | Restrictions: ビジネスロジックをControllerに書かない、共通例外ハンドラを使う | Success: 全エンドポイントが動作、他UUIDのデータにアクセスできない_

- [ ] 8. バックエンドのテスト（JUnit 5 + RestAssured + Konsist）
  - File: backend/src/test/.../layout/*Test.kt
  - ユースケースのseed・連鎖削除の単体テスト、APIのCRUD・UUIDスコープ分離の統合テスト、Konsistでレイヤー依存・命名規則を検証
  - Purpose: 信頼性とアーキテクチャ遵守の保証
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: QAエンジニア（JUnit 5/RestAssured/Konsist） | Task: ユースケース単体テスト、RestAssuredによるAPI統合テスト、Konsistでpresentation→application→domainの一方向依存とfeature間直接参照禁止を検証するテストを書く | Restrictions: 成功・失敗の両シナリオを網羅、テスト間の独立性を保つ | Success: 全テストがパス、Konsistがアーキ違反を検出する状態になっている_

## フェーズ3: モバイル（Expo / React Native）

- [ ] 9. shared/utils: グリッドスナップ・矩形衝突・境界制約の純粋関数
  - File: mobile/src/shared/utils/grid.ts
  - snapToGrid(point, cellSize) / rectsOverlap(a, b) / clampWithin(child, parent)
  - Purpose: 描画から分離した軽量な座標計算ロジック
  - _Requirements: 1, 2_
  - _Prompt: Role: TypeScript開発者（純粋関数/アルゴリズム） | Task: グリッドスナップ・矩形衝突判定・親矩形内への座標制約を純粋関数として実装する。毎フレーム呼ばれる前提で軽量に保つ | Restrictions: 副作用なし、React非依存、40行/関数以内 | Success: 境界値を含むテストでカバーされ、60fps描画に耐える_

- [ ] 10. features/layout: types.ts と LayoutRepository
  - File: mobile/src/features/layout/{types.ts, repositories/LayoutRepository.ts}
  - 生成APIクライアントをラップしたCRUD実装
  - Purpose: データアクセス層の確立
  - _Leverage: mobile/src/shared/api_
  - _Requirements: 3_
  - _Prompt: Role: React Native開発者（データ層） | Task: 間取りの型定義と、生成APIクライアントを使うLayoutRepositoryを実装する | Restrictions: repositoriesはshared/apiのみに依存、UIロジックを含めない | Success: CRUDがAPIに対して動作する_

- [ ] 11. features/layout/usecases: AddRoom / ResizeRoom / PlaceFurniture など
  - File: mobile/src/features/layout/usecases/*UseCase.ts
  - grid.ts を使ったスナップ・境界制約を含むビジネスロジック
  - Purpose: React非依存のビジネスロジック
  - _Leverage: mobile/src/shared/utils/grid.ts_
  - _Requirements: 1, 2_
  - _Prompt: Role: TypeScript開発者（ユースケース設計） | Task: 部屋追加・リサイズ・家具配置のユースケースを実装。grid.tsでスナップ・境界制約を適用しRepositoryを呼ぶ | Restrictions: React非依存、1ユースケース1責務、repositoriesとutilsのみに依存 | Success: 各ユースケースが単体テスト可能で動作する_

- [ ] 12. features/layout/hooks: useLayout（TanStack Query統合）
  - File: mobile/src/features/layout/hooks/useLayout.ts
  - useQueryで取得、useMutationで楽観的更新、保存失敗時のロールバック
  - Purpose: UIとユースケースの橋渡し・サーバー状態管理
  - _Leverage: TanStack Query_
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: React開発者（TanStack Query/状態管理） | Task: useLayoutフックを実装。useQueryで間取り取得、useMutationで楽観的更新とonErrorロールバック、ドラッグ中ローカル状態の仲介を行う | Restrictions: hooksはusecasesとcapabilitiesのみに依存、描画ロジックを持たない | Success: 取得・更新・楽観的更新・失敗ロールバックが動作する_

- [ ] 13. features/layout/components: LayoutCanvas と部屋種別・家具追加モーダル
  - File: mobile/src/features/layout/components/{LayoutCanvas,RoomShape,FurnitureItem,AddFurnitureModal}.tsx
  - React Native Skiaでグリッド・部屋・家具を描画、タッチイベントをhooksへ
  - Purpose: 視覚操作によるUI
  - _Leverage: React Native Skia, mobile/src/shared/components_
  - _Requirements: 1, 2_
  - _Prompt: Role: フロントエンド開発者（React Native Skia） | Task: グリッド・部屋矩形・家具をSkiaで描画し、ドラッグ/タップを処理してhooksに渡す。プリセット＋自由名称の家具追加モーダルを実装する | Restrictions: ビジネスロジックを持たない（描画専任）、200行/コンポーネント以内、ダークモード対応 | Success: 部屋追加・ドラッグ・リサイズ・家具配置が60fpsで動作する_

- [ ] 14. app/layout: 画面ルートとオンボーディング誘導・空状態
  - File: mobile/app/layout/index.tsx, mobile/app/layout/[roomId].tsx
  - 間取りが無い場合のempty state、初回起動時の誘導、初回UUID発行の前段処理
  - Purpose: 画面の組み立てとオンボーディング
  - _Requirements: 4_
  - _Prompt: Role: React Native開発者（Expo Router） | Task: 間取りエディタ画面ルートを実装。empty state表示、初回起動誘導、UUID未発行時の生成を行う | Restrictions: 画面定義のみ（ビジネスロジックはfeaturesへ）、Expo Router規約に従う | Success: 新規ユーザーが空状態から間取り作成に到達できる_

- [ ] 15. capabilities/LayoutCapability と DI配線
  - File: mobile/src/capabilities/LayoutCapability.ts, mobile/src/shared/app-root/providers/di.ts
  - heatmapが部屋・家具情報を読むための境界インターフェースと実装の配線
  - Purpose: feature間依存の逆転
  - _Requirements: 1, 2_
  - _Prompt: Role: ソフトウェアアーキテクト | Task: heatmapが利用する視点でLayoutCapabilityインターフェースを定義し、layoutのrepositoryで実装、di.tsで配線する | Restrictions: 使う側の視点でインターフェースを設計、di.ts以外でfeature間を直接importしない | Success: heatmapがCapability経由で間取りを参照できる_

- [ ] 16. モバイルのテスト（Jest + eslint-plugin-boundaries）
  - File: mobile/src/features/layout/**/*.test.ts, ESLint設定
  - grid.tsの境界値テスト、usecasesの単体テスト、boundariesでfeature間直接import禁止を検証
  - Purpose: 信頼性とアーキ遵守
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: QAエンジニア（Jest/ESLint） | Task: grid.ts・usecasesの単体テストを書き、eslint-plugin-boundariesでfeatures間の直接importを禁止するルールを設定・検証する | Restrictions: 純粋関数の境界値を網羅、テスト独立性を保つ | Success: テストがパスし、boundaries違反がCIで検出される_

## フェーズ4: 統合

- [ ] 17. E2E統合とCIパイプライン組み込み
  - File: .github/workflows/ci.yml
  - 空状態→部屋追加→種別選択→家具配置→再起動復元のE2Eフロー確認、CIにlint/test/アーキテストを組み込む
  - Purpose: 一連のユーザー体験とCI自動化の確立
  - _Requirements: All_
  - _Prompt: Role: QA自動化エンジニア（CI/CD） | Task: 間取り作成から復元までのE2Eフローを検証し、GitHub ActionsのCIにモバイル（ESLint+boundaries/型/Jest）とバックエンド（Detekt/ktlint/JUnit/Konsist）を組み込む | Restrictions: 実ユーザーフローをテスト、実装詳細に依存しない | Success: E2Eがパスし、PRごとにCIでlint・test・アーキテストが自動実行される_
