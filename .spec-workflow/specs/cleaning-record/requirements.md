# Requirements Document — 掃除記録（cleaning-record）

## Introduction

掃除記録機能は、ユーザーが「どのパーツをいつ掃除したか」を記録・閲覧する機能。エリア（部屋・家具）のパーツ一覧から複数を一括チェックして記録し、履歴を時系列で振り返れる。

この機能が更新するパーツの最終掃除日時（lastCleanedAt）は、ヒートマップの色計算と通知機能の判定の源泉となる。他featureへはCapability経由で掃除状態を公開する。

## Alignment with Product Vision

- **掃除記録ログ**（Key Features 3）: エリアタップ → パーツ一覧 → チェックで記録、履歴を時系列で確認
- **エリア別タイムライン**（Key Features 4）: パーツごとの最終掃除日時と推奨周期を管理
- **操作速度 3タップ以内**（Success Metrics）: 複数パーツの一括チェックで記録を最小操作にする
- **視覚的直感性**（Product Principle 4）: チェック操作中心で、テキスト入力を最小化する

## Requirements

### Requirement 1: 掃除の記録（複数パーツ一括）

**User Story:** ユーザーとして、エリアのパーツを複数まとめてチェックして掃除を記録したい。「ついでに掃除した箇所」を一度に登録するため。

#### Acceptance Criteria

1. WHEN ユーザーがエリア（部屋・家具）を選択する THEN システムは そのエリアに紐付くパーツ一覧を表示する SHALL
2. WHEN ユーザーが複数のパーツにチェックを入れて記録を実行する THEN システムは チェックされた各パーツに対し現在時刻の掃除記録（CleaningRecord）を作成する SHALL
3. WHEN 掃除記録が作成される THEN システムは 対象パーツの最終掃除日時（lastCleanedAt）を記録時刻で更新する SHALL
4. WHEN 記録を登録する THEN システムは 掃除日時を常に現在時刻とする（登録時のバックデートは行わない）SHALL

### Requirement 2: 履歴タイムラインの閲覧

**User Story:** ユーザーとして、過去の掃除記録を時系列で見たい。いつ何を掃除したか振り返るため。

#### Acceptance Criteria

1. WHEN ユーザーが履歴画面を開く THEN システムは 掃除記録を新しい順のタイムラインで表示する SHALL
2. WHEN ユーザーがエリアまたはパーツで絞り込む THEN システムは 該当する記録のみをタイムラインに表示する SHALL
3. WHEN 各記録を表示する THEN システムは パーツ名・所属エリア・掃除日時を表示する SHALL

### Requirement 3: 記録の修正・削除

**User Story:** ユーザーとして、間違えた記録を直したり消したりしたい。誤記録を残さず、実態に合わせるため。

#### Acceptance Criteria

1. WHEN ユーザーが既存の記録の日時を修正する THEN システムは その記録の掃除日時を更新する SHALL
2. WHEN ユーザーが記録を削除する THEN システムは その記録を削除する SHALL
3. WHEN 記録が修正・削除される THEN システムは 対象パーツの最終掃除日時を、残った記録のうち最新の日時に再計算する SHALL
4. IF パーツの記録がすべて削除された THEN システムは そのパーツの最終掃除日時を未掃除（null）に戻す SHALL

### Requirement 4: パーツと推奨周期の管理

**User Story:** ユーザーとして、パーツの追加・編集と推奨周期の設定をしたい。自分の掃除リズムに合わせて管理するため。

#### Acceptance Criteria

1. WHEN ユーザーがエリアにパーツを追加する THEN システムは 名前と推奨周期（日数）を持つパーツを作成する SHALL
2. WHEN ユーザーがパーツの名前または推奨周期を編集する THEN システムは 変更を保存する SHALL
3. WHEN ユーザーがパーツを削除する THEN システムは そのパーツと紐付く掃除記録をまとめて削除する SHALL
4. WHEN floorplan-editor がエリア種別に応じてプリセットパーツをseedした THEN システムは それらを通常のパーツとして扱い、編集・削除できる SHALL

### Requirement 5: 掃除状態の他featureへの公開（Capability）

**User Story:** （システム要件）heatmap・notification featureが、掃除状態を参照できるようにする。色計算・通知判定の源泉とするため。

#### Acceptance Criteria

1. WHEN heatmap がエリアの掃除状態を要求する THEN システムは CleaningStatusCapability 経由で各パーツの最終掃除日時・推奨周期を返す SHALL
2. WHEN notification が期限超過エリアを要求する THEN システムは 推奨周期を超過したエリア一覧を返す SHALL
3. WHEN 他featureがこの情報を参照する THEN システムは cleaning-record の内部実装に直接依存させず、Capability/Port インターフェース経由とする SHALL

## Non-Functional Requirements

### Code Architecture and Modularity

- structure.md の構成に従い、`features/cleaning-record/` に components/hooks/usecases/repositories を分離する
- `CleaningStatusCapability`（モバイル）/ `CleaningStatusPort`（バックエンド）を、使う側（heatmap・notification）の視点で定義し、実装を cleaning-record 側に置く
- Part エンティティは floorplan-editor と共有する。掃除記録（CleaningRecord）は cleaning-record が所有する

### Performance

- 履歴タイムラインはページング等で、記録が増えても初期表示を高速に保つ
- 最終掃除日時の再計算（修正・削除時）は対象パーツのみに限定する

### Security

- 掃除記録は初回発行UUIDに紐付け、他ユーザーのデータにアクセスできない

### Reliability

- 一括チェック記録のうち一部が失敗した場合も、整合性を保つ（全件成功か、失敗を明示してリトライ可能にする）
- パーツの最終掃除日時は、常に記録（CleaningRecord）と整合する（記録の追加・修正・削除後に再計算）

### Usability

- 一括チェックによる記録は3タップ以内を目指す
- ダークモード（システム設定追従）に対応する
