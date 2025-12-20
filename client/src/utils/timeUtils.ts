/**
 * 時間関連のユーティリティ関数
 */

/**
 * 時刻文字列を分に変換
 * @param time 時刻文字列 (HH:MM)
 * @returns 分数
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 分を時刻文字列に変換
 * @param minutes 分数
 * @returns 時刻文字列 (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * 分を表示用の時間文字列に変換
 * @param minutes 分数
 * @returns 表示用文字列 (例: "2h30m" or "3h")
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

/**
 * 時刻を15分単位にスナップ
 * @param minutes 分数
 * @returns 15分単位にスナップされた分数
 */
export function snapToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

