/**
 * Content Studio Backend
 * Manages content creation workflows, templates, and generation
 */

import { ContentPipeline, PipelineInput, PipelineOutput, ContentWorkflow, PromptTemplateEngine, PromptTemplate } from './pipeline';

export interface ContentStudioSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  workflow?: ContentWorkflow;
  outputs: PipelineOutput[];
}

export interface ContentBatch {
  id: string;
  userId: string;
  name: string;
  description?: string;
  inputs: PipelineInput[];
  outputs: PipelineOutput[];
  status: 'draft' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  promptTemplate: PromptTemplate;
  defaultPlatforms: string[];
  defaultTone?: string;
  defaultStyle?: string;
  isPublic: boolean;
  usageCount: number;
}

/**
 * ContentStudio - Main content creation orchestrator
 */
export class ContentStudio {
  private pipeline: ContentPipeline;
  private promptEngine: PromptTemplateEngine;
  private sessions: Map<string, ContentStudioSession> = new Map();
  private batches: Map<string, ContentBatch> = new Map();
  private templates: Map<string, ContentTemplate> = new Map();

  constructor() {
    this.pipeline = new ContentPipeline();
    this.promptEngine = new PromptTemplateEngine();
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new content studio session
   */
  createSession(userId: string): ContentStudioSession {
    const sessionId = this.generateId('session');
    const session: ContentStudioSession = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      outputs: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ContentStudioSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Generate content in a session
   */
  async generateContent(
    sessionId: string,
    input: PipelineInput
  ): Promise<PipelineOutput> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const output = await this.pipeline.process(input);
    session.outputs.push(output);
    session.updatedAt = new Date();

    return output;
  }

  /**
   * Create a content batch
   */
  createBatch(userId: string, name: string, description?: string): ContentBatch {
    const batchId = this.generateId('batch');
    const batch: ContentBatch = {
      id: batchId,
      userId,
      name,
      description,
      inputs: [],
      outputs: [],
      status: 'draft',
      createdAt: new Date(),
    };

    this.batches.set(batchId, batch);
    return batch;
  }

  /**
   * Add input to batch
   */
  addToBatch(batchId: string, input: PipelineInput): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    batch.inputs.push(input);
  }

  /**
   * Process entire batch
   */
  async processBatch(batchId: string): Promise<ContentBatch> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    batch.status = 'processing';

    try {
      for (const input of batch.inputs) {
        const output = await this.pipeline.process(input);
        batch.outputs.push(output);
      }

      batch.status = 'completed';
      batch.completedAt = new Date();
    } catch (error) {
      batch.status = 'failed';
    }

    return batch;
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: string): ContentBatch | undefined {
    return this.batches.get(batchId);
  }

  /**
   * Register a content template
   */
  registerTemplate(template: ContentTemplate): void {
    this.templates.set(template.id, template);
    this.promptEngine.registerTemplate(template.promptTemplate);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ContentTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List all templates
   */
  listTemplates(category?: string): ContentTemplate[] {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter((t) => t.category === category);
    }
    return templates;
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): ContentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Generate content from template
   */
  async generateFromTemplate(
    sessionId: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<PipelineOutput> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Render prompt template
    const prompt = this.promptEngine.renderTemplate(
      template.promptTemplate.id,
      variables
    );

    // Create pipeline input
    const input: PipelineInput = {
      prompt,
      contentType: 'text',
      platforms: template.defaultPlatforms as any,
      tone: template.defaultTone,
      style: template.defaultStyle,
    };

    const output = await this.pipeline.process(input);
    session.outputs.push(output);
    session.updatedAt = new Date();

    // Increment usage count
    template.usageCount++;

    return output;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // LinkedIn thought leadership template
    const linkedinTemplate: ContentTemplate = {
      id: 'tpl_linkedin_thought_leadership',
      name: 'LinkedIn Thought Leadership',
      category: 'professional',
      description: 'Create engaging LinkedIn posts about industry insights',
      promptTemplate: {
        id: 'prompt_linkedin_tl',
        name: 'LinkedIn Thought Leadership Prompt',
        prompt: `Create a LinkedIn post about {{topic}} that:
- Opens with a compelling hook or question
- Shares 3-5 key insights
- Includes a call-to-action
- Uses professional tone
- Is suitable for LinkedIn audience`,
        variables: ['topic'],
        category: 'professional',
        platforms: ['linkedin'],
        tone: 'professional',
      },
      defaultPlatforms: ['linkedin'],
      defaultTone: 'professional',
      isPublic: true,
      usageCount: 0,
    };

    // TikTok viral content template
    const tiktokTemplate: ContentTemplate = {
      id: 'tpl_tiktok_viral',
      name: 'TikTok Viral Content',
      category: 'entertainment',
      description: 'Generate viral TikTok content ideas',
      promptTemplate: {
        id: 'prompt_tiktok_viral',
        name: 'TikTok Viral Prompt',
        prompt: `Create a TikTok content idea about {{topic}} that:
- Has an attention-grabbing hook (first 3 seconds)
- Is entertaining and shareable
- Uses trending sounds/music suggestions
- Includes hashtag recommendations
- Is between 15-60 seconds long`,
        variables: ['topic'],
        category: 'entertainment',
        platforms: ['tiktok'],
        tone: 'casual',
      },
      defaultPlatforms: ['tiktok'],
      defaultTone: 'casual',
      isPublic: true,
      usageCount: 0,
    };

    // Email marketing template
    const emailTemplate: ContentTemplate = {
      id: 'tpl_email_marketing',
      name: 'Email Marketing Campaign',
      category: 'marketing',
      description: 'Create compelling email marketing content',
      promptTemplate: {
        id: 'prompt_email_marketing',
        name: 'Email Marketing Prompt',
        prompt: `Create an email marketing message for {{product}} that:
- Has a compelling subject line
- Opens with a hook
- Highlights {{key_benefit}}
- Includes social proof or testimonial
- Has a clear CTA
- Is conversational and engaging`,
        variables: ['product', 'key_benefit'],
        category: 'marketing',
        platforms: ['email'],
        tone: 'friendly',
      },
      defaultPlatforms: ['email'],
      defaultTone: 'friendly',
      isPublic: true,
      usageCount: 0,
    };

    // Blog post template
    const blogTemplate: ContentTemplate = {
      id: 'tpl_blog_post',
      name: 'Blog Post Generator',
      category: 'content',
      description: 'Generate comprehensive blog posts',
      promptTemplate: {
        id: 'prompt_blog_post',
        name: 'Blog Post Prompt',
        prompt: `Write a blog post about {{topic}} that:
- Has an engaging title
- Includes an introduction
- Has 3-5 main sections with headers
- Includes practical examples
- Has a conclusion with CTA
- Is SEO-optimized
- Is approximately 1500-2000 words`,
        variables: ['topic'],
        category: 'content',
        platforms: ['blog'],
        tone: 'professional',
      },
      defaultPlatforms: ['blog'],
      defaultTone: 'professional',
      isPublic: true,
      usageCount: 0,
    };

    this.registerTemplate(linkedinTemplate);
    this.registerTemplate(tiktokTemplate);
    this.registerTemplate(emailTemplate);
    this.registerTemplate(blogTemplate);
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pipeline
   */
  getPipeline(): ContentPipeline {
    return this.pipeline;
  }

  /**
   * Get prompt engine
   */
  getPromptEngine(): PromptTemplateEngine {
    return this.promptEngine;
  }
}

/**
 * MultiStepWorkflowBuilder - Builds complex multi-step workflows
 */
export class MultiStepWorkflowBuilder {
  private steps: any[] = [];
  private workflowName: string;

  constructor(name: string) {
    this.workflowName = name;
  }

  /**
   * Add AI generation step
   */
  addGenerationStep(config: Record<string, any>): this {
    this.steps.push({
      id: `step_${this.steps.length}`,
      name: config.name || 'Generate',
      type: 'ai_generate',
      config,
      enabled: true,
    });
    return this;
  }

  /**
   * Add refinement step
   */
  addRefinementStep(config: Record<string, any>): this {
    this.steps.push({
      id: `step_${this.steps.length}`,
      name: config.name || 'Refine',
      type: 'ai_refine',
      config,
      enabled: true,
    });
    return this;
  }

  /**
   * Add formatting step
   */
  addFormattingStep(config: Record<string, any>): this {
    this.steps.push({
      id: `step_${this.steps.length}`,
      name: config.name || 'Format',
      type: 'format',
      config,
      enabled: true,
    });
    return this;
  }

  /**
   * Add validation step
   */
  addValidationStep(config: Record<string, any>): this {
    this.steps.push({
      id: `step_${this.steps.length}`,
      name: config.name || 'Validate',
      type: 'validate',
      config,
      enabled: true,
    });
    return this;
  }

  /**
   * Build the workflow
   */
  build(): ContentWorkflow {
    return {
      id: `workflow_${Date.now()}`,
      name: this.workflowName,
      steps: this.steps,
    };
  }
}
