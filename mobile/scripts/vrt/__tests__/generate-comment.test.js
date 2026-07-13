const { generateComment, MARKER } = require('../generate-comment');

// reg-cli の -J 出力（reg.json）と CI コンテキストから PR コメント Markdown を生成する
const baseInput = () => ({
    reg: {
        failedItems: ['heatmap-01-overdue-red.png'],
        newItems: ['new-screen.png'],
        deletedItems: ['gone-screen.png'],
        passedItems: ['ok-01.png', 'ok-02.png'],
    },
    repo: 'owner/repo',
    sha: 'deadbeef00',
    prDir: 'pr-123',
    runUrl: 'https://github.com/owner/repo/actions/runs/999',
    maestroStatus: 'success',
    baselineSha: 'abc1234',
});

describe('generateComment', () => {
    test('includes_sticky_marker_so_the_comment_can_be_upserted', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain(MARKER);
        expect(MARKER).toMatch(/^<!--.*-->$/);
    });

    test('renders_failed_item_with_baseline_actual_and_diff_images', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain(
            'https://raw.githubusercontent.com/owner/repo/deadbeef00/baseline/heatmap-01-overdue-red.png',
        );
        expect(md).toContain(
            'https://raw.githubusercontent.com/owner/repo/deadbeef00/pr-123/actual/heatmap-01-overdue-red.png',
        );
        expect(md).toContain(
            'https://raw.githubusercontent.com/owner/repo/deadbeef00/pr-123/diff/heatmap-01-overdue-red.png',
        );
    });

    test('lists_new_items_with_actual_image_only', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain(
            'https://raw.githubusercontent.com/owner/repo/deadbeef00/pr-123/actual/new-screen.png',
        );
        expect(md).not.toContain('pr-123/diff/new-screen.png');
    });

    test('lists_deleted_items_as_missing_without_images', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain('gone-screen.png');
        expect(md).not.toContain('pr-123/actual/gone-screen.png');
        expect(md).not.toContain('pr-123/diff/gone-screen.png');
    });

    test('collapses_passed_items_inside_details_section', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        const detailsBody = md.slice(md.indexOf('<details>'), md.indexOf('</details>'));
        expect(detailsBody).toContain('pr-123/actual/ok-01.png');
        expect(detailsBody).toContain('pr-123/actual/ok-02.png');
    });

    test('shows_summary_counts_for_each_category', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain('差分 1');
        expect(md).toContain('新規 1');
        expect(md).toContain('欠損 1');
        expect(md).toContain('一致 2');
    });

    test('shows_first_run_notice_when_baseline_is_missing', () => {
        // Arrange
        const input = baseInput();
        input.baselineSha = null;
        input.reg = {
            failedItems: [],
            newItems: ['ok-01.png', 'ok-02.png'],
            deletedItems: [],
            passedItems: [],
        };

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain('ベースライン未生成');
        expect(md).not.toContain('差分あり');
        // 初回はすべて newItems になるが「新規」ではなく撮影結果の一覧として見せる
        expect(md).toContain('pr-123/actual/ok-01.png');
    });

    test('warns_when_maestro_run_failed_because_screenshots_may_be_partial', () => {
        // Arrange
        const input = baseInput();
        input.maestroStatus = 'failure';

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain('フローが失敗');
    });

    test('links_workflow_run_and_shows_baseline_sha', () => {
        // Arrange
        const input = baseInput();

        // Act
        const md = generateComment(input);

        // Assert
        expect(md).toContain('https://github.com/owner/repo/actions/runs/999');
        expect(md).toContain('abc1234');
    });
});
