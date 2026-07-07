# Requirements Document — 掃除ヒートマップ（heatmap）

## Introduction

掃除ヒートマップは、間取り図上の各エリア（部屋・家具）を掃除状態に応じて色分けし、「どこが汚れているか・どこを優先して掃除すべきか」を一目で把握できるようにする機能。本アプリの中核価値（視覚的・直感的な掃除管理）を担う。

エリアの色は、cleaning-record が管理するパーツの最終掃除日時（lastCleanedAt）と推奨周期から算出した「経過割合」に基づいて決まる。エリア内で最も期限超過しているパーツの状態がそのエリアの色になる（product.md「ヒートマップ仕様」）。

heatmap は自身でデータを持たず、floor-plan（部屋・家具の配置）と cleaning-record（掃除状態）を **Capability 経由**で参照する読み取り専用の feature。境界インターフェース `FloorPlanCapability` / `CleaningStatusCapability` は既に定義済みで、本 feature がそれらの最初の消費者となる。

なお閾値のカスタマイズ（グローバル設定・エリア/パーツ単位の個別上書き）は別 spec に切り出す。本 spec では既定閾値（緑0〜80% / 黄80〜100% / 赤100%超）を固定値として扱う。

## Alignment with Product Vision

- **掃除ヒートマップ**（Key Features 2）: 推奨周期に対する経過割合でエリアの色が変化し、視覚的に優先度を把握
- **エリア別タイムライン**（Key Features 4）: パーツごとの最終掃除日時・推奨周期を状態の源泉とする
- **視覚的直感性**（Product Principle 4）: テキストではなく色でエリア状態を提示する
- **アプリ内モニタリング**（Monitoring & Visibility）: ヒートマップで全エリアの掃除状態を一覧表示
- **一人用特化・プライバシー優先**: 表示対象は初回発行UUIDに紐付く自分のデータのみ

## Requirements

### Requirement 1: エリアの色判定ロジック

**User Story:** ユーザーとして、各エリアが「どのくらい掃除すべきか」に応じて色分けされてほしい。優先度を色で判断するため。

#### Acceptance Criteria

1. WHEN あるパーツの経過割合を求める THEN システムは `(現在時刻 − 最終掃除日時) / 推奨周期` を経過割合として算出する SHALL
2. WHEN パーツに掃除記録が無い（最終掃除日時が null）THEN システムは そのパーツの経過割合を最大（期限超過・最優先）として扱う SHALL
3. WHEN エリアの色を決める THEN システムは そのエリアに属するパーツのうち**最も経過割合が高いパーツ**の状態をエリアの色とする SHALL
4. WHEN 経過割合から色を決める THEN システムは 既定閾値に従い 緑（0〜80%）／黄（80〜100%）／赤（100%超）に分類する SHALL
5. IF エリアにパーツが1つも存在しない THEN システムは そのエリアを「状態なし（中立色）」として扱い、緑〜赤の判定対象から除外する SHALL

### Requirement 2: 間取り図上でのヒートマップ表示

**User Story:** ユーザーとして、間取り図そのものの上で各エリアの掃除状態を色で見たい。配置と状態を同時に把握するため。

#### Acceptance Criteria

1. WHEN ユーザーがヒートマップを開く THEN システムは floor-plan の部屋・家具の配置を保ったまま、各エリアを Requirement 1 の色で塗り分けて表示する SHALL
2. WHEN 部屋が家具を内包している THEN システムは 部屋と家具それぞれをエリアとして個別に色分けする SHALL
3. WHEN 色だけでは判別しづらい状況（アクセシビリティ）THEN システムは 色以外の手掛かり（凡例・ラベル等）を併せて提供する SHALL
4. WHEN 表示する THEN システムは ダークモード（システム設定追従）でも視認性を保つ配色とする SHALL

### Requirement 3: エリアの詳細への導線

**User Story:** ユーザーとして、気になるエリアをタップしてその掃除記録・パーツ一覧へ進みたい。色で気づいてすぐ記録するため。

#### Acceptance Criteria

1. WHEN ユーザーがヒートマップ上のエリアをタップする THEN システムは そのエリアの詳細（パーツ一覧・掃除記録）画面へ遷移する SHALL
2. WHEN 掃除記録が更新されて画面に戻る THEN システムは 該当エリアの色を最新状態に反映する SHALL

### Requirement 4: データ取得と feature 境界

**User Story:** （システム要件）heatmap が floor-plan・cleaning-record の内部実装に直接依存しないようにする。feature 間の結合を疎に保つため。

#### Acceptance Criteria

1. WHEN 部屋・家具の配置を取得する THEN システムは `FloorPlanCapability.getRooms(userId)` 経由で取得する SHALL
2. WHEN 掃除状態を取得する THEN システムは `CleaningStatusCapability`（getOverdueAreas / getLastCleanedAt）経由で取得する SHALL
3. WHEN heatmap が他 feature の情報を参照する THEN システムは floor-plan / cleaning-record を直接 import せず、Capability インターフェース経由のみとする SHALL

### Requirement 5: 状態の鮮度と空状態

**User Story:** ユーザーとして、記録直後に色が更新され、部屋が無いときも迷わない表示であってほしい。表示と実態を一致させるため。

#### Acceptance Criteria

1. WHEN ヒートマップを表示するたび THEN システムは 現在時刻を基準に経過割合を再計算する（時間経過で黄→赤へ推移する）SHALL
2. WHEN 掃除記録・部屋・家具が変化した THEN システムは キャッシュを無効化し最新のデータで色を再計算する SHALL
3. IF 部屋が1つも登録されていない THEN システムは 空状態（間取り作成への導線）を表示する SHALL

## Non-Functional Requirements

### Code Architecture and Modularity

- structure.md の構成に従い、`features/heatmap/` に components / hooks / usecases を配置する。heatmap は読み取り専用のため repositories は持たず、Capability を DI 経由で受け取る
- 色判定ロジック（経過割合 → 色）は純粋関数として usecases に置き、閾値をパラメータ化して後続の「閾値カスタマイズ」spec が差し込めるようにする
- floor-plan / cleaning-record への直接 import を禁止し、`FloorPlanCapability` / `CleaningStatusCapability` 経由に限定する

### Performance

- 全エリアの経過割合計算はエリア数に対して線形で完結させ、間取り表示のフレーム落ちを避ける
- Capability からのデータ取得は react-query でキャッシュし、掃除記録の変更時のみ無効化する

### Security

- 表示対象は初回発行UUIDに紐付く自分のデータのみ。他ユーザーのエリア状態は取得・表示しない

### Reliability

- 最終掃除日時が null・推奨周期が未設定・パーツ0件などの欠損データでも破綻せず、定義済みの中立/最優先状態にフォールバックする
- 色判定は境界値（ちょうど80%・ちょうど100%）を仕様どおり一貫して分類する（テストで担保）

### Usability

- 色の意味を示す凡例を提供し、色覚特性に配慮して色のみに依存しない
- ダークモード（システム設定追従）に対応する

## Out of Scope（本 spec では扱わない）

- 閾値のカスタマイズ（グローバル既定の変更・エリア/パーツ単位の個別上書き）→ 別 spec「閾値カスタマイズ」で扱う
- 掃除周期に基づくリマインダー通知 → 別 spec「リマインダー（notification）」で扱う
- 週・月単位の統計ダッシュボード（product.md Future Vision）
