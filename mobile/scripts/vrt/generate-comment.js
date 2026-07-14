#!/usr/bin/env node
// reg-cli の JSON レポート（reg.json）から、PR に貼る VRT 結果コメント（Markdown）を生成する。
// CI（mobile-ci.yml の e2e ジョブ）から次のように呼ばれる:
//   node scripts/vrt/generate-comment.js --reg reg.json --repo owner/repo --sha <sha> \
//     --pr-dir pr-123 --run-url <url> --maestro-status success --baseline-sha <sha>

const fs = require('fs');

// PR コメントの upsert（sticky 化)に使う識別マーカー
const MARKER = '<!-- e2e-vrt-report -->';

const IMG_WIDTH = 240;

function rawUrl(repo, sha, path) {
    return `https://raw.githubusercontent.com/${repo}/${sha}/${path}`;
}

function img(url, width = IMG_WIDTH) {
    return `<img src="${url}" width="${width}">`;
}

function generateComment(input) {
    const { reg, repo, sha, prDir, runUrl, maestroStatus, baselineSha } = input;
    const actualUrl = (name) => rawUrl(repo, sha, `${prDir}/actual/${name}`);
    const diffUrl = (name) => rawUrl(repo, sha, `${prDir}/diff/${name}`);
    const baselineUrl = (name) => rawUrl(repo, sha, `baseline/${name}`);

    const lines = [];
    lines.push(MARKER);
    lines.push('## 📸 E2E スクリーンショット / ビジュアルリグレッション');
    lines.push('');

    if (maestroStatus !== 'success') {
        lines.push(
            '> [!WARNING]',
            '> 一部の E2E フローが失敗したため、スクリーンショットが欠けている可能性があります。',
            '',
        );
    }

    // ベースライン未生成（初回）: 比較結果ではなく撮影結果の一覧として見せる
    if (!baselineSha) {
        lines.push(
            'ベースライン未生成のため比較はスキップしました（main での E2E 実行後に自動生成されます）。',
            '',
            `[workflow run](${runUrl})`,
            '',
            '### 撮影されたスクリーンショット',
            '',
        );
        const all = [...reg.newItems, ...reg.passedItems];
        for (const name of all) {
            lines.push(`**${name}**`, '', img(actualUrl(name)), '');
        }
        return lines.join('\n');
    }

    const summary = [
        `❌ 差分 ${reg.failedItems.length}`,
        `✚ 新規 ${reg.newItems.length}`,
        `− 欠損 ${reg.deletedItems.length}`,
        `✔ 一致 ${reg.passedItems.length}`,
    ].join(' / ');
    lines.push(summary, '');
    lines.push(`[workflow run](${runUrl}) ・ ベースライン: \`${baselineSha}\``, '');

    if (reg.failedItems.length > 0) {
        lines.push('### ❌ 差分あり', '');
        for (const name of reg.failedItems) {
            lines.push(`#### ${name}`, '');
            lines.push('| baseline | actual | diff |');
            lines.push('|---|---|---|');
            lines.push(
                `| ${img(baselineUrl(name))} | ${img(actualUrl(name))} | ${img(diffUrl(name))} |`,
            );
            lines.push('');
        }
    }

    if (reg.newItems.length > 0) {
        lines.push('### ✚ 新規（ベースラインに存在しない画像）', '');
        for (const name of reg.newItems) {
            lines.push(`**${name}**`, '', img(actualUrl(name)), '');
        }
    }

    if (reg.deletedItems.length > 0) {
        lines.push('### − 欠損（今回撮影されなかった画像）', '');
        lines.push('フローの失敗・スクリーンショット削除などが原因の可能性があります。', '');
        for (const name of reg.deletedItems) {
            lines.push(`- ${name}`);
        }
        lines.push('');
    }

    if (reg.passedItems.length > 0) {
        lines.push('<details>');
        lines.push(`<summary>✔ ベースラインと一致した画像 (${reg.passedItems.length})</summary>`, '');
        for (const name of reg.passedItems) {
            lines.push(`**${name}**`, '', img(actualUrl(name)), '');
        }
        lines.push('</details>');
    }

    return lines.join('\n');
}

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 2) {
        const key = argv[i].replace(/^--/, '');
        args[key] = argv[i + 1];
    }
    return args;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const reg = JSON.parse(fs.readFileSync(args.reg, 'utf8'));
    const md = generateComment({
        reg,
        repo: args.repo,
        sha: args.sha,
        prDir: args['pr-dir'],
        runUrl: args['run-url'],
        maestroStatus: args['maestro-status'],
        baselineSha: args['baseline-sha'] || null,
    });
    process.stdout.write(md);
}

if (require.main === module) {
    main();
}

module.exports = { generateComment, MARKER };
