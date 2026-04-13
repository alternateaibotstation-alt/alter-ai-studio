/**
 * Content Creator Engine - Pipeline System
 * Manages content generation workflows from input to output
 */

export type PipelineStage = 'input' | 'generate' | 'refine' | 'format' | 'export';
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'mixed';
export type Platform = 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'pinterest' | 'youtube' | 'blog';

export interface PipelineInput {
  prompt: string;
  contentType: ContentType;
  platforms: Platform[];
  tone?: string;
  style?: string;
  metadata?: Record<string, any>;
}

export interface PipelineOutput {
  id: string;
  originalPrompt: string;
  content: Record<Platform, string>;
  metadata: Record<string, any>;
  status: 'completed' | 'failed' | 'processing';
  createdAt: Date;
  processingTimeMs: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'ai_generate' | 'ai_refine' | 'format' | 'validate' | 'export';
  config: Record<string, any>;
  inputs?: string[];
  outputs?: string[];
  enabled: boolean;
}

export interface ContentWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers?: string[];
  metadata?: Record<string, any>;
}

/**
 * ContentPipeline - Orchestrates content through multiple stages
 */
export class ContentPipeline {
  private stages: Map<PipelineStage, PipelineProcessor> = new Map();
  private workflows: Map<string, ContentWorkflow> = new Map();

  constructor() {
    this.initializeStages();
  }

  /**
   * Initialize default pipeline stages
   */
  private initializeStages(): void {
    this.stages.set('input', new InputProcessor());
    this.stages.set('generate', new GenerationProcessor());
    this.stages.set('refine', new RefinementProcessor());
    this.stages.set('format', new FormattingProcessor());
    this.stages.set('export', new ExportProcessor());
  }

  /**
   * Process content through the pipeline
   */
  async process(input: PipelineInput): Promise<PipelineOutput> {
    const startTime = Date.now();
    const outputId = this.generateId();

    try {
      // Stage 1: Validate input
      const inputProcessor = this.stages.get('input')!;
      const validatedInput = await inputProcessor.process(input);

      // Stage 2: Generate content
      const generationProcessor = this.stages.get('generate')!;
      const generatedContent = await generationProcessor.process(validatedInput);

      // Stage 3: Refine content
      const refinementProcessor = this.stages.get('refine')!;
      const refinedContent = await refinementProcessor.process(generatedContent);

      // Stage 4: Format for platforms
      const formattingProcessor = this.stages.get('format')!;
      const formattedContent = await formattingProcessor.process(refinedContent);

      // Stage 5: Export
      const exportProcessor = this.stages.get('export')!;
      const finalOutput = await exportProcessor.process(formattedContent);

      const processingTime = Date.now() - startTime;

      return {
        id: outputId,
        originalPrompt: input.prompt,
        content: finalOutput,
        metadata: {
          contentType: input.contentType,
          platforms: input.platforms,
          tone: input.tone,
          style: input.style,
        },
        status: 'completed',
        createdAt: new Date(),
        processingTimeMs: processingTime,
      };
    } catch (error) {
      return {
        id: outputId,
        originalPrompt: input.prompt,
        content: {},
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'failed',
        createdAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Register a custom workflow
   */
  registerWorkflow(workflow: ContentWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Execute a custom workflow
   */
  async executeWorkflow(workflowId: string, input: PipelineInput): Promise<PipelineOutput> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const startTime = Date.now();
    const outputId = this.generateId();
    let currentOutput: any = input;

    try {
      for (const step of workflow.steps) {
        if (!step.enabled) continue;

        currentOutput = await this.executeStep(step, currentOutput);
      }

      return {
        id: outputId,
        originalPrompt: input.prompt,
        content: currentOutput,
        metadata: { workflow: workflowId },
        status: 'completed',
        createdAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: outputId,
        originalPrompt: input.prompt,
        content: {},
        metadata: { error: error instanceof Error ? error.message : 'Unknown error', workflow: workflowId },
        status: 'failed',
        createdAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, input: any): Promise<any> {
    switch (step.type) {
      case 'ai_generate':
        return this.stages.get('generate')!.process(input);
      case 'ai_refine':
        return this.stages.get('refine')!.process(input);
      case 'format':
        return this.stages.get('format')!.process(input);
      case 'validate':
        return this.validateContent(input, step.config);
      case 'export':
        return this.stages.get('export')!.process(input);
      default:
        return input;
    }
  }

  /**
   * Validate content
   */
  private validateContent(content: any, config: Record<string, any>): any {
    // Implement validation logic
    return content;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): ContentWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  listWorkflows(): ContentWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * PipelineProcessor - Base class for pipeline stages
 */
abstract class PipelineProcessor {
  abstract process(input: any): Promise<any>;
}

/**
 * InputProcessor - Validates and normalizes input
 */
class InputProcessor extends PipelineProcessor {
  async process(input: PipelineInput): Promise<PipelineInput> {
    if (!input.prompt || input.prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (!input.contentType) {
      throw new Error('Content type is required');
    }

    if (!input.platforms || input.platforms.length === 0) {
      throw new Error('At least one platform must be specified');
    }

    return {
      ...input,
      prompt: input.prompt.trim(),
      tone: input.tone || 'neutral',
      style: input.style || 'standard',
    };
  }
}

/**
 * GenerationProcessor - Generates content using AI
 */
class GenerationProcessor extends PipelineProcessor {
  async process(input: PipelineInput): Promise<any> {
    // This will call the AI engine
    // For now, returning a placeholder
    return {
      ...input,
      generatedContent: `Generated content for: ${input.prompt}`,
      contentType: input.contentType,
    };
  }
}

/**
 * RefinementProcessor - Refines generated content
 */
class RefinementProcessor extends PipelineProcessor {
  async process(input: any): Promise<any> {
    // Apply refinement rules based on tone and style
    const refinementRules = this.getRefinementRules(input.tone, input.style);

    let refinedContent = input.generatedContent;

    for (const rule of refinementRules) {
      refinedContent = rule(refinedContent);
    }

    return {
      ...input,
      refinedContent,
    };
  }

  private getRefinementRules(tone: string, style: string): Array<(text: string) => string> {
    const rules: Array<(text: string) => string> = [];

    // Tone-based rules
    if (tone === 'professional') {
      rules.push((text) => text.replace(/lol|omg|haha/gi, ''));
    } else if (tone === 'casual') {
      rules.push((text) => text.replace(/(?:^|\s)(?:the|a|an)(?:\s|$)/gi, ' '));
    }

    // Style-based rules
    if (style === 'concise') {
      rules.push((text) => text.split('.').slice(0, 3).join('. '));
    }

    return rules;
  }
}

/**
 * FormattingProcessor - Formats content for different platforms
 */
class FormattingProcessor extends PipelineProcessor {
  async process(input: any): Promise<Record<Platform, string>> {
    const formatted: Record<Platform, string> = {} as any;
    const content = input.refinedContent || input.generatedContent;

    for (const platform of input.platforms) {
      formatted[platform] = this.formatForPlatform(content, platform);
    }

    return formatted;
  }

  private formatForPlatform(content: string, platform: Platform): string {
    const platformConfigs: Record<Platform, { maxLength: number; hashtagStyle: string }> = {
      tiktok: { maxLength: 2200, hashtagStyle: 'end' },
      instagram: { maxLength: 2200, hashtagStyle: 'end' },
      twitter: { maxLength: 280, hashtagStyle: 'inline' },
      linkedin: { maxLength: 3000, hashtagStyle: 'inline' },
      facebook: { maxLength: 63206, hashtagStyle: 'inline' },
      pinterest: { maxLength: 500, hashtagStyle: 'inline' },
      youtube: { maxLength: 5000, hashtagStyle: 'inline' },
      blog: { maxLength: 100000, hashtagStyle: 'none' },
    };

    const config = platformConfigs[platform];
    let formatted = content;

    // Enforce length limit
    if (formatted.length > config.maxLength) {
      formatted = formatted.substring(0, config.maxLength - 3) + '...';
    }

    // Handle hashtags
    if (config.hashtagStyle === 'end') {
      const hashtags = this.extractHashtags(formatted);
      formatted = formatted.replace(/#\w+/g, '');
      formatted += ' ' + hashtags.join(' ');
    }

    return formatted.trim();
  }

  private extractHashtags(text: string): string[] {
    const matches = text.match(/#\w+/g) || [];
    return matches.slice(0, 5); // Limit to 5 hashtags
  }
}

/**
 * ExportProcessor - Prepares content for export
 */
class ExportProcessor extends PipelineProcessor {
  async process(input: Record<Platform, string>): Promise<Record<Platform, string>> {
    // Add metadata and prepare for storage
    return input;
  }
}

/**
 * PromptTemplateEngine - Manages reusable prompt templates
 */
export class PromptTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let rendered = template.prompt;

    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return rendered;
  }

  /**
   * List all templates
   */
  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  variables: string[];
  category: string;
  platforms: Platform[];
  tone?: string;
  style?: string;
}
