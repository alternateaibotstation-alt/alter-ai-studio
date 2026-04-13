/**
 * Memory System
 * Manages persistent conversation history, context injection, and memory retrieval
 */

import { createClient } from '@supabase/supabase-js';

export interface ConversationMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
  tokensUsed?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  botId: string;
  title?: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface MemoryContext {
  recentMessages: ConversationMessage[];
  summary?: string;
  keyTopics: string[];
  userPreferences: Record<string, any>;
  conversationStyle: string;
}

/**
 * ConversationStore - Handles persistent storage of conversations
 */
export class ConversationStore {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    botId: string,
    title?: string
  ): Promise<Conversation> {
    const conversationId = this.generateId();

    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        id: conversationId,
        user_id: userId,
        bot_id: botId,
        title: title || `Chat with ${botId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      botId: data.bot_id,
      title: data.title,
      messages: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Save a message to conversation
   */
  async saveMessage(
    conversationId: string,
    message: ConversationMessage,
    messageIndex: number
  ): Promise<ConversationMessage> {
    const { data, error } = await this.supabase
      .from('conversation_memory')
      .insert({
        conversation_id: conversationId,
        message_index: messageIndex,
        role: message.role,
        content: message.content,
        tokens_used: message.tokensUsed || 0,
        metadata: message.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      role: data.role,
      content: data.content,
      timestamp: new Date(data.created_at),
      tokensUsed: data.tokens_used,
      metadata: data.metadata,
    };
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data: convData, error: convError } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) return null;

    const { data: messagesData, error: messagesError } = await this.supabase
      .from('conversation_memory')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: true });

    if (messagesError) throw messagesError;

    return {
      id: convData.id,
      userId: convData.user_id,
      botId: convData.bot_id,
      title: convData.title,
      messages: messagesData.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        tokensUsed: msg.tokens_used,
        metadata: msg.metadata,
      })),
      createdAt: new Date(convData.created_at),
      updatedAt: new Date(convData.updated_at),
      metadata: convData.metadata,
    };
  }

  /**
   * Get recent conversations for a user
   */
  async getRecentConversations(
    userId: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((conv: any) => ({
      id: conv.id,
      userId: conv.user_id,
      botId: conv.bot_id,
      title: conv.title,
      messages: [],
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      metadata: conv.metadata,
    }));
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * MemoryManager - Manages context retrieval and memory optimization
 */
export class MemoryManager {
  private conversationStore: ConversationStore;
  private maxContextMessages: number = 20;
  private maxTokensPerContext: number = 4000;

  constructor(supabaseClient: any) {
    this.conversationStore = new ConversationStore(supabaseClient);
  }

  /**
   * Get memory context for a conversation
   */
  async getMemoryContext(conversationId: string): Promise<MemoryContext> {
    const conversation = await this.conversationStore.getConversation(
      conversationId
    );

    if (!conversation) {
      return {
        recentMessages: [],
        keyTopics: [],
        userPreferences: {},
        conversationStyle: 'neutral',
      };
    }

    // Get recent messages (last N messages)
    const recentMessages = conversation.messages.slice(
      -this.maxContextMessages
    );

    // Extract key topics
    const keyTopics = this.extractKeyTopics(conversation.messages);

    // Infer user preferences
    const userPreferences = this.inferUserPreferences(conversation.messages);

    // Determine conversation style
    const conversationStyle = this.analyzeConversationStyle(
      conversation.messages
    );

    // Generate summary if conversation is long
    let summary: string | undefined;
    if (conversation.messages.length > 50) {
      summary = this.generateConversationSummary(conversation.messages);
    }

    return {
      recentMessages,
      summary,
      keyTopics,
      userPreferences,
      conversationStyle,
    };
  }

  /**
   * Build context-injected system prompt
   */
  buildContextualSystemPrompt(
    baseSystemPrompt: string,
    memoryContext: MemoryContext
  ): string {
    let prompt = baseSystemPrompt;

    // Add conversation history summary if available
    if (memoryContext.summary) {
      prompt += `\n\n## Conversation Summary\n${memoryContext.summary}`;
    }

    // Add key topics
    if (memoryContext.keyTopics.length > 0) {
      prompt += `\n\n## Key Topics Discussed\n${memoryContext.keyTopics.join(', ')}`;
    }

    // Add user preferences
    if (Object.keys(memoryContext.userPreferences).length > 0) {
      prompt += `\n\n## User Preferences\n`;
      Object.entries(memoryContext.userPreferences).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
    }

    // Add conversation style instruction
    prompt += `\n\n## Conversation Style\nMaintain a ${memoryContext.conversationStyle} tone to match the user's communication style.`;

    return prompt;
  }

  /**
   * Extract key topics from conversation
   */
  private extractKeyTopics(messages: ConversationMessage[]): string[] {
    const topics: Set<string> = new Set();

    // Simple keyword extraction (can be enhanced with NLP)
    const keywords = [
      'project',
      'feature',
      'bug',
      'design',
      'performance',
      'security',
      'deployment',
      'testing',
      'documentation',
      'api',
      'database',
      'frontend',
      'backend',
      'mobile',
      'web',
    ];

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      keywords.forEach((keyword) => {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics).slice(0, 5); // Return top 5 topics
  }

  /**
   * Infer user preferences from conversation
   */
  private inferUserPreferences(
    messages: ConversationMessage[]
  ): Record<string, any> {
    const preferences: Record<string, any> = {};

    // Analyze message patterns
    const userMessages = messages.filter((m) => m.role === 'user');
    const avgMessageLength =
      userMessages.reduce((sum, m) => sum + m.content.length, 0) /
      userMessages.length;

    if (avgMessageLength > 500) {
      preferences.communicationStyle = 'detailed';
    } else if (avgMessageLength < 100) {
      preferences.communicationStyle = 'concise';
    } else {
      preferences.communicationStyle = 'balanced';
    }

    // Check for technical depth
    const technicalKeywords = [
      'algorithm',
      'architecture',
      'optimization',
      'scalability',
      'performance',
    ];
    const hasTechnicalQuestions = messages.some((m) =>
      technicalKeywords.some((kw) =>
        m.content.toLowerCase().includes(kw)
      )
    );

    preferences.technicalLevel = hasTechnicalQuestions ? 'advanced' : 'general';

    return preferences;
  }

  /**
   * Analyze conversation style
   */
  private analyzeConversationStyle(messages: ConversationMessage[]): string {
    let formalCount = 0;
    let casualCount = 0;

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();

      // Check for formal indicators
      if (
        content.includes('please') ||
        content.includes('thank') ||
        content.includes('regards')
      ) {
        formalCount++;
      }

      // Check for casual indicators
      if (
        content.includes('hey') ||
        content.includes('lol') ||
        content.includes('cool') ||
        content.includes('awesome')
      ) {
        casualCount++;
      }
    });

    if (formalCount > casualCount) {
      return 'professional';
    } else if (casualCount > formalCount) {
      return 'casual';
    }
    return 'neutral';
  }

  /**
   * Generate conversation summary
   */
  private generateConversationSummary(messages: ConversationMessage[]): string {
    // Simple summary: extract first and last few messages
    const firstMessages = messages.slice(0, 3);
    const lastMessages = messages.slice(-3);

    const summary = `
    Conversation started with: ${firstMessages.map((m) => m.content.substring(0, 50)).join('; ')}
    Recent discussion: ${lastMessages.map((m) => m.content.substring(0, 50)).join('; ')}
    `;

    return summary.trim();
  }

  /**
   * Optimize messages for token limit
   */
  optimizeMessagesForContext(
    messages: ConversationMessage[]
  ): ConversationMessage[] {
    let totalTokens = 0;
    const optimized: ConversationMessage[] = [];

    // Start from the end and work backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const estimatedTokens = Math.ceil(msg.content.length / 4); // Rough estimate

      if (totalTokens + estimatedTokens <= this.maxTokensPerContext) {
        optimized.unshift(msg);
        totalTokens += estimatedTokens;
      } else {
        break;
      }
    }

    return optimized;
  }

  /**
   * Set max context messages
   */
  setMaxContextMessages(max: number): void {
    this.maxContextMessages = max;
  }

  /**
   * Set max tokens per context
   */
  setMaxTokensPerContext(max: number): void {
    this.maxTokensPerContext = max;
  }
}

/**
 * UserProfileManager - Manages user-specific preferences and settings
 */
export class UserProfileManager {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return {};

    return data;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Get user's favorite bots
   */
  async getFavoriteBots(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('user_favorites')
      .select('bot_id')
      .eq('user_id', userId);

    if (error) return [];

    return data.map((item: any) => item.bot_id);
  }

  /**
   * Add bot to favorites
   */
  async addFavoriteBot(userId: string, botId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        bot_id: botId,
      });

    if (error && !error.message.includes('duplicate')) throw error;
  }

  /**
   * Remove bot from favorites
   */
  async removeFavoriteBot(userId: string, botId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('bot_id', botId);

    if (error) throw error;
  }
}
