/**
 * Git Log to Markdown Synchronizer (All Branches)
 * Usage: node scripts/sync-git-log.js [output-directory]
 * Default directory: docs/git-descriptions/
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DELIMITER = '--- START GIT LOG ---';

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

function getBaseBranch() {
    try {
        const output = execSync('git branch --format="%(refname:short)"').toString();
        const branches = output.split('\n').map(b => b.trim()).filter(Boolean);
        if (branches.includes('main')) return 'main';
        if (branches.includes('master')) return 'master';
        return '';
    } catch (e) {
        return '';
    }
}

function getGitLogs(currentBranch) {
    try {
        const baseBranch = getBaseBranch();
        let logCommand = `git log --format="%h|%ad|%s|%b___COMMIT_SEP___" --date=format:"%Y-%m-%d %H:%M:%S"`;
        
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
        const firstLineEnd = block.indexOf('|');
        const secondLineEnd = block.indexOf('|', firstLineEnd + 1);
        const thirdLineEnd = block.indexOf('|', secondLineEnd + 1);

        if (firstLineEnd === -1 || secondLineEnd === -1 || thirdLineEnd === -1) continue;

        const hash = block.substring(0, firstLineEnd).trim();
        const date = block.substring(firstLineEnd + 1, secondLineEnd).trim();
        const subject = block.substring(secondLineEnd + 1, thirdLineEnd).trim();
        const body = block.substring(thirdLineEnd + 1).trim();

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

        const logs = getGitLogs(branchName);
        const markdownLogs = generateMarkdownLog(logs);

        const finalContent = headerContent + (markdownLogs ? '\n' : '') + markdownLogs + '\n';
        fs.writeFileSync(filePath, finalContent, 'utf8');

        console.log(`Sync complete for branch: ${branchName}`);
    }

    console.log('All branches synchronized successfully.');
}

main();