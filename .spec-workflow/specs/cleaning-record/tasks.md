# Tasks Document — 掃除記録（cleaning-record）

実装順序は契約ファースト（OpenAPIスキーマ → バックエンド → モバイル）に従う。Part テーブルは layout-editor で作成済みである前提で、本featureは CleaningRecord テーブルとパーツ管理APIを追加する。各タスクは structure.md のレイヤー構成・命名規則・コードサイズ上限に準拠する。

## フェーズ1: API契約定義

- [ ] 1. OpenAPIスキーマに掃除記録・パーツ管理のエンドポイント／スキーマを定義
  - File: api/openapi.yaml, api/components/schemas/{CleaningRecord,Part,OverdueArea}.yaml
  - POST /cleaning-records（partIds[]一括）・GET /cleaning-records（areaId/partId絞り込み・ページング）・PATCH /cleaning-records/{recordId}・DELETE /cleaning-records/{recordId}・POST /parts・PATCH /parts/{partId}・DELETE /parts/{partId} を定義
  - Purpose: クライアント・サーバー間の契約を確立
  - _Requirements: 1, 2, 3, 4_
  - _Prompt: Role: API設計者（OpenAPI 3.1） | Task: design.mdのAPI表とData Modelsに基づき、CleaningRecord/Part/OverdueAreaスキーマと7エンドポイントを定義する。一括記録はpartIds配列を受け取る | Restrictions: UUID・最大2階層ネスト・複数形kebab-case命名、全エンドポイントにsummary/description | Success: lintが通り、クライアント・スタブ生成が成功する_

- [ ] 2. APIクライアント・サーバースタブを生成
  - File: scripts/generate-api-client.sh の実行
  - Purpose: 型安全な契約コードを得る
  - _Leverage: scripts/generate-api-client.sh_
  - _Requirements: 1, 2, 3, 4_
  - _Prompt: Role: ビルドエンジニア | Task: generate-api-client.shを実行しクライアント・スタブを生成、各プロジェクトでビルドできることを確認 | Restrictions: 生成物はコミット対象外、手書きしない | Success: 生成クライアントがimport可能、スタブがコンパイルできる_

## フェーズ2: バックエンド（Spring Boot + Kotlin + MyBatis）

- [ ] 3. Flywayマイグレーションで cleaning_record テーブルを作成
  - File: backend/src/main/resources/db/migration/V2__cleaning_record_initial.sql
  - UUID主キー、part_id外部キー（part への ON DELETE CASCADE）、cleaned_at・user_idインデックス
  - Purpose: 掃除履歴の永続化基盤
  - _Requirements: 1, 3_
  - _Prompt: Role: データベースエンジニア（PostgreSQL/Flyway） | Task: cleaning_recordテーブルを作るマイグレーションを書く。part_idはpartへのFKでON DELETE CASCADE、cleaned_at降順・user_idのインデックスを張る | Restrictions: 連番ID禁止、Flyway命名規則（V2__）に従う、partテーブルはV1で作成済み前提 | Success: マイグレーション適用でき、part削除で記録が連鎖削除される_

- [ ] 4. domain層: CleaningRecord ドメインモデルと期限超過判定ロジック
  - File: backend/.../cleaningrecord/domain/{CleaningRecord,CleaningStatus}.kt
  - 推奨周期に対する経過割合（elapsedRatio）の算出、期限超過（> 1.0）判定を純粋Kotlinで
  - Purpose: Springに非依存なビジネスルール
  - _Requirements: 1, 5_
  - _Prompt: Role: Kotlinドメイン設計者 | Task: CleaningRecordデータクラスと、lastCleanedAt・recommendedCycleDaysから経過割合・期限超過を判定するドメインロジックを純粋Kotlinで実装 | Restrictions: Springアノテーション禁止、純粋関数、1ファイル300行以内 | Success: フレームワーク非依存でコンパイルでき、境界値（ちょうど100%等）が正しい_

- [ ] 5. infrastructure層: MyBatis Mapper（CleaningRecord / Part）
  - File: backend/.../cleaningrecord/infrastructure/{CleaningRecordMapper.kt, CleaningRecordMapper.xml, CleaningRecordRepositoryImpl.kt}
  - 記録のCRUD、履歴の絞り込み・ページング、`SELECT MAX(cleaned_at)`での最終掃除日時取得、パーツのlastCleanedAt更新
  - Purpose: データアクセス実装
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: バックエンド開発者（MyBatis） | Task: CleaningRecordとPartのMapperを実装。記録CRUD、areaId/partId絞り込みとページング、MAX(cleaned_at)取得、Part.last_cleaned_at更新のSQLを書く | Restrictions: domainにMyBatis依存を漏らさない、動的SQLは<if>等で記述、UUID使用 | Success: CRUD・絞り込み・再計算用クエリがMapper経由で動作する_

- [ ] 6. application層: RecomputeLastCleanedService と各ユースケース
  - File: backend/.../cleaningrecord/application/{RecomputeLastCleanedService,LogCleaningUseCase,EditRecordUseCase,DeleteRecordUseCase,ManagePartUseCase}.kt
  - RecomputeLastCleanedServiceに再計算を一元化。LogCleaningは複数partを1トランザクションで記録、各操作後に再計算
  - Purpose: ビジネスロジックとトランザクション境界
  - _Requirements: 1, 2, 3, 4_
  - _Prompt: Role: バックエンド開発者（サービス層） | Task: lastCleanedAt再計算をRecomputeLastCleanedServiceに集約。LogCleaningUseCaseは複数partの一括記録を1トランザクションで行い記録後に再計算、Edit/Deleteも再計算、ManagePartUseCaseでパーツ追加/編集/削除を実装 | Restrictions: 1ユースケース1責務・100行以内、記録更新と再計算を同一トランザクションに、presentation非依存 | Success: 一括記録の原子性・修正/削除後の再計算（全削除でnull化）が正しい_

- [ ] 7. application層: CleaningStatusPort と実装（他feature公開）
  - File: backend/.../capabilities/CleaningStatusPort.kt, backend/.../cleaningrecord/application/CleaningStatusPortImpl.kt
  - getLastCleanedAt(areaId) / getOverdueAreas() を提供
  - Purpose: heatmap・notificationへの掃除状態公開
  - _Requirements: 5_
  - _Prompt: Role: ソフトウェアアーキテクト | Task: 使う側（heatmap/notification）視点でCleaningStatusPortを定義し、cleaningrecordのapplicationで実装。期限超過エリアと最終掃除日時を返す | Restrictions: Portは依存される側でなく依存する側のニーズで設計、内部実装を漏らさない | Success: 期限超過エリア・最終掃除日時がPort経由で取得できる_

- [ ] 8. presentation層: CleaningRecordController と PartController
  - File: backend/.../cleaningrecord/presentation/{CleaningRecordController,PartController}.kt
  - 生成スタブ実装、UUIDヘッダでスコープ限定、バリデーション
  - Purpose: HTTP入出力
  - _Leverage: shared/web, shared/exception_
  - _Requirements: 1, 2, 3, 4_
  - _Prompt: Role: バックエンド開発者（REST API） | Task: 生成スタブを実装し各ユースケースに委譲。UUIDヘッダでスコープ限定、入力バリデーション | Restrictions: Controllerにビジネスロジックを書かない、共通例外ハンドラ使用 | Success: 全エンドポイント動作、他UUIDのデータにアクセスできない_

- [ ] 9. バックエンドのテスト（JUnit 5 + RestAssured + Konsist）
  - File: backend/src/test/.../cleaningrecord/*Test.kt
  - Recomputeの再計算・一括記録の原子性・期限超過判定の単体テスト、APIのCRUD/絞り込み/トランザクションロールバック/UUIDスコープの統合テスト、Konsistでレイヤー依存検証
  - Purpose: 信頼性とアーキ遵守
  - _Requirements: 1, 2, 3, 4, 5_
  - _Prompt: Role: QAエンジニア（JUnit 5/RestAssured/Konsist） | Task: 再計算ロジック・期限超過判定の単体テスト、一括記録のロールバック・履歴絞り込み・lastCleanedAt整合のAPI統合テスト、Konsistでlayer依存とfeature間直接参照禁止を検証 | Restrictions: 成功/失敗両シナリオ、テスト独立性 | Success: 全テストパス、再計算と記録の整合が保証される_

## フェーズ3: モバイル（Expo / React Native）

- [ ] 10. features/cleaning-record: types.ts と CleaningRecordRepository
  - File: mobile/src/features/cleaning-record/{types.ts, repositories/CleaningRecordRepository.ts}
  - 生成クライアントをラップした記録CRUD・パーツ管理の実装
  - Purpose: データアクセス層
  - _Leverage: mobile/src/shared/api_
  - _Requirements: 1, 2, 3, 4_
  - _Prompt: Role: React Native開発者（データ層） | Task: 掃除記録の型定義と、生成クライアントを使うCleaningRecordRepositoryを実装 | Restrictions: shared/apiのみに依存、UIロジックを含めない | Success: 記録CRUD・履歴取得・パーツ管理がAPIに対し動作する_

- [ ] 11. features/cleaning-record/usecases
  - File: mobile/src/features/cleaning-record/usecases/{LogCleaningUseCase,EditRecordUseCase,DeleteRecordUseCase,ManagePartUseCase}.ts
  - Purpose: React非依存のビジネスロジック
  - _Requirements: 1, 3, 4_
  - _Prompt: Role: TypeScript開発者（ユースケース） | Task: 一括記録・修正・削除・パーツ管理のユースケースを実装しRepositoryを呼ぶ | Restrictions: React非依存、1ユースケース1責務 | Success: 各ユースケースが単体テスト可能で動作_

- [ ] 12. features/cleaning-record/hooks: useLogCleaning / useCleaningHistory
  - File: mobile/src/features/cleaning-record/hooks/{useLogCleaning,useCleaningHistory}.ts
  - TanStack Queryで履歴取得、useMutationで記録/修正/削除の楽観的更新とロールバック
  - Purpose: UIとユースケースの橋渡し
  - _Leverage: TanStack Query_
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: React開発者（TanStack Query） | Task: useLogCleaning（一括記録）とuseCleaningHistory（取得・修正・削除）を実装。楽観的更新とonErrorロールバック、記録後の関連クエリ無効化 | Restrictions: hooksはusecases/capabilitiesのみ依存、描画ロジックを持たない | Success: 記録・履歴表示・修正/削除・楽観的更新が動作_

- [ ] 13. features/cleaning-record/components: PartChecklist と CleaningTimeline
  - File: mobile/src/features/cleaning-record/components/{PartChecklist,CleaningTimeline,RecordButton}.tsx
  - 複数パーツの一括チェックUI（3タップ目標）、新しい順タイムライン・絞り込み・修正/削除操作
  - Purpose: 視覚操作によるUI
  - _Leverage: mobile/src/shared/components_
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: フロントエンド開発者（React Native） | Task: 複数パーツを一括チェックして記録するPartChecklistと、時系列表示・絞り込み・修正/削除できるCleaningTimelineを実装 | Restrictions: ビジネスロジックを持たない、200行/コンポーネント以内、ダークモード対応、記録は3タップ以内 | Success: 一括記録・履歴閲覧・修正/削除がスムーズに動作_

- [ ] 14. app/(tabs)/history と エリア詳細画面の組み込み
  - File: mobile/app/(tabs)/history.tsx ほか
  - 履歴タブ、エリアタップ→パーツ一覧→記録の導線
  - Purpose: 画面の組み立て
  - _Requirements: 1, 2_
  - _Prompt: Role: React Native開発者（Expo Router） | Task: 履歴タブとエリア詳細からの記録導線を画面ルートとして組み立てる | Restrictions: 画面定義のみ（ロジックはfeaturesへ）、Expo Router規約 | Success: エリア選択→記録、履歴閲覧の導線が通る_

- [ ] 15. CleaningStatusCapability と DI配線
  - File: mobile/src/capabilities/CleaningStatusCapability.ts, mobile/src/features/cleaning-record/repositories/CleaningStatusCapabilityImpl.ts, mobile/src/shared/app-root/providers/di.ts
  - heatmap・notificationが掃除状態を読むための境界インターフェースと実装の配線
  - Purpose: feature間依存の逆転
  - _Requirements: 5_
  - _Prompt: Role: ソフトウェアアーキテクト | Task: 使う側視点でCleaningStatusCapability（getLastCleanedAt/getOverdueAreas）を定義し、cleaning-recordで実装、di.tsで配線する | Restrictions: di.ts以外でfeature間を直接importしない | Success: heatmap・notificationがCapability経由で掃除状態を参照できる_

- [ ] 16. モバイルのテスト（Jest + eslint-plugin-boundaries）
  - File: mobile/src/features/cleaning-record/**/*.test.ts
  - usecasesの単体テスト、boundariesでfeature間直接import禁止を検証
  - Purpose: 信頼性とアーキ遵守
  - _Requirements: 1, 2, 3, 4_
  - _Prompt: Role: QAエンジニア（Jest/ESLint） | Task: usecasesの単体テストを書き、eslint-plugin-boundariesでfeatures間の直接importを検出する設定を確認 | Restrictions: テスト独立性、楽観的更新のロールバックも検証 | Success: テストがパスし、boundaries違反がCIで検出される_

## フェーズ4: 統合

- [ ] 17. E2E統合とCI組み込み
  - File: .github/workflows/ci.yml（既存に追記）
  - エリア選択→一括チェック→記録→履歴確認→1件修正→最終掃除日時更新 のE2E、CIにテスト/アーキテストを組み込む
  - Purpose: 一連の体験とCI自動化
  - _Requirements: All_
  - _Prompt: Role: QA自動化エンジニア（CI/CD） | Task: 記録から修正・再計算までのE2Eを検証し、GitHub ActionsのCIにcleaning-recordのテスト・アーキテストを組み込む | Restrictions: 実ユーザーフローをテスト、実装詳細に依存しない | Success: E2Eがパスし、PRごとにCIで自動実行される_
