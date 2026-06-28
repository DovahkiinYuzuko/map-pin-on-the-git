# Git Log to Markdown Sync Script Specification

## 1. Overview
This script is a Node.js CLI tool designed to extract structured data from Git commit logs and automatically generate/synchronize the history section of branch-specific documents (e.g., `docs/git-descriptions/[branch-name].md`).
It treats the Git commit history as the "Single Source of Truth." Commits that do not exist in Git will be automatically removed from the document, ensuring a fully tracked and synchronized state.

## 2. Operating Environment
- Node.js: v18 or higher
- OS: Platform-independent (Windows / macOS / Linux)
- Dependencies: Uses only Node.js standard modules (`child_process`, `fs`, `path`). No additional package installation is required.

## 3. File Structure and Format Specification
The file header (branch name and overview) retains the content manually defined by human developers or AI agents. The script exclusively overwrites the commit history section located after a specific delimiter. If the description or overview is missing, AI agents must ask the user for permission before generating it, and they are allowed to write the description only after obtaining explicit approval.

### 3.1 Template Structure
```markdown
# [Branch Name]
## Overview
[Description of the branch's purpose. This area is protected from script overwrites.]

### `[Hash]`
- **Date:** YYYY-MM-DD HH:mm:ss
- **Commit Message:** [Subject]
- **Description:** [Extracted from body]
- **Constraint:** [Extracted from body]
- **Rejected:** [Extracted from body]
- **Chosen:** [Extracted from body]
```

## 4. Functional Requirements

### 4.1 Header Protection and Parsing
- If the target file exists, the script searches for the `--- START GIT LOG ---` placeholder.
- Lines above this placeholder (title, overview, etc.) are kept in memory while the log generation process runs.
- If the file does not exist or the delimiter is not found, a default header is automatically generated based on the current branch name.

### 4.2 Git Log Extraction and Structured Parsing
- Executes the `git log` command internally to retrieve commit information in the following format:
  `git log --format="%h|%ad|%s|%b" --date=format:"%Y-%m-%d %H:%M:%S"`
- Uses regular expressions to detect the following prefixes in the retrieved commit body (`%b`) and maps them to their respective fields:
  - `[Description]` or `Description:`
  - `[Reason: Constraint]` or `Constraint:`
  - `[Reason: Rejected]` or `Rejected:`
  - `[Reason: Chosen]` or `Chosen:`
- For minor commits lacking explicit prefixes, the entire body is treated as a fallback for the "Description" field. Fields without corresponding prefixes in the commit body will not be output to the Markdown file.

### 4.3 Synchronization and Writing
- Combines the protected header information with the newly constructed Markdown text from the latest Git logs.
- Performs a synchronous write (`fs.writeFileSync`) to the target file, guaranteeing a state that perfectly matches the Git history.

## 5. Error Handling
- If the execution environment is not a Git repository, it outputs an error message and terminates the process with an abnormal exit code (`process.exit(1)`).
- If the repository is completely clean (zero commits), the history section is processed as empty.