/** `YYYY/MM/DD` 形式（端末ローカル時刻）にフォーマットする。 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/** `HH:mm` 形式（端末ローカル時刻）にフォーマットする。 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** `YYYY/MM/DD HH:mm` 形式（端末ローカル時刻）にフォーマットする。 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}
