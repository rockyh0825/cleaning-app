# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Worktree ルール

他の作業との干渉を防ぐため、**作業開始時に必ず worktree を作成し、作業終了時に必ず削除**してください。

### 作業開始時

```bash
git worktree add /tmp/worktree-<feature-name> -b <branch-name>
```

- worktree のパスは `/tmp/worktree-<feature-name>` の形式を推奨
- ブランチ名はブランチ戦略（`tech.md` 参照）に従う

### 作業終了時

```bash
git worktree remove /tmp/worktree-<feature-name>
```

- PR マージ後やタスク完了後は必ず remove する
- ロックされている場合は `git worktree remove --force -f` を使用する

---

## 実装の流れとTDDのルール

すべての新機能開発およびバグ修正において、テスト駆動開発（TDD）を厳格に適用してください。対応するテストが存在しない状態でプロダクションコードを先に書いてはいけません。

### テストの方針

- **正常系・境界値・異常系**を網羅し、動作保証として機能するテストを厚めに書く
- 単体テストを基本とし、複数コンポーネントをまたぐ振る舞いは結合テストで補う
- テスト名は「振る舞いを説明する文」にする（例: `returns_empty_list_when_no_items_exist`）
- テストの構造は **Arrange → Act → Assert** の順で書く
- 実装の詳細ではなく**入力と出力（振る舞い）**をテストする

### TDDサイクルの実行手順

1. **Red（テストの作成）**:
    - 適切なテストファイルに、まずテストケース（1つずつ）を記述する。
    - すぐに Bash ツールでテストコマンドを実行し、テストが**「失敗する（Red）」**ことを確認する。
    - （注意：失敗の確認をスキップしてはいけない。テストが正しく機能しているか検証するため）
2. **Green（最小限の実装）**:
    - 失敗したテストを通過させるために、*必要最小限*のプロダクションコードを書く。
    - **テスト自体を変更してはいけない**。必ずプロダクションコード側を修正すること。
    - 再度テストを実行し、テストが通過する（Green）ことを確認する。
3. **Refactor（リファクタリング）**:
    - 全テストがグリーンの状態でのみリファクタリングを行う。
    - コードの可読性や設計を整える。重複の除去・命名改善・メソッド抽出など。
    - 再度テストを実行し、デグレードが起きていないことを確認する。

## ステアリングドキュメント

設計・アーキテクチャ・規約・プロダクト方針はここを参照する（重複して記載しない）：

- [プロダクト概要・機能・方針](.spec-workflow/steering/product.md)
- [技術スタック・ADR・ブランチ戦略・PRルール](.spec-workflow/steering/tech.md)
- [ディレクトリ構成・レイヤー責務・命名規則・Capabilityパターン](.spec-workflow/steering/structure.md)

## Commands

### モバイル (`mobile/`)

```bash
npm install                  # 依存インストール
npx expo start               # 開発サーバー起動（Expo Go）
npx expo start --dev-client  # Expo Dev Client使用時
npx jest                     # 全テスト実行
npx jest path/to/test.ts     # 単一テスト実行
npx eslint src/ app/         # 静的解析
npx prettier --write src/    # フォーマット
```

### バックエンド (`backend/`)

```bash
./gradlew bootRun            # 開発サーバー起動
./gradlew test               # 全テスト実行
./gradlew test --tests "com.cleaningapp.module.ClassName.methodName"  # 単一テスト
./gradlew detekt             # 静的解析
./gradlew ktlintFormat       # フォーマット
```

### Git フック（初回セットアップ）

```bash
git config core.hooksPath .githooks   # pre-push フックを有効化
```

`.githooks/pre-push` により、`backend/**` に変更がある場合のみ ktlint・detekt・テスト（PostgreSQL 起動中の場合）を自動実行してプッシュをブロックする。

### APIクライアント生成

```bash
# モバイル（TypeScript クライアント）
npm run generate:api             # mobile/ ディレクトリで実行

# バックエンド（Kotlin Spring Boot スタブ）
./gradlew openApiGenerate        # backend/ ディレクトリで実行

# 両方まとめて生成
./scripts/generate-api-client.sh
```

生成物はコミット対象外（`.gitignore`）：
- モバイル: `mobile/src/shared/api/`
- バックエンド: `backend/build/generated/`
