# 技術スタック

## プロジェクト種別

一人暮らし向け掃除管理モバイルアプリ。クライアント（React Native）とバックエンドAPI（Spring Boot）の2層構成。API契約ファーストで開発する。

## コア技術

### 言語・ランタイム

| レイヤー | 言語 | バージョン |
|---|---|---|
| モバイルアプリ | TypeScript | 5.x |
| バックエンドAPI | Kotlin | 1.9.x |
| API仕様 | OpenAPI | 3.1 |

### 主要フレームワーク・ライブラリ

- **Expo (React Native)**: クロスプラットフォームモバイル開発。iOS/Android両対応、OTAアップデート対応
- **Spring Boot 3.x**: バックエンドAPIフレームワーク。Java 21 LTS上で動作
- **PostgreSQL**: プライマリデータストア。UUIDを主キーに使用
- **OpenAPI Generator**: APIスキーマからクライアントコード・サーバースタブを自動生成

### アプリケーションアーキテクチャ

```
[React Native (Expo)]
        ↓ HTTP/JSON (OpenAPI 3.1準拠)
[Spring Boot API]
        ↓
[PostgreSQL]
```

- モバイルはUI専任、ビジネスロジックはすべてAPIサーバー側に置く
- APIはREST設計。状態管理はサーバー側で行う
- クライアントとサーバー間の契約はOpenAPI 3.1スキーマが唯一の正本

### データストレージ

- **主DB**: PostgreSQL（UUID主キー、住所情報は一切格納しない）
- **キャッシュ**: 当面なし（将来的にRedisを検討）
- **モバイルローカル**: AsyncStorage（オフライン対応・設定保存用途のみ）

### セキュリティ方針

- 住所・位置情報（GPS）は**一切保存しない**
- 全テーブルの主キーは`UUID v4`を使用（連番IDは使用しない）
- ユーザー認証: JWT（将来実装。現時点は単一ユーザー前提でローカル保存のトークン）
- HTTPS必須。平文HTTP通信は禁止

## 開発環境

### ビルド・開発ツール

- **パッケージ管理 (モバイル)**: npm / Expo CLI
- **パッケージ管理 (バックエンド)**: Gradle (Kotlin DSL)
- **ホットリロード**: Expo Go / Expo Dev Client
- **APIモック**: OpenAPI仕様から自動生成（prism等）

### コード品質ツール

| 用途 | モバイル | バックエンド |
|---|---|---|
| 静的解析 | ESLint + TypeScript strict | Detekt |
| フォーマット | Prettier | ktlint |
| テスト | Jest + React Native Testing Library | JUnit 5 + MockK |
| APIテスト | — | RestAssured |

### バージョン管理・ブランチ戦略

**ブランチ戦略**: GitHub Flow（シンプルなmain + feature branch）

```
main
├── feature/<issue番号>-<短い説明>   例: feature/42-heatmap-component
├── fix/<issue番号>-<短い説明>       例: fix/58-uuid-null-pointer
└── chore/<説明>                     例: chore/update-dependencies
```

- `main`は常にデプロイ可能な状態を維持する
- `feature/`ブランチはmainから分岐し、PRでmainにマージする
- 直接mainへのコミットは禁止（hotfixも必ずPRを通す）
- ブランチ名はすべて小文字・ハイフン区切り

### PRサイズガイドライン

| サイズ | 差分行数の目安 | 方針 |
|---|---|---|
| Small | ~200行 | 理想。レビュー当日中に完了できる |
| Medium | ~500行 | 許容。スコープを明確にすること |
| Large | 500行超 | 原則避ける。やむを得ない場合は事前に分割方針を共有 |

- 1 PR = 1つの目的（機能追加・バグ修正・リファクタリングを混在させない）
- テストコードはプロダクトコードと同じPRに含める
- OpenAPIスキーマ変更を含むPRは、クライアント・サーバー両方の変更を同梱する

### コードレビュー方針

- セルフレビュー後にPRを作成する（差分を自分で一読する）
- CIが通ったことを確認してからレビュー依頼する
- レビューコメントはConventional Comments形式を推奨

## デプロイ・配布

- **モバイル**: Expo Application Services (EAS) でビルド → App Store / Google Play
- **バックエンド**: コンテナ（Docker）でデプロイ。ターゲット環境はクラウド（VPS or PaaS）
- **DBマイグレーション**: Flyway（バックエンドと同じGradleプロジェクト内で管理）

## 技術的制約・要件

### パフォーマンス

- ヒートマップ描画: 100エリアを含む間取りでも60fps を維持
- API応答: p95で500ms以内（通常のCRUD操作）

### 互換性

- iOS 16以上 / Android 12以上
- 端末ローカルのダークモード対応（システム設定に追従）

## 技術的判断の記録（ADR）

### ADR-001: React Native (Expo) を選択した理由

**決定**: モバイルクライアントにReact Native (Expo)を採用する

**背景**: iOS/Android両対応が必要。ネイティブ（Swift/Kotlin）とクロスプラットフォームを検討した。

**理由**:
- 一人開発のため、iOS/Android両方のネイティブコードを維持するコストが高い
- Expoのマネージドワークフローにより、証明書・ビルド設定の複雑さを抽象化できる
- TypeScriptによる型安全性でバックエンドとの契約を型で表現できる
- React Native Skiaによりカスタムヒートマップ描画が可能

**トレードオフ**: ネイティブAPIへのアクセスに制限があるケースがあるが、本アプリの要件（間取り図操作・掃除記録）には十分

---

### ADR-002: Spring Boot + Kotlin を選択した理由

**決定**: バックエンドAPIにSpring Boot 3.x + Kotlinを採用する

**背景**: バックエンドフレームワークとして、Node.js (Express/NestJS)、Go、Spring Bootを検討した。

**理由**:
- Kotlinのnull安全性とデータクラスにより、APIモデルを安全かつ簡潔に記述できる
- Spring Boot 3.xとJava 21のVirtual Threadsにより、非同期処理の複雑さなしに高スループットを実現
- springdocによりOpenAPI 3.1スキーマを自動生成でき、契約ファースト開発と親和性が高い
- PostgreSQL + Spring Data JPAの組み合わせで型安全なDB操作が可能

**トレードオフ**: JVMの起動時間がNode.jsより遅い。ただし常駐型サービスのため問題なし

---

### ADR-003: OpenAPI 3.1 契約ファースト開発を採用した理由

**決定**: APIスキーマ（OpenAPI 3.1）を起点にし、コード生成でクライアント・スタブを作成する

**背景**: API設計はコードファースト（実装→スキーマ生成）とスキーマファースト（スキーマ→コード生成）の2アプローチがある。

**理由**:
- スキーマが唯一の真実（Single Source of Truth）となり、クライアント・サーバー間の齟齬を防ぐ
- OpenAPI Generatorによりモバイル用TypeScriptクライアントとSpring Bootスタブを自動生成でき、手書きのAPI呼び出しコードを排除
- スキーマ変更がPRで明示的にレビューできる（実装の変更に埋もれない）

**トレードオフ**: スキーマ→コード生成のツールチェーン設定が初期に必要。ただし一度設定すれば継続的なメリットを享受できる

---

### ADR-004: PostgreSQL + UUID主キーを選択した理由

**決定**: データベースはPostgreSQL、全テーブルの主キーにUUID v4を使用する

**理由 (PostgreSQL)**:
- jsonb型サポートにより、間取り図の構造データをスキーマレスに保存できる
- 将来のフルテキスト検索（掃除ログ検索）に対応可能

**理由 (UUID主キー)**:
- 連番IDと異なり、エンドポイントURLから総件数・登録順が推測できない（セキュリティ）
- 将来のデータ移行・マージ時に衝突リスクが低い
- プライバシーポリシーとして「住所情報不保存」を掲げており、IDも推測可能な形にしない設計方針に合致

**トレードオフ**: UUID v4はランダムなため、B-treeインデックスの断片化が発生しやすい。データ量が増えた場合はUUID v7（タイムスタンプ付き）への移行を検討する
