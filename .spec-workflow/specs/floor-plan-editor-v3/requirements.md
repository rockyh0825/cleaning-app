# Requirements Document — 間取りエディタ v3（編集の完結性: 削除・リサイズ・リネーム・サイズ指定）

## Introduction

v1（表示・追加・永続化）、v2（ドラッグ移動・部屋リサイズ・パン/ズーム・UIリッチ化）を経て、間取りエディタは「作って動かす」ことはできるようになった。しかし振り返りの結果、**一度作ったものを直す・消す**ための操作が画面に存在しないことが分かった。

1. **消せない**: 部屋・家具の削除は v1 要件（1.6 / 2.5）に含まれ、ユースケース（`DeleteRoomUseCase` / `DeleteFurnitureUseCase`）と API（`DELETE /rooms/{roomId}` / `DELETE /furniture/{furnitureId}`）まで実装済みだが、v1・v2 のどのタスクにも**画面への導線**が含まれておらず、ユーザーは削除できない
2. **家具の大きさを変えられない**: リサイズは v2 で部屋のみ対応した。家具は常に 1×1 固定で追加され、変更手段がない（`PATCH /furniture/{furnitureId}` は gridW/gridH 対応済み）
3. **名前を直せない**: 部屋・家具の名称は追加時に決めたきり変更できない（`RoomUpdate` / `FurnitureUpdate` は name 対応済み）
4. **追加時にサイズを選べない**: 部屋は 4×4、家具は 1×1 の固定サイズで追加される。「広いリビング」「小さい棚」を最初から表現できず、追加→リサイズの2度手間になる
5. **家具が重なって追加される**: 部屋の追加は v2 で空き位置探索に対応したが、家具は固定位置に追加されるため、追加するたびに重なる

本 spec はこれらを解消し、「追加したものをいつでも直せる・消せる」編集体験を完結させる。API 契約（DELETE / PATCH）は対応済みのため、**バックエンド・OpenAPI の変更は行わず、モバイルのみで完結する**。

## Alignment with Product Vision

- **シンプルファースト**（Product Principle 1）: 追加時サイズ指定と空き配置で「追加→即完成」に近づけ、後始末の操作を減らす
- **視覚的直感性**（Product Principle 4）: 削除・リサイズ・リネームを選択中の対象に対する直接操作として提供する
- **間取り設定完了率 > 70%**（Success Metrics）: 「間違えても直せる」ことが試行錯誤のハードルを下げ、完了率に寄与する

## Requirements

### Requirement 1: 部屋の削除

**User Story:** ユーザーとして、不要になった部屋を削除したい。間取りの変更（模様替え・引っ越し）に追従するため。

#### Acceptance Criteria

1. WHEN ユーザーが選択中の部屋に対して削除操作を実行する THEN システムは 確認ダイアログを表示する SHALL
2. WHEN 確認ダイアログで削除する旨を表示する THEN システムは その部屋に紐付く家具・パーツ・掃除記録もまとめて削除されることを明示する SHALL
3. WHEN ユーザーが削除を確定する THEN システムは `DELETE /rooms/{roomId}` を呼び、キャンバスから部屋を除去する SHALL
4. IF 削除の保存が失敗する THEN システムは 楽観的更新をロールバックし、失敗を通知する SHALL

### Requirement 2: 家具の削除

**User Story:** ユーザーとして、部屋の中の不要な家具を削除したい。実際に家具を手放したときに間取りを合わせるため。

#### Acceptance Criteria

1. WHEN ユーザーが部屋詳細画面で選択中の家具に対して削除操作を実行する THEN システムは 確認ダイアログを表示する SHALL
2. WHEN ユーザーが削除を確定する THEN システムは `DELETE /furniture/{furnitureId}` を呼び、部屋から家具を除去する SHALL
3. IF 削除の保存が失敗する THEN システムは 楽観的更新をロールバックし、失敗を通知する SHALL

### Requirement 3: 家具のリサイズ

**User Story:** ユーザーとして、家具の大きさをグリッド単位で調整したい。ベッドとサイドテーブルの大小関係を表現するため。

#### Acceptance Criteria

1. WHEN ユーザーが選択中の家具のリサイズハンドルをドラッグする THEN システムは グリッド単位で幅・高さを変更する SHALL
2. IF リサイズ後のサイズが最小サイズ（1×1）を下回る THEN システムは 最小サイズで止める SHALL
3. IF リサイズ後に家具が所属部屋の矩形外にはみ出す THEN システムは 部屋境界内に収まるようクランプする SHALL
4. WHEN リサイズが確定する THEN システムは `PATCH /furniture/{furnitureId}` でサイズを保存し、失敗時はロールバックする SHALL

### Requirement 4: 部屋・家具の名称変更

**User Story:** ユーザーとして、部屋や家具の名前を後から変更したい。入力ミスの修正や用途変更（書斎→子供部屋）に対応するため。

#### Acceptance Criteria

1. WHEN ユーザーが選択中の部屋・家具に対して名称変更操作を実行する THEN システムは 現在の名称を初期値とした編集UIを表示する SHALL
2. IF 入力された名称が空または空白のみ THEN システムは 保存を拒否する SHALL
3. WHEN ユーザーが名称を確定する THEN システムは `PATCH /rooms/{roomId}` または `PATCH /furniture/{furnitureId}` の name で保存し、失敗時はロールバックする SHALL

### Requirement 5: 追加時のサイズ指定

**User Story:** ユーザーとして、部屋や家具を追加する時点で大きさを選びたい。追加→リサイズの2度手間を省くため。

#### Acceptance Criteria

1. WHEN ユーザーが部屋を追加する THEN システムは サイズを指定できるUI（グリッド単位のステッパー等）を追加フォーム内に提供する SHALL
2. WHEN サイズ未指定で部屋を追加する THEN システムは 既定サイズ（4×4）で追加する SHALL
3. WHEN ユーザーがプリセット家具を選択する THEN システムは プリセットごとに定義された既定サイズ（例: ベッド 2×3、棚 1×1）を初期値として提示する SHALL
4. WHEN 家具のサイズを指定して追加する THEN システムは 指定サイズが所属部屋に収まるようクランプして追加する SHALL

### Requirement 6: 家具追加時の空き配置

**User Story:** ユーザーとして、家具を追加したとき既存の家具と重ならないでほしい。追加のたびに手で退避させるのは面倒なため。

#### Acceptance Criteria

1. WHEN ユーザーが家具を追加する THEN システムは 所属部屋内（部屋内相対座標系）で既存家具と重ならない空き位置を探索して配置する SHALL
2. IF 部屋内に空き位置が無い THEN システムは 相対座標 (0,0) に配置し、重なりを許容する SHALL
3. WHEN 家具を配置する THEN システムは 部屋内相対座標系で座標を保存する SHALL（部屋の絶対座標を相対座標として渡さない）

## Out of Scope

- **部屋種別（RoomType）の変更**: `RoomUpdate` に type フィールドが無く、バックエンド・OpenAPI の変更が必要になるため本 spec では扱わない（将来の backend 込み spec で検討）
- **掃除記録の追加・履歴画面**: cleaning-record spec のタスク13・15 として既に管理されているため本 spec には含めない
- **複数選択・一括削除、Undo/Redo**: 編集体験の発展形として将来検討

## Non-Functional Requirements

### Code Architecture and Modularity

- 削除・リネームの mutation は既存の `buildXxxMutationOptions` パターン（楽観的更新＋ロールバック）に従い `useFloorPlan` に追加する
- 家具リサイズは v2 の `ResizeHandle` / `useDragToGrid` を再利用し、家具用の重複実装を作らない
- 空き位置探索は既存の `findFreePosition`（`shared/utils/grid.ts`）を部屋内相対座標系で再利用する

### Reliability

- 削除・リネーム・リサイズの保存失敗時は楽観的更新をロールバックし、編集前の状態に戻す
- 削除は破壊的操作のため、必ず確認ダイアログを挟む（誤タップで即消えない）

### Usability

- 削除・名称変更は選択中の対象から2タップ以内で到達できる
- 破壊的操作（削除）のボタンは danger トークンで視覚的に区別する
- ライト・ダーク両テーマに対応する（shared/theme トークンのみ参照）
