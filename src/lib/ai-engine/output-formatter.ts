/**
 * Output Formatter
 * Transforms AI responses into platform-specific formats
 */

export type OutputFormat = 'text' | 'json' | 'markdown' | 'html' | 'platform-specific';

export type Platform = 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'pinterest' | 'youtube' | 'email' | 'blog';

export interface FormattedOutput {
  raw: string;
  formatted: string;
  format: OutputFormat;
  platform?: Platform;
  metadata?: Record<string, any>;
}

export interface PlatformConfig {
  maxLength: number;
  supportedFormats: string[];
  lineBreakChar: string;
  hashtagStyle: 'inline' | 'end' | 'none';
  emojiSupport: boolean;
  urlShortening: boolean;
  mediaSupport: string[];
}

/**
 * OutputFormatter - Handles conversion of AI responses to different formats
 */
export class OutputFormatter {
  private platformConfigs: Map<Platform, PlatformConfig> = new Map([
    [
      'tiktok',
      {
        maxLength: 2200,
        supportedFormats: ['text', 'markdown'],
        lineBreakChar: '\n',
        hashtagStyle: 'end',
        emojiSupport: true,
        urlShortening: true,
        mediaSupport: ['video', 'image'],
      },
    ],
    [
      'instagram',
      {
        maxLength: 2200,
        supportedFormats: ['text', 'markdown'],
        lineBreakChar: '\n',
        hashtagStyle: 'end',
        emojiSupport: true,
        urlShortening: false,
        mediaSupport: ['image', 'video', 'carousel'],
      },
    ],
    [
      'twitter',
      {
        maxLength: 280,
        supportedFormats: ['text'],
        lineBreakChar: '\n',
        hashtagStyle: 'inline',
        emojiSupport: true,
        urlShortening: true,
        mediaSupport: ['image', 'video'],
      },
    ],
    [
      'linkedin',
      {
        maxLength: 3000,
        supportedFormats: ['text', 'markdown'],
        lineBreakChar: '\n',
        hashtagStyle: 'inline',
        emojiSupport: false,
        urlShortening: false,
        mediaSupport: ['image', 'document', 'video'],
      },
    ],
    [
      'facebook',
      {
        maxLength: 63206,
        supportedFormats: ['text', 'html', 'markdown'],
        lineBreakChar: '\n',
        hashtagStyle: 'inline',
        emojiSupport: true,
        urlShortening: false,
        mediaSupport: ['image', 'video', 'link'],
      },
    ],
    [
      'pinterest',
      {
        maxLength: 500,
        supportedFormats: ['text'],
        lineBreakChar: ' ',
        hashtagStyle: 'inline',
        emojiSupport: true,
        urlShortening: true,
        mediaSupport: ['image'],
      },
    ],
    [
      'youtube',
      {
        maxLength: 5000,
        supportedFormats: ['text', 'markdown', 'html'],
        lineBreakChar: '\n',
        hashtagStyle: 'inline',
        emojiSupport: true,
        urlShortening: false,
        mediaSupport: ['video', 'image'],
      },
    ],
    [
      'email',
      {
        maxLength: 100000,
        supportedFormats: ['text', 'html', 'markdown'],
        lineBreakChar: '\n',
        hashtagStyle: 'none',
        emojiSupport: true,
        urlShortening: false,
        mediaSupport: ['image', 'attachment'],
      },
    ],
    [
      'blog',
      {
        maxLength: 100000,
        supportedFormats: ['markdown', 'html'],
        lineBreakChar: '\n',
        hashtagStyle: 'none',
        emojiSupport: true,
        urlShortening: false,
        mediaSupport: ['image', 'video', 'embed'],
      },
    ],
  ]);

  /**
   * Format output for a specific platform
   */
  formatForPlatform(content: string, platform: Platform, format: OutputFormat = 'text'): FormattedOutput {
    const config = this.platformConfigs.get(platform);
    if (!config) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    let formatted = content;

    // Apply platform-specific formatting
    formatted = this.applyPlatformRules(formatted, config);

    // Ensure length constraints
    formatted = this.enforceLength(formatted, config.maxLength);

    return {
      raw: content,
      formatted,
      format,
      platform,
      metadata: {
        platform,
        characterCount: formatted.length,
        maxLength: config.maxLength,
        truncated: formatted.length >= config.maxLength,
      },
    };
  }

  /**
   * Format output as JSON
   */
  formatAsJSON(content: string, schema?: Record<string, any>): FormattedOutput {
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If not valid JSON, wrap in object
      parsed = { content };
    }

    if (schema) {
      parsed = this.validateAgainstSchema(parsed, schema);
    }

    return {
      raw: content,
      formatted: JSON.stringify(parsed, null, 2),
      format: 'json',
      metadata: { schema: schema ? 'applied' : 'none' },
    };
  }

  /**
   * Format output as Markdown
   */
  formatAsMarkdown(content: string): FormattedOutput {
    let formatted = content;

    // Ensure proper markdown formatting
    formatted = this.ensureMarkdownStructure(formatted);

    return {
      raw: content,
      formatted,
      format: 'markdown',
    };
  }

  /**
   * Format output as HTML
   */
  formatAsHTML(content: string): FormattedOutput {
    let formatted = content;

    // Convert markdown to HTML if needed
    if (content.includes('#') || content.includes('**')) {
      formatted = this.markdownToHTML(content);
    } else {
      formatted = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
    }

    return {
      raw: content,
      formatted,
      format: 'html',
    };
  }

  /**
   * Apply platform-specific formatting rules
   */
  private applyPlatformRules(content: string, config: PlatformConfig): string {
    let formatted = content;

    // Remove line breaks if not supported
    if (config.lineBreakChar !== '\n') {
      formatted = formatted.replace(/\n/g, config.lineBreakChar);
    }

    // Handle hashtags
    if (config.hashtagStyle === 'none') {
      formatted = formatted.replace(/#\w+/g, '');
    }

    // Remove emojis if not supported
    if (!config.emojiSupport) {
      formatted = this.removeEmojis(formatted);
    }

    return formatted;
  }

  /**
   * Enforce character length limits
   */
  private enforceLength(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Truncate and add ellipsis
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Remove emojis from text
   */
  private removeEmojis(text: string): string {
    const emojiRegex =
      /(\u00d7|\u20e3|[\u0300-\u036f]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2000-\u206F]|[\u3000-\u303F]|[\uFE30-\uFE4F])/g;
    return text.replace(emojiRegex, '');
  }

  /**
   * Ensure proper markdown structure
   */
  private ensureMarkdownStructure(content: string): string {
    let formatted = content;

    // Ensure headings have proper spacing
    formatted = formatted.replace(/^(#{1,6})\s+/gm, '$1 ');

    // Ensure lists have proper formatting
    formatted = formatted.replace(/^\s*[-*+]\s+/gm, '- ');

    return formatted;
  }

  /**
   * Convert markdown to HTML
   */
  private markdownToHTML(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Paragraphs
    html = `<p>${html}</p>`;

    return html;
  }

  /**
   * Validate content against schema
   */
  private validateAgainstSchema(content: any, schema: Record<string, any>): any {
    const validated: any = {};

    Object.entries(schema).forEach(([key, type]) => {
      if (content[key] !== undefined) {
        validated[key] = content[key];
      } else {
        validated[key] = null;
      }
    });

    return validated;
  }

  /**
   * Get platform configuration
   */
  getPlatformConfig(platform: Platform): PlatformConfig | undefined {
    return this.platformConfigs.get(platform);
  }

  /**
   * List supported platforms
   */
  listPlatforms(): Platform[] {
    return Array.from(this.platformConfigs.keys());
  }
}

/**
 * ContentPipeline - Orchestrates content through formatting stages
 */
export class ContentPipeline {
  private formatter: OutputFormatter;

  constructor() {
    this.formatter = new OutputFormatter();
  }

  /**
   * Process content through the pipeline
   */
  async process(
    content: string,
    targetFormat: OutputFormat,
    targetPlatform?: Platform
  ): Promise<FormattedOutput> {
    if (targetPlatform) {
      return this.formatter.formatForPlatform(content, targetPlatform, targetFormat);
    }

    switch (targetFormat) {
      case 'json':
        return this.formatter.formatAsJSON(content);
      case 'markdown':
        return this.formatter.formatAsMarkdown(content);
      case 'html':
        return this.formatter.formatAsHTML(content);
      default:
        return {
          raw: content,
          formatted: content,
          format: 'text',
        };
    }
  }

  /**
   * Batch process content for multiple platforms
   */
  async processBatch(
    content: string,
    platforms: Platform[]
  ): Promise<Record<Platform, FormattedOutput>> {
    const results: Record<Platform, FormattedOutput> = {} as any;

    for (const platform of platforms) {
      results[platform] = this.formatter.formatForPlatform(content, platform);
    }

    return results;
  }
}
