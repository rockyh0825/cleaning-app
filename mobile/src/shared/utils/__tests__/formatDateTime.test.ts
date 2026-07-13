import { formatDate, formatDateTime, formatTime } from "../formatDateTime";

describe("formatDateTime", () => {
  it("formats_date_as_slash_separated_date_and_colon_separated_time", () => {
    // Arrange: ローカル時刻で 2024/06/15 10:30
    const date = new Date(2024, 5, 15, 10, 30);

    // Act
    const result = formatDateTime(date);

    // Assert
    expect(result).toBe("2024/06/15 10:30");
  });

  it("zero_pads_single_digit_month_and_day", () => {
    // Arrange: 1桁の月・日（1月5日）
    const date = new Date(2024, 0, 5, 12, 34);

    // Act
    const result = formatDateTime(date);

    // Assert
    expect(result).toBe("2024/01/05 12:34");
  });

  it("zero_pads_midnight_hours_and_minutes", () => {
    // Arrange: 0時0分
    const date = new Date(2024, 2, 3, 0, 0);

    // Act
    const result = formatDateTime(date);

    // Assert
    expect(result).toBe("2024/03/03 00:00");
  });

  it("formats_end_of_year_boundary", () => {
    // Arrange: 大晦日 23:59
    const date = new Date(2024, 11, 31, 23, 59);

    // Act
    const result = formatDateTime(date);

    // Assert
    expect(result).toBe("2024/12/31 23:59");
  });

  it("formats_start_of_year_boundary", () => {
    // Arrange: 元日 0:00
    const date = new Date(2025, 0, 1, 0, 0);

    // Act
    const result = formatDateTime(date);

    // Assert
    expect(result).toBe("2025/01/01 00:00");
  });
});

describe("formatDate", () => {
  it("formats_date_part_only_with_zero_padding", () => {
    // Arrange
    const date = new Date(2026, 0, 5, 12, 34);

    // Act & Assert
    expect(formatDate(date)).toBe("2026/01/05");
  });
});

describe("formatTime", () => {
  it("formats_time_part_only_with_zero_padding", () => {
    // Arrange
    const date = new Date(2026, 6, 13, 9, 5);

    // Act & Assert
    expect(formatTime(date)).toBe("09:05");
  });

  it("formats_midnight_as_double_zero", () => {
    // Arrange
    const date = new Date(2026, 6, 13, 0, 0);

    // Act & Assert
    expect(formatTime(date)).toBe("00:00");
  });
});
