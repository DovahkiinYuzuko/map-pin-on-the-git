---
name: map-pin-on-the-git
description: Use this skill whenever writing a git commit message, executing a git commit, or managing git repository logs. It guides the agent to include structured reasons (Constraint, Rejected, Chosen).
---

# Map-Pin-On-The-Git

## Goal
Maintain the Git commit history as the Single Source of Truth (SSOT) and execute the synchronization script to update the documentation.

## Instructions
- Always read and follow `references/specification.md` for detailed functional requirements and formatting rules.
- Analyze the staged changes to understand the technical impact.
- Formulate a structured commit message including `Constraint:`, `Rejected:`, and `Chosen:` prefixes, then execute the git commit.
- After committing, ensure to run the following command to synchronize the document:
  - Command: `node scripts/sync-git-log.js`
- Verify that the latest log is correctly reflected in `docs/git-descriptions/[branch-name].md` under the `--- START GIT LOG ---` delimiter.

## Constraints
- Never include sensitive user information or credentials in the commit message.
- Strictly adhere to the rules and template structures defined in `references/specification.md`.