import { Card, Space, Typography, Calendar, Progress, Tooltip, Select, Button } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { useDashboard } from '../Dashboard/DashboardContext';

const { Text } = Typography;

interface CalendarViewProps {
  selectedDate: dayjs.Dayjs;
  onDateSelect: (dateStr: string) => void;
  selectedProjects?: string[];
}

export const CalendarView = ({ selectedDate, onDateSelect }: CalendarViewProps) => {
  const { calendar, unsavedReports, report } = useDashboard();
  const [displayDate, setDisplayDate] = useState(selectedDate);

  const today = dayjs();
  
  // カレンダーデータから日ごとの稼働時間マップを作成
  const dailyWorkHours = useMemo(() => {
    const map: Record<string, { actual: number; plan: number }> = {};
    for (const day of calendar.days) {
      if (day.hasReport) {
        map[day.date] = {
          actual: day.resultHours || 0,
          plan: day.planHours || 0,
        };
      }
    }
    return map;
  }, [calendar.days]);

  // データが存在する年月のリストを取得（APIから取得したデータを使用）
  const availableYearMonths = useMemo(() => {
    const yearMonths = new Map<string, { year: number; month: number }>();
    
    // APIから取得した年月リストを追加
    for (const ym of calendar.availableYearMonths) {
      // APIは1-indexed month、dayjsは0-indexed monthなので変換
      const key = `${ym.year}-${ym.month - 1}`;
      if (!yearMonths.has(key)) {
        yearMonths.set(key, { year: ym.year, month: ym.month - 1 });
      }
    }
    
    // 今月も追加
    const currentKey = `${today.year()}-${today.month()}`;
    if (!yearMonths.has(currentKey)) {
      yearMonths.set(currentKey, { year: today.year(), month: today.month() });
    }
    
    // 前後2ヶ月も追加
    for (let i = -2; i <= 2; i++) {
      const date = today.add(i, 'month');
      const key = `${date.year()}-${date.month()}`;
      if (!yearMonths.has(key)) {
        yearMonths.set(key, { year: date.year(), month: date.month() });
      }
    }
    
    return Array.from(yearMonths.values())
      .sort((a, b) => (a.year - b.year) || (a.month - b.month))
      .map(ym => ({
        ...ym,
        label: `${ym.year}年${ym.month + 1}月`,
      }));
  }, [calendar.availableYearMonths, today]);

  // 年月プルダウンオプション
  const yearMonthOptions = availableYearMonths.map(ym => ({
    value: `${ym.year}-${ym.month}`,
    label: ym.label,
  }));

  // 年月変更
  const handleYearMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    const newDate = displayDate.year(year).month(month);
    setDisplayDate(newDate);
    calendar.loadCalendar(year, month + 1);
  };

  // 前月・次月
  const handlePrevMonth = () => {
    const currentIndex = availableYearMonths.findIndex(
      ym => ym.year === displayDate.year() && ym.month === displayDate.month()
    );
    if (currentIndex > 0) {
      const prev = availableYearMonths[currentIndex - 1];
      const newDate = displayDate.year(prev.year).month(prev.month);
      setDisplayDate(newDate);
      calendar.loadCalendar(prev.year, prev.month + 1);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableYearMonths.findIndex(
      ym => ym.year === displayDate.year() && ym.month === displayDate.month()
    );
    if (currentIndex < availableYearMonths.length - 1) {
      const next = availableYearMonths[currentIndex + 1];
      const newDate = displayDate.year(next.year).month(next.month);
      setDisplayDate(newDate);
      calendar.loadCalendar(next.year, next.month + 1);
    }
  };

  // 表示日付が選択日付と異なる月になったら同期
  useEffect(() => {
    if (selectedDate.month() !== displayDate.month() || selectedDate.year() !== displayDate.year()) {
      setDisplayDate(selectedDate);
    }
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // 前後月ボタンの有効・無効
  const currentIndex = availableYearMonths.findIndex(
    ym => ym.year === displayDate.year() && ym.month === displayDate.month()
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < availableYearMonths.length - 1;

  // 稼働時間に応じた色
  const getWorkColor = (hours: number) => {
    if (hours >= 9) return '#ff4d4f'; // 過労
    if (hours >= 8) return '#52c41a'; // 適正
    if (hours >= 6) return '#1890ff'; // 少なめ
    return '#d9d9d9'; // 未入力
  };

  // 日付セルのフルレンダリング（日付番号＋ゲージ）
  const fullCellRender = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isPast = date.isBefore(today, 'day');
    const isFuture = date.isAfter(today, 'day');
    const isToday = date.isSame(today, 'day');
    const isSelected = date.isSame(selectedDate, 'day');
    const isCurrentMonth = date.month() === displayDate.month();

    const workData = dailyWorkHours[dateStr];

    // 稼働時間のパーセント（8時間を100%とする）
    const workPercent = workData ? Math.min((workData.actual / 8) * 100, 100) : 0;
    
    // 未保存の変更があるかどうか
    const hasUnsavedChanges = unsavedReports.hasUnsavedChangesForDate(dateStr) ||
      (isSelected && report.isDirty);

    return (
      <Tooltip title={workData ? `稼働: ${workData.actual}h${hasUnsavedChanges ? ' (未保存)' : ''}` : hasUnsavedChanges ? '未保存' : undefined}>
        <div
          onClick={() => onDateSelect(dateStr)}
          style={{
            position: 'relative',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: isFuture ? 0.4 : isCurrentMonth ? 1 : 0.3,
          }}
        >
          {/* 円ゲージ（日付の外側） */}
          {(isPast || isToday) && workData && (
            <Progress
              type="circle"
              percent={workPercent}
              size={30}
              strokeColor={getWorkColor(workData.actual)}
              railColor="#f0f0f0"
              strokeWidth={10}
              format={() => null}
              style={{
                position: 'absolute',
                top: 1,
                left: 1,
              }}
            />
          )}
          {/* 未保存アラートアイコン */}
          {hasUnsavedChanges && (
            <ExclamationCircleFilled
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                fontSize: 10,
                color: '#ff4d4f',
                zIndex: 2,
              }}
            />
          )}
          {/* 日付番号 */}
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 12,
              fontWeight: isToday || isSelected ? 600 : 400,
              color: isToday ? '#1890ff' : isSelected ? '#1890ff' : '#000',
              background: isSelected ? '#e6f7ff' : isToday ? '#fff' : 'transparent',
              borderRadius: '50%',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {date.date()}
          </span>
        </div>
      </Tooltip>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Space size="small">
            <Button size="small" onClick={handlePrevMonth} disabled={!hasPrev}>
              ◀
            </Button>
            <Select
              value={`${displayDate.year()}-${displayDate.month()}`}
              options={yearMonthOptions}
              size="small"
              style={{ width: 120 }}
              onChange={handleYearMonthChange}
              popupMatchSelectWidth={false}
            />
            <Button size="small" onClick={handleNextMonth} disabled={!hasNext}>
              ▶
            </Button>
          </Space>
        </div>
      }
      styles={{ body: { padding: 8 } }}
    >
      {/* カレンダー */}
      <style>
        {`
          .compact-calendar .ant-picker-content th,
          .compact-calendar .ant-picker-content td {
            padding: 2px 0 !important;
          }
          .compact-calendar .ant-picker-cell {
            padding: 0 !important;
          }
          .compact-calendar .ant-picker-cell-inner {
            min-width: 32px !important;
            height: 32px !important;
            line-height: 32px !important;
          }
        `}
      </style>
      <Calendar
        fullscreen={false}
        value={displayDate}
        className="compact-calendar"
        onSelect={(date) => {
          setDisplayDate(date);
          onDateSelect(date.format('YYYY-MM-DD'));
        }}
        fullCellRender={fullCellRender}
        style={{ border: 'none' }}
        headerRender={() => null}
      />

      {/* サマリー表示 */}
      {calendar.summary && (
        <div style={{ 
          padding: '6px 8px', 
          marginTop: 4,
          background: '#fafafa', 
          borderRadius: 4,
          fontSize: 11,
          color: '#666',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>稼働日数: {calendar.summary.workDays ?? 0}日</span>
            <span>合計: {(calendar.summary.totalResultHours ?? 0).toFixed(1)}h</span>
          </div>
        </div>
      )}

      {/* 凡例 */}
      <div style={{ 
        padding: '4px 8px', 
        marginTop: 4,
        background: '#f5f5f5', 
        borderRadius: 4,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
          <Text type="secondary" style={{ fontSize: 9 }}>8h+</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1890ff' }} />
          <Text type="secondary" style={{ fontSize: 9 }}>6-8h</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f' }} />
          <Text type="secondary" style={{ fontSize: 9 }}>9h+</Text>
        </div>
      </div>
    </Card>
  );
};
