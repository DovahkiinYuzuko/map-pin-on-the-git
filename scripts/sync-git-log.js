/**
 * Git Log to Markdown Synchronizer (All Branches)
 * Usage: node scripts/sync-git-log.js [output-directory]
 * Default directory: docs/git-descriptions/
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DELIMITER = '--- START GIT LOG ---';
const LOG_FIELDS = ['hash', 'date', 'subject', 'body'];

function isGitRepository() {
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function getAllBranches() {
    try {
        const output = execSync('git branch --format="%(refname:short)"').toString();
        return output.split('\n').map(b => b.trim()).filter(Boolean);
    } catch (e) {
        return [];
    }
}

function getGitLogs(currentBranch, baseBranch) {
    try {
        // フィールド区切りに NUL文字(%x00) を使用。
        // NUL はコミットメッセージに含まれ得ない唯一の文字なので衝突が原理的に起きない。
        let logCommand = `git log --format="%h%x00%ad%x00%s%x00%b%x00___COMMIT_SEP___" --date=format:"%Y-%m-%d %H:%M:%S"`;

        if (baseBranch && currentBranch !== baseBranch) {
            logCommand += ` ${baseBranch}..${currentBranch}`;
        } else {
            logCommand += ` ${currentBranch}`;
        }
        const logOutput = execSync(logCommand, { encoding: 'utf8' });
        return logOutput.split('___COMMIT_SEP___\n').map(block => block.trim()).filter(Boolean);
    } catch (e) {
        return [];
    }
}

function parseCommitBody(bodyText) {
    const fields = {
        description: '',
        constraint: '',
        rejected: '',
        chosen: ''
    };
    if (!bodyText) return fields;
    const lines = bodyText.split('\n');
    let currentField = 'description';
    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const descMatch = trimmed.match(/^\[?(?:Description)\]?:?\s*(.*)$/i);
        const constraintMatch = trimmed.match(/^\[?(?:Reason:\s*)?(?:Constraint)\]?:?\s*(.*)$/i);
        const rejectedMatch = trimmed.match(/^\[?(?:Reason:\s*)?(?:Rejected)\]?:?\s*(.*)$/i);
        const chosenMatch = trimmed.match(/^\[?(?:Reason:\s*)?(?:Chosen)\]?:?\s*(.*)$/i);
        if (descMatch) {
            currentField = 'description';
            fields.description += (fields.description ? '\n' : '') + descMatch[1];
        } else if (constraintMatch) {
            currentField = 'constraint';
            fields.constraint += (fields.constraint ? '\n' : '') + constraintMatch[1];
        } else if (rejectedMatch) {
            currentField = 'rejected';
            fields.rejected += (fields.rejected ? '\n' : '') + rejectedMatch[1];
        } else if (chosenMatch) {
            currentField = 'chosen';
            fields.chosen += (fields.chosen ? '\n' : '') + chosenMatch[1];
        } else {
            fields[currentField] += (fields[currentField] ? '\n' : '') + trimmed;
        }
    }
    return fields;
}

function generateMarkdownLog(logBlocks) {
    let md = '';
    for (const block of logBlocks) {
        if (!block) continue;
        // NUL文字で分割。`|` による indexOf チェーンを廃止。
        const parts = block.split('\0');
        if (parts.length < LOG_FIELDS.length) continue;
        const hash    = parts[0].trim();
        const date    = parts[1].trim();
        const subject = parts[2].trim();
        const body    = parts[3] ?? '';
        const parsedBody = parseCommitBody(body);
        md += `### \`${hash}\`\n`;
        md += `- **Date:** ${date}\n`;
        md += `- **Commit Message:** ${subject}\n`;
        if (parsedBody.description || body === '') {
            md += `- **Description:** ${parsedBody.description || body || 'None'}\n`;
        }
        if (parsedBody.constraint) {
            md += `- **Constraint:** ${parsedBody.constraint}\n`;
        }
        if (parsedBody.rejected) {
            md += `- **Rejected:** ${parsedBody.rejected}\n`;
        }
        if (parsedBody.chosen) {
            md += `- **Chosen:** ${parsedBody.chosen}\n`;
        }
        md += '\n';
    }
    return md.trim();
}

function main() {
    if (!isGitRepository()) {
        console.error('Error: Current directory is not a Git repository.');
        process.exit(1);
    }
    const branches = getAllBranches();
    if (branches.length === 0) {
        console.error('Error: No branches found.');
        process.exit(1);
    }
    // getBaseBranch()を廃止。getAllBranches()の結果を再利用することで git branch の呼び出しを1回に削減。
    const baseBranch = branches.includes('main') ? 'main'
                     : branches.includes('master') ? 'master'
                     : '';
    const outputDir = process.argv[2] || 'docs/git-descriptions';
    const dirPath = path.resolve(outputDir);
    console.log(`Found ${branches.length} branches. Starting synchronization...`);
    for (const branchName of branches) {
        const filePath = path.join(dirPath, `${branchName}.md`);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }
        let headerContent = '';
        if (fs.existsSync(filePath)) {
            const currentContent = fs.readFileSync(filePath, 'utf8');
            const delimiterIndex = currentContent.indexOf(DELIMITER);
            if (delimiterIndex !== -1) {
                headerContent = currentContent.substring(0, delimiterIndex).trim() + '\n';
            } else {
                headerContent = currentContent.trim() + '\n\n';
            }
        } else {
            headerContent = `# ${branchName}\n## Overview\nDescribe the purpose of this branch here.\n\n`;
        }
        if (!headerContent.includes(DELIMITER)) {
            headerContent += `${DELIMITER}\n`;
        }
        const logs = getGitLogs(branchName, baseBranch);
        const markdownLogs = generateMarkdownLog(logs);
        const finalContent = headerContent + (markdownLogs ? '\n' : '') + markdownLogs + '\n';
        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log(`Sync complete for branch: ${branchName}`);
    }
    console.log('All branches synchronized successfully.');
}

main();