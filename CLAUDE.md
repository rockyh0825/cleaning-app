# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 学習方針（このプロジェクトの最重要ルール）

このプロジェクトはオーナーの学習を目的としている。学習スタイルは「**Claudeが実装し、オーナーがレビューし、後で study-notes に振り返りを書いて理解を深める**」形式。

**コードを書く分担**
- **実装はClaudeが書く（書き手）。オーナーはレビュー役**
- Claudeはコードを書いたら、オーナーがレビューで理解できるよう設計意図を必ず説明する
- 振り返りは study-notes（`/Users/rockyh/dev/study-notes`）にオーナーが書く。Claudeはそのための材料（要点）を残す

**コードを書くときに必ず含めること（レビューと振り返りの材料）**
- **設計意図の解説**: 「なぜこの設計・書き方にするか」をコードと一緒に説明する
- **代替案の提示**: 他の書き方・ライブラリの選択肢とトレードオフを示す
- **理解確認の問いかけ**: 節目で「ここはどう動くか」等を問い、レビューを促す
- **公式ドキュメントへのリンク**: 関連する公式ドキュメント・一次情報へのリンクを添える
- 学習価値が高い箇所は、後で study-notes に書けるよう要点を整理して示す

オーナーが「自分で書きたい」と言ったときのみ、ガイド役（オーナーが書く）に切り替える。

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
npx eslint src/              # 静的解析
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

### APIクライアント生成

```bash
./scripts/generate-api-client.sh   # api/openapi.yaml からクライアントコード生成
```

生成物は `mobile/src/shared/api/` に出力される。このディレクトリはコミット対象外（`.gitignore`）。
