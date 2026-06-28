# Tasks Document — 掃除記録（cleaning-record）

実装順序は契約ファースト（OpenAPIスキーマ → バックエンド → モバイル）に従う。Part テーブルは layout-editor で作成済みである前提で、本featureは CleaningRecord テーブルとパーツ管理APIを追加する。各タスクは structure.md のレイヤー構成・命名規則・コードサイズ上限に準拠する。

**TDDポリシー**: 各実装タスクにテストを内包する（CLAUDE.md準拠）。

## フェーズ1: API契約定義

- [x] 1. OpenAPIスキーマに掃除記録・パーツ管理のエンドポイント／スキーマを定義
  - File: api/openapi.yaml, api/components/schemas/{CleaningRecord,Part,OverdueArea}.yaml
  - POST /cleaning-records（partIds[]一括）・GET /cleaning-records（areaId/partId絞り込み・ページング）・PATCH /cleaning-records/{recordId}・DELETE /cleaning-records/{recordId}・POST /parts・PATCH /parts/{partId}・DELETE /parts/{partId} を定義
  - Purpose: クライアント・サーバー間の契約を確立
  - _Requirements: 1, 2, 3, 4_

- [x] 2. APIクライアント・サーバースタブを生成
  - File: scripts/generate-api-client.sh の実行
  - Purpose: 型安全な契約コードを得る
  - _Leverage: scripts/generate-api-client.sh_
  - _Requirements: 1, 2, 3, 4_

## フェーズ2: バックエンド（Spring Boot + Kotlin + MyBatis）

- [x] 3. Flywayマイグレーションで cleaning_record テーブルを作成
  - File: backend/src/main/resources/db/migration/V3__cleaning_record_initial.sql
  - UUID主キー、part_id外部キー（part への ON DELETE CASCADE）、cleaned_at・user_idインデックス
  - Purpose: 掃除履歴の永続化基盤
  - _Requirements: 1, 3_

- [x] 4. domain層: CleaningRecord ドメインモデルと期限超過判定ロジック
  - File: backend/src/main/kotlin/com/cleaningapp/cleaningrecord/domain/{CleaningRecord,CleaningStatus}.kt
  - 推奨周期に対する経過割合（elapsedRatio）の算出、期限超過（> 1.0）判定を純粋Kotlinで
  - Purpose: Springに非依存なビジネスルール
  - **Red**: `CleaningStatusTest.kt` を先に作成し `./gradlew test --tests "*.CleaningStatusTest"` で失敗を確認
  - **テスト対象** (`backend/src/test/.../cleaningrecord/domain/CleaningStatusTest.kt`):
    - 正常系: lastCleanedAt が7日前・周期7日 → elapsedRatio = 1.0（期限ちょうど）
    - 境界値: elapsedRatio が 0.8 → GREEN、1.0 → YELLOW（境界は仕様通り）
    - 境界値: elapsedRatio が 1.0 超 → RED（期限超過）
    - 境界値: lastCleanedAt が null → elapsedRatio を最大値として扱う
  - _Requirements: 1, 5_

- [ ] 5. infrastructure層: MyBatis Mapper（CleaningRecord / Part）
  - File: backend/src/main/kotlin/com/cleaningapp/cleaningrecord/infrastructure/{CleaningRecordMapper,CleaningRecordRepositoryImpl}.kt
  - 記録のCRUD、履歴の絞り込み・ページング、`SELECT MAX(cleaned_at)` での最終掃除日時取得
  - Purpose: データアクセス実装
  - **Red**: `CleaningRecordMapperTest.kt` を先に作成し `./gradlew test --tests "*.CleaningRecordMapperTest"` で失敗を確認（`@MybatisTest` を使用）
  - **テスト対象** (`@MybatisTest` + Flyway + PostgreSQL):
    - 正常系: 記録を保存し、partIdで絞り込んで取得できる
    - 正常系: MAX(cleaned_at) が正しく返る
    - 正常系: ページングで件数が制限される
    - 正常系: part削除で記録が連鎖削除される（FK CASCADE）
  - _Requirements: 1, 2, 3_

- [ ] 6. application層: RecomputeLastCleanedService と各ユースケース
  - File: backend/src/main/kotlin/com/cleaningapp/cleaningrecord/application/{RecomputeLastCleanedService,LogCleaningUseCase,EditRecordUseCase,DeleteRecordUseCase,ManagePartUseCase}.kt
  - RecomputeLastCleanedServiceに再計算を一元化。LogCleaningは複数partを1トランザクションで記録、各操作後に再計算
  - Purpose: ビジネスロジックとトランザクション境界
  - **Red**: `*UseCaseTest.kt` を先に作成し `./gradlew test --tests "*.cleaningrecord.application.*"` で失敗を確認（MockK を使用）
  - **テスト対象** (MockK + JUnit 5):
    - 正常系: `LogCleaningUseCase` → 複数 partId を1トランザクションで記録し、再計算が呼ばれる
    - 異常系: 1件でも保存失敗したらロールバックされる（`@Transactional` の動作を確認）
    - 正常系: `DeleteRecordUseCase` → 削除後に再計算が呼ばれ、最終記録が null になる
    - 正常系: `RecomputeLastCleanedService` → MAX(cleaned_at) を取得してpartのlastCleanedAtを更新する
  - _Requirements: 1, 2, 3, 4_

- [ ] 7. application層: CleaningStatusPort と実装（他feature公開）
  - File: backend/src/main/kotlin/com/cleaningapp/capabilities/CleaningStatusPort.kt, backend/src/main/kotlin/com/cleaningapp/cleaningrecord/application/CleaningStatusPortImpl.kt
  - getLastCleanedAt(areaId) / getOverdueAreas() を提供
  - Purpose: heatmap・notificationへの掃除状態公開
  - **Red**: `CleaningStatusPortImplTest.kt` を先に作成し失敗を確認（MockK を使用）
  - **テスト対象**:
    - 正常系: `getOverdueAreas()` → elapsedRatio > 1.0 のパーツのみが返る
    - 正常系: `getLastCleanedAt(areaId)` → 対象エリアの最新 cleaned_at が返る
    - 境界値: 記録が一件もない場合 → null を返す
  - _Requirements: 5_

- [ ] 8. presentation層: CleaningRecordController と PartController
  - File: backend/src/main/kotlin/com/cleaningapp/cleaningrecord/presentation/{CleaningRecordController,PartController}.kt
  - 生成スタブ実装、UUIDヘッダでスコープ限定、バリデーション
  - Purpose: HTTP入出力
  - **Red**: `CleaningRecordControllerTest.kt` を先に作成し失敗を確認（`@WebMvcTest` + `@MockkBean` を使用）
  - **テスト対象** (`@WebMvcTest` + MockK):
    - 正常系: POST /cleaning-records → 201 と記録リストを返す
    - 正常系: GET /cleaning-records?partId=xxx → 200 と絞り込み結果を返す
    - 正常系: DELETE /cleaning-records/{id} → 204
    - 異常系: 存在しない recordId → 404
    - 正常系: X-User-Id ヘッダなし → 400 Bad Request
  - _Leverage: shared/web, shared/exception_
  - _Requirements: 1, 2, 3, 4_

## フェーズ3: モバイル（Expo / React Native）

- [ ] 9. features/cleaning-record: types.ts と CleaningRecordRepository
  - File: mobile/src/features/cleaning-record/{types.ts, repositories/CleaningRecordRepository.ts}
  - 生成クライアントをラップした記録CRUD・パーツ管理の実装
  - Purpose: データアクセス層
  - **Red**: `repositories/__tests__/CleaningRecordRepository.test.ts` を先に作成し `npx jest src/features/cleaning-record/repositories` で失敗を確認（APIクライアントをモック）
  - **テスト対象**:
    - 正常系: `createRecords(partIds)` → APIクライアントの `createCleaningRecords` が正しい引数で呼ばれる
    - 正常系: `listRecords({ partId })` → 絞り込みパラメータがAPIに渡る
    - 正常系: `deleteRecord(id)` → APIクライアントの `deleteCleaningRecord` が呼ばれる
  - _Leverage: mobile/src/shared/api_
  - _Requirements: 1, 2, 3, 4_

- [ ] 10. features/cleaning-record/usecases
  - File: mobile/src/features/cleaning-record/usecases/{LogCleaningUseCase,EditRecordUseCase,DeleteRecordUseCase,ManagePartUseCase}.ts
  - Purpose: React非依存のビジネスロジック
  - **Red**: `usecases/__tests__/*.test.ts` を先に作成し `npx jest src/features/cleaning-record/usecases` で失敗を確認
  - **テスト対象**:
    - 正常系: `LogCleaningUseCase` → repository.createRecords が partIds で呼ばれ、記録リストを返す
    - 正常系: `DeleteRecordUseCase` → repository.deleteRecord が recordId で呼ばれる
    - 正常系: `ManagePartUseCase.addPart` → repository.createPart が呼ばれ Part を返す
  - _Requirements: 1, 3, 4_

- [ ] 11. features/cleaning-record/hooks: useLogCleaning / useCleaningHistory
  - File: mobile/src/features/cleaning-record/hooks/{useLogCleaning,useCleaningHistory}.ts
  - TanStack Queryで履歴取得、useMutationで記録/修正/削除の楽観的更新とロールバック
  - Purpose: UIとユースケースの橋渡し
  - **Red**: `hooks/__tests__/useCleaningHistory.test.ts` を先に作成し `npx jest src/features/cleaning-record/hooks` で失敗を確認
  - **テスト対象** (`@tanstack/react-query` の `QueryClient` をテスト用に生成):
    - 正常系: `useCleaningHistory` → 取得した履歴リストを返す
    - 正常系: `useLogCleaning.mutate(partIds)` → 記録後に cleaning-records クエリが invalidate される
    - 異常系: 記録失敗時に楽観的更新がロールバックされる
  - _Leverage: TanStack Query_
  - _Requirements: 1, 2, 3_

- [ ] 12. features/cleaning-record/components: PartChecklist と CleaningTimeline
  - File: mobile/src/features/cleaning-record/components/{PartChecklist,CleaningTimeline,RecordButton}.tsx
  - 複数パーツの一括チェックUI（3タップ目標）、新しい順タイムライン・絞り込み・修正/削除操作
  - Purpose: 視覚操作によるUI
  - **Red**: `components/__tests__/*.test.tsx` を先に作成し `npx jest src/features/cleaning-record/components` で失敗を確認
  - **テスト対象** (`@testing-library/react-native`):
    - 正常系: `PartChecklist` → パーツ名が表示され、チェックすると選択済みリストに追加される
    - 正常系: `PartChecklist` → 「記録」ボタン押下で useLogCleaning.mutate が選択済みpartIds で呼ばれる
    - 正常系: `CleaningTimeline` → 記録が新しい順に表示される
    - 正常系: `CleaningTimeline` → 削除ボタン押下で useCleaningHistory.deleteRecord が呼ばれる
  - _Leverage: mobile/src/shared/components_
  - _Requirements: 1, 2, 3_

- [ ] 13. app/(tabs)/history と エリア詳細画面の組み込み
  - File: mobile/app/(tabs)/history.tsx, mobile/app/area/[areaId].tsx
  - 履歴タブ、エリアタップ→パーツ一覧→記録の導線
  - Purpose: 画面の組み立て
  - **Red**: `app/(tabs)/__tests__/history.test.tsx` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: 履歴タブに CleaningTimeline が表示される
    - 正常系: エリア詳細画面に PartChecklist が表示される
  - _Requirements: 1, 2_

- [ ] 14. CleaningStatusCapability と DI配線
  - File: mobile/src/capabilities/CleaningStatusCapability.ts, mobile/src/features/cleaning-record/repositories/CleaningStatusCapabilityImpl.ts, mobile/src/shared/app-root/providers/di.ts
  - heatmap・notificationが掃除状態を読むための境界インターフェースと実装の配線
  - Purpose: feature間依存の逆転
  - **Red**: `capabilities/__tests__/CleaningStatusCapability.test.ts` を先に作成し失敗を確認
  - **テスト対象**:
    - 正常系: `CleaningStatusCapabilityImpl.getOverdueAreas()` → Repository を経由して期限超過エリアリストを返す
    - 正常系: `CleaningStatusCapabilityImpl.getLastCleanedAt(areaId)` → 最終掃除日時を返す
    - 境界値: 記録がない場合 → null を返す
  - _Requirements: 5_

## フェーズ4: 統合

- [ ] 15. E2E統合とCI組み込み
  - File: .github/workflows/ci.yml（既存に追記）
  - エリア選択→一括チェック→記録→履歴確認→1件修正→最終掃除日時更新 のE2E、CIにテスト・アーキテストを組み込む
  - Purpose: 一連の体験とCI自動化
  - _Requirements: All_
