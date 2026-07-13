import { diffCalendarDays, formatRelativeDate } from '../relativeDate';

// テストは端末タイムゾーンに依存しないよう、すべてローカル時刻コンストラクタで日時を作る
// （new Date(y, m, d, h, min) はローカルタイムゾーンで解釈される）
const NOW = new Date(2026, 6, 13, 12, 0); // 2026/07/13 12:00

describe('diffCalendarDays', () => {
    it('returns_zero_for_same_calendar_day_even_if_hours_differ', () => {
        // Arrange
        const from = new Date(2026, 6, 13, 0, 0);
        const to = new Date(2026, 6, 13, 23, 59);

        // Act & Assert
        expect(diffCalendarDays(from, to)).toBe(0);
    });

    it('returns_one_when_dates_straddle_midnight_even_if_only_minutes_apart', () => {
        // Arrange: 23:50 → 翌 0:10（実時間は20分だが暦日は1日またぐ）
        const from = new Date(2026, 6, 12, 23, 50);
        const to = new Date(2026, 6, 13, 0, 10);

        // Act & Assert
        expect(diffCalendarDays(from, to)).toBe(1);
    });

    it('returns_negative_days_when_from_is_after_to', () => {
        // Arrange
        const from = new Date(2026, 6, 15, 10, 0);
        const to = new Date(2026, 6, 13, 10, 0);

        // Act & Assert
        expect(diffCalendarDays(from, to)).toBe(-2);
    });

    it('counts_days_across_month_boundaries', () => {
        // Arrange: 6/30 → 7/13 は 13 日
        const from = new Date(2026, 5, 30, 12, 0);
        const to = new Date(2026, 6, 13, 12, 0);

        // Act & Assert
        expect(diffCalendarDays(from, to)).toBe(13);
    });
});

describe('formatRelativeDate', () => {
    it('returns_kyou_for_a_datetime_on_the_same_calendar_day', () => {
        // Arrange
        const date = new Date(2026, 6, 13, 0, 5);

        // Act & Assert
        expect(formatRelativeDate(date, NOW)).toBe('今日');
    });

    it('returns_kinou_for_a_datetime_on_the_previous_calendar_day', () => {
        // Arrange: 実時間では12時間強しか離れていなくても暦日基準で「昨日」
        const date = new Date(2026, 6, 12, 23, 30);

        // Act & Assert
        expect(formatRelativeDate(date, NOW)).toBe('昨日');
    });

    it('returns_n_nichi_mae_for_2_to_6_days_ago', () => {
        // Arrange & Act & Assert: 境界値（2日・6日）
        expect(formatRelativeDate(new Date(2026, 6, 11, 12, 0), NOW)).toBe('2日前');
        expect(formatRelativeDate(new Date(2026, 6, 7, 12, 0), NOW)).toBe('6日前');
    });

    it('returns_n_shuukan_mae_for_7_to_29_days_ago', () => {
        // Arrange & Act & Assert: 境界値（7日=1週間・13日=1週間・14日=2週間・29日=4週間）
        expect(formatRelativeDate(new Date(2026, 6, 6, 12, 0), NOW)).toBe('1週間前');
        expect(formatRelativeDate(new Date(2026, 5, 30, 12, 0), NOW)).toBe('1週間前');
        expect(formatRelativeDate(new Date(2026, 5, 29, 12, 0), NOW)).toBe('2週間前');
        expect(formatRelativeDate(new Date(2026, 5, 14, 12, 0), NOW)).toBe('4週間前');
    });

    it('returns_n_kagetsu_mae_for_30_to_364_days_ago', () => {
        // Arrange & Act & Assert: 境界値（30日=1ヶ月・364日=12ヶ月）
        expect(formatRelativeDate(new Date(2026, 5, 13, 12, 0), NOW)).toBe('1ヶ月前');
        expect(formatRelativeDate(new Date(2025, 6, 14, 12, 0), NOW)).toBe('12ヶ月前');
    });

    it('returns_n_nen_mae_for_365_days_or_more_ago', () => {
        // Arrange & Act & Assert: 境界値（365日=1年・730日=2年）
        expect(formatRelativeDate(new Date(2025, 6, 13, 12, 0), NOW)).toBe('1年前');
        expect(formatRelativeDate(new Date(2024, 6, 13, 12, 0), NOW)).toBe('2年前');
    });

    it('clamps_future_datetimes_to_kyou', () => {
        // Arrange: 端末時計のズレ等で未来になった日時は「今日」に丸める
        const tomorrow = new Date(2026, 6, 14, 9, 0);
        const nextMonth = new Date(2026, 7, 13, 9, 0);

        // Act & Assert
        expect(formatRelativeDate(tomorrow, NOW)).toBe('今日');
        expect(formatRelativeDate(nextMonth, NOW)).toBe('今日');
    });
});
