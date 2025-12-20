/**
 * Slack連携ユーティリティ
 */

import { getRootConfig } from './fileManager.js';

interface SlackConfig {
  enabled: boolean;
  webhookUrl?: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

interface SlackPostResult {
  success: boolean;
  error?: string;
}

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
    // Markdownから見出しを除去してシンプルなテキストに変換
    const formattedContent = formatForSlack(date, content);
    
    const payload = {
      text: formattedContent,
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
 * Markdownコンテンツをslack向けにフォーマット
 */
function formatForSlack(date: string, content: string): string {
  // frontmatterを除去
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');
  
  // Markdown見出しをSlack形式に変換
  const formatted = contentWithoutFrontmatter
    // H1 -> 太字
    .replace(/^# (.+)$/gm, '*$1*')
    // H2 -> 太字
    .replace(/^## (.+)$/gm, '*$1*')
    // H3 -> 太字
    .replace(/^### (.+)$/gm, '*$1*')
    // チェックボックス
    .replace(/^- \[x\]/gm, '✅')
    .replace(/^- \[\*\]/gm, '🔄')
    .replace(/^- \[ \]/gm, '⬜')
    // リスト
    .replace(/^\* /gm, '• ');
  
  return `📋 *日報 ${date}*\n\n${formatted}`;
}

