/**
 * AI Engine Orchestrator
 * Manages prompt templates, context injection, and AI request orchestration
 */

import { OpenAI } from 'https://deno.land/x/openai@v4.24.0/mod.ts';

export interface AIRequest {
  botId: string;
  userId?: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: Record<string, any>;
  taskType?: 'chat' | 'content' | 'analysis' | 'generation';
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  metadata?: Record<string, any>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
  variables: string[];
  outputFormat: 'text' | 'json' | 'markdown' | 'html';
  examples?: string[];
}

export interface BotPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tone: 'professional' | 'casual' | 'creative' | 'technical' | 'friendly';
  expertise?: string[];
  constraints?: string[];
}

/**
 * PromptOrchestrator - Manages prompt templates and context injection
 */
export class PromptOrchestrator {
  private templates: Map<string, PromptTemplate> = new Map();
  private personas: Map<string, BotPersona> = new Map();

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Register a bot persona
   */
  registerPersona(persona: BotPersona): void {
    this.personas.set(persona.id, persona);
  }

  /**
   * Build a complete system prompt with context injection
   */
  buildSystemPrompt(
    botId: string,
    templateId?: string,
    context?: Record<string, any>
  ): string {
    const persona = this.personas.get(botId);
    if (!persona) {
      throw new Error(`Persona not found for bot: ${botId}`);
    }

    let systemPrompt = persona.systemPrompt;

    // If a template is specified, enhance with template instructions
    if (templateId) {
      const template = this.templates.get(templateId);
      if (template) {
        systemPrompt += `\n\n## Task Instructions\n${template.systemPrompt}`;
        systemPrompt += `\n\nOutput Format: ${template.outputFormat}`;
      }
    }

    // Inject context if provided
    if (context && Object.keys(context).length > 0) {
      systemPrompt += '\n\n## Context Information\n';
      Object.entries(context).forEach(([key, value]) => {
        systemPrompt += `${key}: ${JSON.stringify(value)}\n`;
      });
    }

    return systemPrompt;
  }

  /**
   * Prepare messages for API call with system prompt
   */
  prepareMessages(
    botId: string,
    userMessages: Array<{ role: string; content: string }>,
    templateId?: string,
    context?: Record<string, any>
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const systemPrompt = this.buildSystemPrompt(botId, templateId, context);

    return [
      { role: 'system', content: systemPrompt },
      ...userMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get persona by ID
   */
  getPersona(botId: string): BotPersona | undefined {
    return this.personas.get(botId);
  }

  /**
   * List all templates
   */
  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * List all personas
   */
  listPersonas(): BotPersona[] {
    return Array.from(this.personas.values());
  }
}

/**
 * AIEngineOrchestrator - Main orchestration class
 */
export class AIEngineOrchestrator {
  private promptOrchestrator: PromptOrchestrator;
  private modelRouter: ModelRouter;

  constructor() {
    this.promptOrchestrator = new PromptOrchestrator();
    this.modelRouter = new ModelRouter();
  }

  /**
   * Initialize with default personas and templates
   */
  async initialize(): Promise<void> {
    // Register default personas
    this.promptOrchestrator.registerPersona({
      id: 'default',
      name: 'Default Assistant',
      description: 'A helpful general-purpose assistant',
      systemPrompt:
        'You are a helpful, knowledgeable assistant. Provide clear, concise, and accurate responses.',
      tone: 'professional',
    });

    this.promptOrchestrator.registerPersona({
      id: 'creative',
      name: 'Creative Writer',
      description: 'An AI specialized in creative content generation',
      systemPrompt:
        'You are a creative writer. Generate engaging, original, and imaginative content. Use vivid language and compelling narratives.',
      tone: 'creative',
      expertise: ['storytelling', 'copywriting', 'content creation'],
    });

    this.promptOrchestrator.registerPersona({
      id: 'analyst',
      name: 'Data Analyst',
      description: 'An AI specialized in data analysis and insights',
      systemPrompt:
        'You are a data analyst. Provide detailed analysis, insights, and actionable recommendations based on data.',
      tone: 'technical',
      expertise: ['data analysis', 'statistics', 'insights'],
    });
  }

  /**
   * Process an AI request end-to-end
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Route to appropriate model
    const model = this.modelRouter.route(request);

    // Prepare messages with orchestration
    const messages = this.promptOrchestrator.prepareMessages(
      request.botId,
      request.messages,
      undefined,
      request.context
    );

    // Call the AI model
    const response = await this.callModel(model, messages, request.parameters);

    return response;
  }

  /**
   * Call the selected AI model
   */
  private async callModel(
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    parameters?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<AIResponse> {
    // This will be implemented with actual API calls
    // For now, returning a placeholder
    return {
      content: 'AI response placeholder',
      model,
      tokensUsed: 0,
    };
  }

  /**
   * Get the prompt orchestrator
   */
  getPromptOrchestrator(): PromptOrchestrator {
    return this.promptOrchestrator;
  }

  /**
   * Get the model router
   */
  getModelRouter(): ModelRouter {
    return this.modelRouter;
  }
}

/**
 * ModelRouter - Intelligent model selection based on task and user tier
 */
export class ModelRouter {
  private modelConfig = {
    'gpt-4-turbo': {
      cost: 0.03,
      latency: 'high',
      quality: 'highest',
      capabilities: ['reasoning', 'analysis', 'complex tasks'],
    },
    'gpt-4-mini': {
      cost: 0.015,
      latency: 'medium',
      quality: 'high',
      capabilities: ['general tasks', 'content', 'chat'],
    },
    'gemini-3-flash': {
      cost: 0.01,
      latency: 'low',
      quality: 'good',
      capabilities: ['fast responses', 'general tasks', 'content'],
    },
    'gemini-2-flash-lite': {
      cost: 0.005,
      latency: 'very-low',
      quality: 'fair',
      capabilities: ['quick responses', 'simple tasks'],
    },
    'claude-3-opus': {
      cost: 0.025,
      latency: 'high',
      quality: 'highest',
      capabilities: ['reasoning', 'analysis', 'nuanced tasks'],
    },
  };

  /**
   * Route request to appropriate model
   */
  route(request: AIRequest): string {
    const taskType = request.taskType || 'chat';
    const userTier = this.getUserTier(request.userId);
    const complexity = this.analyzeComplexity(request);

    // Routing logic
    if (userTier === 'power') {
      if (complexity === 'high') return 'gpt-4-turbo';
      if (complexity === 'medium') return 'gpt-4-mini';
      return 'gemini-3-flash';
    }

    if (userTier === 'pro') {
      if (complexity === 'high') return 'gpt-4-mini';
      if (complexity === 'medium') return 'gemini-3-flash';
      return 'gemini-2-flash-lite';
    }

    // Free tier
    if (complexity === 'high') return 'gemini-3-flash';
    return 'gemini-2-flash-lite';
  }

  /**
   * Analyze request complexity
   */
  private analyzeComplexity(request: AIRequest): 'low' | 'medium' | 'high' {
    const lastMessage =
      request.messages[request.messages.length - 1]?.content || '';
    const messageLength = lastMessage.length;
    const hasComplexKeywords = /analyze|debug|solve|reason|complex|algorithm/i.test(
      lastMessage
    );
    const hasContextData = request.context && Object.keys(request.context).length > 0;

    if (messageLength > 1000 || hasComplexKeywords || hasContextData) {
      return 'high';
    }
    if (messageLength > 300) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get user tier (placeholder - will be fetched from DB)
   */
  private getUserTier(userId?: string): 'free' | 'pro' | 'power' {
    // This will be replaced with actual DB lookup
    return 'free';
  }

  /**
   * Get model configuration
   */
  getModelConfig(model: string): any {
    return this.modelConfig[model as keyof typeof this.modelConfig];
  }

  /**
   * List available models
   */
  listModels(): string[] {
    return Object.keys(this.modelConfig);
  }
}
