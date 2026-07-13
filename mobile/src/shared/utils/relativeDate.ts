const DAY_MS = 24 * 60 * 60 * 1000;

/** ローカルタイムゾーンでその日の 0:00 を返す */
function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * ローカル暦日ベースの日数差（to - from）を返す純粋関数。
 * 「昨日 23:50 → 今日 0:10」のように実時間が短くても暦日をまたげば 1 になる。
 * 経過秒数ではなく「今日／昨日」の直感に合わせるための基準。
 */
export function diffCalendarDays(from: Date, to: Date): number {
  return Math.round(
    (startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / DAY_MS,
  );
}

/**
 * 日時を「今日」「昨日」「3日前」のような日本語の相対表記にする純粋関数。
 * 現在時刻は引数注入（now）でテスト可能にする。
 *
 * - 同じ暦日 → 今日 / 1日前 → 昨日 / 2〜6日前 → N日前
 * - 7〜29日前 → N週間前 / 30〜364日前 → Nヶ月前 / 365日以上 → N年前
 * - 未来の日時（端末時計のズレ等）→「今日」に丸める
 */
export function formatRelativeDate(date: Date, now: Date): string {
  const days = diffCalendarDays(date, now);
  if (days <= 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}
