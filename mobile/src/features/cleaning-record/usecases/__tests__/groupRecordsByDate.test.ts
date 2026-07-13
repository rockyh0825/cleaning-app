import { groupRecordsByDate } from "../groupRecordsByDate";
import type { CleaningRecord } from "../../types";

const NOW = new Date(2026, 6, 13, 12, 0); // 2026/07/13 12:00

const makeRecord = (
  id: string,
  cleanedAt: Date,
  overrides: Partial<CleaningRecord> = {},
): CleaningRecord => ({
  id,
  partId: "part-1",
  cleanedAt,
  note: null,
  createdAt: cleanedAt,
  updatedAt: cleanedAt,
  ...overrides,
});

describe("groupRecordsByDate", () => {
  it("returns_empty_list_when_no_records_exist", () => {
    // Act & Assert
    expect(groupRecordsByDate([], NOW)).toEqual([]);
  });

  it("groups_records_of_the_same_calendar_day_into_one_section", () => {
    // Arrange: 同じ暦日の朝と夜
    const records = [
      makeRecord("r-morning", new Date(2026, 6, 13, 8, 0)),
      makeRecord("r-night", new Date(2026, 6, 13, 21, 0)),
    ];

    // Act
    const sections = groupRecordsByDate(records, NOW);

    // Assert
    expect(sections).toHaveLength(1);
    expect(sections[0].data.map((r) => r.id)).toEqual(["r-night", "r-morning"]);
  });

  it("splits_records_into_sections_at_midnight_boundary", () => {
    // Arrange: 23:59 と 0:01 は別セクション
    const records = [
      makeRecord("r-before", new Date(2026, 6, 12, 23, 59)),
      makeRecord("r-after", new Date(2026, 6, 13, 0, 1)),
    ];

    // Act
    const sections = groupRecordsByDate(records, NOW);

    // Assert
    expect(sections).toHaveLength(2);
    expect(sections[0].data[0].id).toBe("r-after");
    expect(sections[1].data[0].id).toBe("r-before");
  });

  it("orders_sections_and_records_within_section_by_newest_first", () => {
    // Arrange: 入力順はバラバラ
    const records = [
      makeRecord("r-old", new Date(2026, 6, 10, 9, 0)),
      makeRecord("r-today-early", new Date(2026, 6, 13, 7, 0)),
      makeRecord("r-yesterday", new Date(2026, 6, 12, 12, 0)),
      makeRecord("r-today-late", new Date(2026, 6, 13, 18, 0)),
    ];

    // Act
    const sections = groupRecordsByDate(records, NOW);

    // Assert: セクションは新しい日付順、セクション内も新しい順
    expect(sections.map((s) => s.data.map((r) => r.id))).toEqual([
      ["r-today-late", "r-today-early"],
      ["r-yesterday"],
      ["r-old"],
    ]);
  });

  it("labels_sections_as_kyou_kinou_or_absolute_date_with_relative_suffix", () => {
    // Arrange
    const records = [
      makeRecord("r-today", new Date(2026, 6, 13, 8, 0)),
      makeRecord("r-yesterday", new Date(2026, 6, 12, 8, 0)),
      makeRecord("r-old", new Date(2026, 6, 10, 8, 0)),
    ];

    // Act
    const sections = groupRecordsByDate(records, NOW);

    // Assert: 今日/昨日は相対のみ、それ以前は絶対日付に相対を併記する
    expect(sections.map((s) => s.title)).toEqual([
      "今日",
      "昨日",
      "2026/07/10（3日前）",
    ]);
  });

  it("excludes_records_with_invalid_cleaned_at_and_keeps_grouping_the_rest", () => {
    // Arrange: API マッパーの想定外等で Invalid Date が混ざっても
    // 「NaN/NaN/NaN（NaN年前）」見出しのセクションを作らない
    const records = [
      makeRecord("r-valid", new Date(2026, 6, 13, 8, 0)),
      makeRecord("r-invalid", new Date(NaN)),
    ];

    // Act
    const sections = groupRecordsByDate(records, NOW);

    // Assert: 不正レコードだけ除外し、正常レコードは通常どおりグルーピングする
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("今日");
    expect(sections[0].data.map((r) => r.id)).toEqual(["r-valid"]);
  });

  it("assigns_unique_keys_per_calendar_day", () => {
    // Arrange
    const records = [
      makeRecord("r-1", new Date(2026, 6, 13, 8, 0)),
      makeRecord("r-2", new Date(2026, 6, 12, 8, 0)),
    ];

    // Act
    const sections = groupRecordsByDate(records, NOW);

    // Assert: SectionList の key として使える一意なキーを持つ
    expect(sections.map((s) => s.key)).toEqual(["2026-07-13", "2026-07-12"]);
  });
});
