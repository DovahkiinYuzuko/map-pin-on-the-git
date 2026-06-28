# Map Pin On The Git

GitのコミットログをSSOT（信頼できる唯一の情報源）としてドキュメントを自動生成し、思考プロセスを管理するAIエージェント用スキルです。/ An AI agent skill to automatically generate documentation from Git commit logs as the Single Source of Truth (SSOT) and manage the architectural thinking process.

![Node.js](https://img.shields.io/badge/Node.js-v18.0.0+-339933?style=flat-square&logo=node.js&logoColor=white)

[日本語](#日本語) | [English](#english)

## 日本語

### 開発の目的
開発時における意思決定や思考プロセス（制約、不採用案、採用案）をGitのコミットログとして集約し、後からドキュメントとして容易に参照できるようにすることを目的としています。
過去の選択肢や断念した理由を記録として残すことで、将来的なコードの再確認や、他のAIエージェントへのスムーズなコンテキスト共有（コード監査など）を可能にします。

### 特徴
- **コミットログの自動同期**: 同期スクリプトを実行することで、コミット履歴を自動的にブランチごとのMarkdownドキュメントへ反映します。
- **思考プロセスの構造化**: コミット本文から `Constraint`（制約）、`Rejected`（不採用理由）、`Chosen`（採用理由）といった要素を自動で解析・分類して抽出します。
- **堅牢な処理**: 外部依存パッケージを使用せず、Node.jsの標準モジュールのみで動作します。スラッシュを含むブランチ名（`feature/xxx` など）の階層ディレクトリ自動生成や、環境に依存しないベースブランチ判定に対応しています。

### 生成されるドキュメントの仕様
本スキルが実行されると、以下の構成でMarkdownファイルが自動生成・更新されます。ファイル上部のヘッダー情報（タイトルおよびOverview）は保持され、スクリプト実行によって履歴部分のみが同期されます。

```markdown
# [ブランチ名]
## Overview
[ブランチの目的。このエリアは手動やAIによる編集が保護されます。]

--- START GIT LOG ---
### `[コミットハッシュ]`
- **Date:** YYYY-MM-DD HH:mm:ss
- **Commit Message:** [コミットメッセージの件名]
- **Description:** [本文から抽出された説明、または接頭辞がない場合の本文全体]
- **Constraint:** [本文から抽出された制約条件]
- **Rejected:** [本文から抽出された不採用理由]
- **Chosen:** [本文から抽出された採用理由]
```

### 導入方法
プロジェクトに導入するには、以下のコマンドを実行してください。

```bash
npx skills add DovahkiinYuzuko/map-pin-on-the-git
```

### 使い方

#### 1. AIエージェントで実行する場合
Antigravity環境などの対応エージェントでは、以下のスラッシュコマンドを入力することで、明示的にこのスキルを呼び出すことができます。

```text
/map-pin-on-the-git
```

#### 2. 手動でスクリプトを実行する場合
手動でドキュメントの同期スクリプトを実行したい場合は、インストールされたスクリプトのパスを指定して実行します。ドキュメントは実行ディレクトリの `docs/git-descriptions/[ブランチ名].md` に自動生成されます。

```bash
node .agents/skills/map-pin-on-the-git/scripts/sync-git-log.js
```

### コミットメッセージの記述例
手動でコミットメッセージを書く際は、以下のように本文にキーワードを含めることで、生成されるドキュメントに構造化されて反映されます。

```text
feat: ユーザー認証機能の追加

Description: セッションベースの認証フローを実装しました。
Constraint: 外部の認証プロバイダは使用せず、ローカルのデータベースのみで完結させる必要があります。
Rejected: JWT認証の導入を検討しましたが、セッション無効化の要件を満たすための実装複雑化を避けるため今回は不採用としました。
Chosen: 実装のシンプルさと要件適合性を考慮し、Redisベースのセッション管理を採用しました。
```

### ライセンス
MIT License (c) 2026 Yuzuko Underson

---

## English

### Purpose
The purpose of this tool is to centralize the decision-making and thinking processes (Constraints, Rejected ideas, and Chosen solutions) during development into Git commit logs, making them easily referenceable as documentation later. 
By preserving the history of past choices and the reasons for abandoning alternatives, it enables future code verification and seamless context sharing with other AI agents (such as code auditing).

### Features
- **Automatic Commit Log Synchronization**: Running the synchronization script automatically reflects the commit history into Markdown documentation for each branch.
- **Structured Architectural Thinking**: Automatically parses and categorizes elements like `Constraint`, `Rejected`, and `Chosen` from the commit body.
- **Robust Processing**: Operates solely on Node.js standard modules with zero external dependencies. Supports automatic creation of hierarchical directories for branch names containing slashes (e.g., `feature/xxx`) and environment-agnostic base branch detection.

### Output Specification
When this skill is executed, Markdown files are automatically generated and updated with the following structure. The header section at the top (Title and Overview) is protected, and only the history section is overwritten and synchronized.

```markdown
# [Branch Name]
## Overview
[Description of the branch's purpose. This area is protected from script overwrites.]

--- START GIT LOG ---
### `[Hash]`
- **Date:** YYYY-MM-DD HH:mm:ss
- **Commit Message:** [Subject]
- **Description:** [Extracted from body, or the entire body if no prefixes exist]
- **Constraint:** [Extracted from body]
- **Rejected:** [Extracted from body]
- **Chosen:** [Extracted from body]
```

### Installation
To install this skill to your project, run the following command:

```bash
npx skills add DovahkiinYuzuko/map-pin-on-the-git
```

### Usage

#### 1. Executing via AI Agent
In supported agent environments like Antigravity, you can explicitly invoke this skill by typing the following slash command:

```text
/map-pin-on-the-git
```

#### 2. Executing the Script Manually
If you wish to run the documentation synchronization script manually, execute it by specifying the path to the installed script. Documents will be automatically generated at `docs/git-descriptions/[branch-name].md` relative to the execution directory.

```bash
node .agents/skills/map-pin-on-the-git/scripts/sync-git-log.js
```

### Commit Message Example
When writing a commit message manually, incorporating the following keywords in the body will result in structured documentation output:

```text
feat: Add user authentication feature

Description: Implemented a session-based authentication flow.
Constraint: Must be completed entirely using the local database without relying on external auth providers.
Rejected: Considered JWT authentication, but rejected it to avoid implementation complexity for session invalidation requirements.
Chosen: Adopted Redis-based session management for simplicity and alignment with the requirements.
```

### License
MIT License (c) 2026 Yuzuko Underson