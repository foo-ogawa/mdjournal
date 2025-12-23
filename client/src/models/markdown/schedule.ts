/**
 * スケジュール（PLAN/RESULT）のMarkdown操作
 * 
 * 重要: durationはデータとして保持せず、レンダリング時に動的に計算する
 * - 時刻のみのスロット（task が空）は休憩として扱う
 * - ドラッグ後は開始時刻のみ変更し、ソート
 * - 各スロットのduration = 次のスロットの開始時刻 - このスロットの開始時刻
 * - 最後のスロットは1時間
 * - 開始時刻が同じスロットが複数ある場合は、自分より後の別のスロットの開始時刻まで
 */

import type { ScheduleItem } from '../../types';
import { timeToMinutes } from '../../utils';

/**
 * 分を時刻文字列に変換
 */
function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * スケジュールアイテムをMarkdown行として生成（共通関数）
 * 休憩（task が空）は終了時刻行として出力
 */
export function generateScheduleLines(items: ScheduleItem[]): string[] {
  const lines: string[] = [];
  
  for (const item of items) {
    if (!item.task) {
      // 休憩（時刻のみのスロット）は終了時刻行として出力
      lines.push(`* ${item.time}`);
    } else {
      lines.push(`* ${item.time} [${item.project}] ${item.task}`);
      // 詳細説明がある場合はインデントして追加
      if (item.description) {
        const descLines = item.description.split('\n');
        for (const descLine of descLines) {
          lines.push(`  ${descLine}`);
        }
      }
    }
  }
  
  return lines;
}

/**
 * スケジュールアイテムからMarkdownを生成（セクション付き）
 */
export function generateScheduleMarkdown(items: ScheduleItem[], title: string): string {
  const lines = [`## ${title}`, ...generateScheduleLines(items)];
  return lines.join('\n');
}

/**
 * MarkdownからスケジュールアイテムをParse
 * 終了時刻行は休憩スロット（task が空）として扱う
 * 2スペースインデント行は直前のアイテムの詳細説明として扱う
 */
export function parseScheduleMarkdown(markdown: string): ScheduleItem[] {
  const lines = markdown.split('\n');
  const items: ScheduleItem[] = [];
  let currentItem: ScheduleItem | null = null;
  let descriptionLines: string[] = [];

  // 直前のアイテムを保存し、詳細説明を付与
  const savePendingItem = () => {
    if (currentItem) {
      if (descriptionLines.length > 0) {
        currentItem.description = descriptionLines.join('\n');
      }
      items.push(currentItem);
      currentItem = null;
      descriptionLines = [];
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 2スペースインデント行は詳細説明
    if (line.startsWith('  ') && currentItem) {
      descriptionLines.push(line.substring(2));
      continue;
    }
    
    // スケジュール項目を検出 (* 08:00 [P99] タスク名 または - 08:00 [P99] タスク名)
    const itemMatch = line.match(/^[*-]\s+(\d{1,2}:\d{2})\s+\[(\w+)\]\s+(.+)$/);
    if (itemMatch) {
      savePendingItem();
      currentItem = {
        id: `s${Date.now()}-${i}`,
        time: itemMatch[1].padStart(5, '0'),
        project: itemMatch[2],
        task: itemMatch[3].trim(),
      };
      continue;
    }
    
    // 終了時刻のみの行 (* 18:00 または - 18:00) → 休憩スロットとして扱う
    const endTimeMatch = line.match(/^[*-]\s+(\d{1,2}:\d{2})\s*$/);
    if (endTimeMatch) {
      savePendingItem();
      items.push({
        id: `break${Date.now()}-${i}`,
        time: endTimeMatch[1].padStart(5, '0'),
        project: '',
        task: '', // 空のtaskは休憩を示す
      });
    }
  }
  
  // 最後のアイテムを保存
  savePendingItem();
  
  return items;
}

/**
 * レンダリング用のスロット情報を計算
 * durationは動的に計算される
 */
export interface RenderSlot {
  id: string;
  time: string;
  project: string;
  task: string;
  description?: string; // 詳細説明
  duration: number; // 動的に計算
  isBreak: boolean;
  startMinutes: number;
  endMinutes: number;
  top: number;    // パーセント
  height: number; // パーセント
  topPx: number;  // ピクセル
  heightPx: number; // ピクセル
}

/**
 * スケジュールアイテムからレンダリング用スロットを計算
 * durationは次のスロットの開始時刻までの差として計算
 */
export function calculateRenderSlots(
  items: ScheduleItem[],
  startHour: number = 8,
  totalHours: number = 12,
  hourHeight: number = 60
): RenderSlot[] {
  if (items.length === 0) return [];
  
  // 時刻順でソート
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  
  const startMinutes = startHour * 60;
  const totalMinutes = totalHours * 60;
  
  const slots: RenderSlot[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const isBreak = !item.task; // taskが空なら休憩
    
    // 休憩スロットはレンダリングしない（次のスロットの開始時刻を決定するためにのみ使用）
    if (isBreak) continue;
    
    const itemStartMinutes = timeToMinutes(item.time);
    
    // durationを計算: 次のスロット（休憩含む）の開始時刻まで
    let duration = 60; // デフォルト60分
    
    // 自分より後のスロットを探す（開始時刻が同じ場合はスキップ）
    for (let j = i + 1; j < sorted.length; j++) {
      const nextItem = sorted[j];
      const nextStartMinutes = timeToMinutes(nextItem.time);
      if (nextStartMinutes > itemStartMinutes) {
        duration = nextStartMinutes - itemStartMinutes;
        break;
      }
    }
    
    const endMinutes = itemStartMinutes + duration;
    
    slots.push({
      id: item.id,
      time: item.time,
      project: item.project,
      task: item.task,
      description: item.description,
      duration,
      isBreak: false,
      startMinutes: itemStartMinutes,
      endMinutes,
      top: ((itemStartMinutes - startMinutes) / totalMinutes) * 100,
      height: (duration / totalMinutes) * 100,
      topPx: ((itemStartMinutes - startMinutes) / 60) * hourHeight,
      heightPx: (duration / 60) * hourHeight,
    });
  }
  
  return slots;
}

/**
 * 休憩スロットを計算（UI表示用）
 * 休憩は taskが空のスロットとして存在する
 */
export interface BreakSlot {
  id: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  duration: number;
  top: number;
  height: number;
  topPx: number;
  heightPx: number;
}

export function calculateBreakSlots(
  items: ScheduleItem[],
  startHour: number = 8,
  totalHours: number = 12,
  hourHeight: number = 60
): BreakSlot[] {
  if (items.length === 0) return [];
  
  // 時刻順でソート
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  
  const breaks: BreakSlot[] = [];
  const startMinutes = startHour * 60;
  const totalMinutes = totalHours * 60;
  
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    
    // 休憩スロット（taskが空）
    if (!item.task) {
      // 次の通常スロットを探す
      let hasNextTask = false;
      let breakEndMinutes = 0;
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].task) {
          breakEndMinutes = timeToMinutes(sorted[j].time);
          hasNextTask = true;
          break;
        }
      }
      
      // 最後の休憩スロット（次の通常スロットがない）はレンダリングしない
      // これはタイムラインの終了時刻を示すだけ
      if (!hasNextTask) {
        continue;
      }
      
      const breakStartMinutes = timeToMinutes(item.time);
      const duration = breakEndMinutes - breakStartMinutes;
      
      breaks.push({
        id: item.id,
        startTime: item.time,
        endTime: minutesToTime(breakEndMinutes),
        startMinutes: breakStartMinutes,
        endMinutes: breakEndMinutes,
        duration,
        top: ((breakStartMinutes - startMinutes) / totalMinutes) * 100,
        height: (duration / totalMinutes) * 100,
        topPx: ((breakStartMinutes - startMinutes) / 60) * hourHeight,
        heightPx: (duration / 60) * hourHeight,
      });
    }
  }
  
  return breaks;
}

/**
 * タイムライン設定オプション（getTimeRange用）
 */
interface TimeRangeOptions {
  maxHours?: number;         // 最大時間数（デフォルト36時間）
  defaultStartHour?: number; // デフォルト開始時刻（デフォルト8）
  defaultEndHour?: number;   // デフォルト終了時刻（デフォルト20）
}

/**
 * スケジュールアイテムの時間範囲を計算
 * ドラッグで拡張できるよう、開始と終端に余裕を持たせる
 */
export function getTimeRange(
  items: ScheduleItem[],
  options: TimeRangeOptions = {}
): { startHour: number; endHour: number; totalHours: number } {
  const {
    maxHours = 36,
    defaultStartHour = 8,
    defaultEndHour = 20,
  } = options;

  if (items.length === 0) {
    return {
      startHour: defaultStartHour,
      endHour: defaultEndHour,
      totalHours: defaultEndHour - defaultStartHour,
    };
  }
  
  let minMinutes = defaultStartHour * 60;
  let maxMinutes = defaultEndHour * 60;
  
  // 全アイテム（休憩含む）の時刻範囲を計算
  for (const item of items) {
    const itemMinutes = timeToMinutes(item.time);
    minMinutes = Math.min(minMinutes, itemMinutes);
    maxMinutes = Math.max(maxMinutes, itemMinutes);
  }
  
  // 最後のアイテムに1時間追加（表示用）
  maxMinutes += 60;
  
  // 時間単位で切り上げ/切り下げ
  // 開始は2時間前まで余裕を追加（ドラッグで早い時間に移動できるように）
  let startHour = Math.floor(minMinutes / 60) - 2;
  // 最小開始時刻は0時
  if (startHour < 0) {
    startHour = 0;
  }
  
  // 終端に2時間の余裕を追加（ドラッグで伸ばせるように）
  let endHour = Math.ceil(maxMinutes / 60) + 2;
  
  // 最大時間制限（startHour + maxHours）
  const maxEndHour = startHour + maxHours;
  if (endHour > maxEndHour) {
    endHour = maxEndHour;
  }
  
  return {
    startHour,
    endHour,
    totalHours: endHour - startHour,
  };
}

/**
 * トップ位置（パーセント）から時刻文字列を計算
 * @param snapMinutes スナップ単位（分）
 */
export function topPercentToTime(
  topPercent: number,
  offset: number = 0,
  startHour: number = 8,
  totalHours: number = 12,
  snapMinutes: number = 15
): string {
  const adjustedTop = Math.max(0, Math.min(100, topPercent + offset));
  const minutes = Math.round((adjustedTop / 100) * totalHours * 60 + startHour * 60);
  const hour = Math.floor(minutes / 60);
  const min = Math.round((minutes % 60) / snapMinutes) * snapMinutes;
  return `${String(hour).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
