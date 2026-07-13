import type { CleaningRecord } from "../types";
import { formatDate } from "@/shared/utils/formatDateTime";
import {
  diffCalendarDays,
  formatRelativeDate,
} from "@/shared/utils/relativeDate";

/** 履歴タイムラインの日付セクション（SectionList の sections に渡す形） */
export type RecordDateSection = {
  /** ローカル暦日ごとに一意なキー（YYYY-MM-DD） */
  key: string;
  /** セクション見出し。今日／昨日、それ以前は「YYYY/MM/DD（N日前）」 */
  title: string;
  data: CleaningRecord[];
};

/** ローカル暦日のセクションキー（YYYY-MM-DD）を作る */
function dayKeyOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** セクション見出し。直近は相対のみ、それ以前は絶対日付に相対を併記する */
function titleOf(date: Date, now: Date): string {
  const days = diffCalendarDays(date, now);
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  return `${formatDate(date)}（${formatRelativeDate(date, now)}）`;
}

/**
 * 掃除記録をローカル暦日でグルーピングし、新しい日付順のセクション一覧にする純粋関数。
 * セクション内の記録も cleanedAt の降順（新しい順）に並べる。
 * 現在時刻は引数注入（now）でテスト可能にする。
 * cleanedAt が Invalid Date の記録は除外する（「NaN/NaN/NaN（NaN年前）」
 * 見出しを作らないためのフェイルセーフ。API マッパー経由では通常到達しない）。
 */
export function groupRecordsByDate(
  records: CleaningRecord[],
  now: Date,
): RecordDateSection[] {
  const sorted = records
    .filter((record) => !Number.isNaN(record.cleanedAt.getTime()))
    .sort((a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime());

  const sections: RecordDateSection[] = [];
  for (const record of sorted) {
    const key = dayKeyOf(record.cleanedAt);
    const last = sections[sections.length - 1];
    if (last?.key === key) {
      last.data.push(record);
    } else {
      sections.push({
        key,
        title: titleOf(record.cleanedAt, now),
        data: [record],
      });
    }
  }
  return sections;
}
