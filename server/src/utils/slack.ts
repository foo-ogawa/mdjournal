/**
 * Slack連携ユーティリティ
 * 
 * Slack Block Kit を使用してリッチなフォーマットで日報を投稿する。
 * 
 * 設定可能項目（mdjournal.config.yaml の slack セクション）:
 *   - sections: 投稿するセクション (plan/result/todo/note) を true/false で選択
 *   - todoIcons: TODOステータスアイコンをSlack shortcode形式でカスタマイズ
 */

import { getRootConfig } from './fileManager.js';

interface SlackConfig {
  enabled: boolean;
  webhookUrl?: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
  sections?: Partial<SectionConfig>;
  todoIcons?: Partial<TodoIcons>;
}

interface SlackPostResult {
  success: boolean;
  error?: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
}

interface TodoIcons {
  pending: string;
  inProgress: string;
  onHold: string;
  completed: string;
}

interface SectionConfig {
  plan: boolean;
  result: boolean;
  todo: boolean;
  note: boolean;
}

const DEFAULT_TODO_ICONS: TodoIcons = {
  pending: ':black_square_button:',
  inProgress: ':arrow_forward:',
  onHold: ':double_vertical_bar:',
  completed: ':white_check_mark:',
};

const DEFAULT_SECTIONS: SectionConfig = {
  plan: true,
  result: true,
  todo: true,
  note: true,
};

/** セクションタイトル → config key マッピング */
const SECTION_KEY_MAP: Record<string, keyof SectionConfig> = {
  'plan': 'plan',
  'result': 'result',
  'todo': 'todo',
  'note': 'note',
};

/**
 * Slack設定を取得
 */
export function getSlackConfig(): SlackConfig | null {
  const config = getRootConfig();
  if (!config) return null;
  
  // config.yamlからslack設定を取得
  const slackConfig = config.slack as SlackConfig | undefined;
  if (!slackConfig || !slackConfig.enabled) {
    return null;
  }
  
  // 環境変数からWebhook URLを取得（設定ファイルより優先）
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || slackConfig.webhookUrl;
  
  // ${SLACK_WEBHOOK_URL} のようなプレースホルダーを環境変数で置換
  const resolvedWebhookUrl = webhookUrl?.startsWith('${') 
    ? process.env.SLACK_WEBHOOK_URL 
    : webhookUrl;
  
  return {
    ...slackConfig,
    webhookUrl: resolvedWebhookUrl,
  };
}

/**
 * Slackに日報を投稿
 */
export async function postToSlack(date: string, content: string): Promise<SlackPostResult> {
  const config = getSlackConfig();
  
  if (!config) {
    return { success: false, error: 'Slack連携が設定されていません' };
  }
  
  if (!config.webhookUrl) {
    return { success: false, error: 'Slack Webhook URLが設定されていません（環境変数 SLACK_WEBHOOK_URL を設定してください）' };
  }
  
  try {
    const sections: SectionConfig = { ...DEFAULT_SECTIONS, ...config.sections };
    const todoIcons: TodoIcons = { ...DEFAULT_TODO_ICONS, ...config.todoIcons };
    
    const { fallbackText, blocks } = buildSlackMessage(date, content, sections, todoIcons);
    
    const payload = {
      text: fallbackText,
      blocks,
      username: config.username || '日報ダッシュボード',
      icon_emoji: config.iconEmoji || ':memo:',
      ...(config.channel && { channel: config.channel }),
    };
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Slack APIエラー: ${response.status} ${errorText}` };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Slack投稿に失敗しました' 
    };
  }
}

/**
 * Slack Block Kit メッセージを構築
 */
function buildSlackMessage(
  date: string,
  content: string,
  sections: SectionConfig,
  todoIcons: TodoIcons,
): { fallbackText: string; blocks: SlackBlock[] } {
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');
  
  // H1タイトルを抽出（例: # [日報] 名前 2026-02-06）
  const titleMatch = contentWithoutFrontmatter.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : `日報 ${date}`;
  
  // タイトル行を除去してセクションに分割
  const contentBody = contentWithoutFrontmatter.replace(/^# .+\n?/m, '').trim();
  const allSections = parseSections(contentBody);
  
  // 設定に基づいてセクションをフィルタリング
  const filteredSections = allSections.filter(section => {
    const key = getSectionKey(section.title);
    if (!key) return true; // 未知のセクションは含める
    return sections[key];
  });
  
  // スケジュール系セクション (plan/result) の有効数をカウント
  // 片方だけ有効ならヘッダーを省略する
  const enabledScheduleCount = [sections.plan, sections.result].filter(Boolean).length;
  
  // ブロック構築
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:clipboard: ${title}`,
        emoji: true,
      },
    },
  ];
  
  for (let i = 0; i < filteredSections.length; i++) {
    const section = filteredSections[i];
    if (!section.content.trim()) continue;
    
    // セクション間に区切り線
    if (blocks.length > 1) {
      blocks.push({ type: 'divider' });
    }
    
    const formatted = formatSectionContent(section.content, todoIcons);
    
    // ヘッダー表示判定:
    //   - plan/result: 両方有効な場合のみヘッダーを表示（片方なら省略）
    //   - todo/note: 常にヘッダーを表示
    const key = getSectionKey(section.title);
    const isScheduleSection = key === 'plan' || key === 'result';
    const showHeader = isScheduleSection ? enabledScheduleCount >= 2 : true;
    
    const sectionText = showHeader
      ? `*${section.title}*\n${formatted}`
      : formatted;
    
    // Slack section block は 3000 文字制限
    if (sectionText.length <= 3000) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: sectionText },
      });
    } else {
      // 長いセクションは分割
      if (showHeader) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*${section.title}*` },
        });
      }
      const chunks = splitTextByLines(formatted, 2800);
      for (const chunk of chunks) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: chunk },
        });
      }
    }
  }
  
  return {
    fallbackText: `:clipboard: ${title}`,
    blocks,
  };
}

/**
 * セクションタイトルから設定キーを取得
 * [PLAN] → plan, [RESULT] → result, etc.
 */
function getSectionKey(title: string): keyof SectionConfig | null {
  const cleaned = title.replace(/[[\]]/g, '').toLowerCase().trim();
  return SECTION_KEY_MAP[cleaned] || null;
}

/**
 * Markdownコンテンツを ## ヘッダーでセクションに分割
 */
function parseSections(content: string): { title: string; content: string }[] {
  const lines = content.split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];
  
  for (const line of lines) {
    // ## ヘッダーでセクション分割
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      // 前のセクションを保存
      if (currentTitle || currentLines.some(l => l.trim())) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      }
      currentTitle = h2Match[1].trim();
      currentLines = [];
      continue;
    }
    
    currentLines.push(line);
  }
  
  // 最後のセクション
  if (currentTitle || currentLines.some(l => l.trim())) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }
  
  return sections.filter(s => s.content.trim());
}

/**
 * セクション内のコンテンツをSlack mrkdwn形式にフォーマット
 * 
 * - 時刻・プロジェクトコードを `code` 形式に変換
 * - チェックボックスをカスタムアイコンに変換
 */
function formatSectionContent(content: string, todoIcons: TodoIcons): string {
  return content
    // H3 → 太字
    .replace(/^### (.+)$/gm, '*$1*')
    // チェックボックス → カスタムアイコン + プロジェクトコードを code 形式に
    .replace(/^- \[x\]\s*(?:\[([^\]]+)\]\s*)?/gim, (_, code) =>
      `${todoIcons.completed}${code ? ` \`${code}\`` : ''} `)
    .replace(/^- \[\*\]\s*(?:\[([^\]]+)\]\s*)?/gm, (_, code) =>
      `${todoIcons.inProgress}${code ? ` \`${code}\`` : ''} `)
    .replace(/^- \[-\]\s*(?:\[([^\]]+)\]\s*)?/gm, (_, code) =>
      `${todoIcons.onHold}${code ? ` \`${code}\`` : ''} `)
    .replace(/^- \[ \]\s*(?:\[([^\]]+)\]\s*)?/gm, (_, code) =>
      `${todoIcons.pending}${code ? ` \`${code}\`` : ''} `)
    // スケジュールリスト → 時刻とプロジェクトコードを code 形式に
    .replace(/^\* (\d{2}:\d{2})\s*(?:\[([^\]]+)\]\s*)?(.*)$/gm, (_, time, code, task) =>
      `• \`${time}\`${code ? ` \`${code}\`` : ''}${task ? ` ${task}` : ''}`
    );
}

/**
 * テキストを行単位で指定文字数以内のチャンクに分割
 */
function splitTextByLines(text: string, maxLength: number): string[] {
  const lines = text.split('\n');
  const chunks: string[] = [];
  let current = '';
  
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLength && current) {
      chunks.push(current.trim());
      current = '';
    }
    current += (current ? '\n' : '') + line;
  }
  
  if (current.trim()) {
    chunks.push(current.trim());
  }
  
  return chunks;
}
