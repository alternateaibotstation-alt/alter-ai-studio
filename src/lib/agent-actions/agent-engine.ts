/**
 * Agent Actions Layer
 * Enables AI agents to take actions, call APIs, and automate workflows
 */

export type ToolType = 'api' | 'webhook' | 'database' | 'file' | 'email' | 'slack' | 'twitter' | 'linkedin' | 'custom';
export type ActionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  schema: Record<string, any>;
  handler: (params: Record<string, any>) => Promise<any>;
  requiresAuth: boolean;
  rateLimit?: number;
}

export interface Action {
  id: string;
  agentId: string;
  tool: Tool;
  params: Record<string, any>;
  status: ActionStatus;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  actions: Action[];
  conditions?: string[];
  enabled: boolean;
}

export interface APITool extends Tool {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key' | 'oauth2';
    token?: string;
    apiKey?: string;
  };
}

/**
 * ToolRegistry - Manages available tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private toolsByType: Map<ToolType, Tool[]> = new Map();

  constructor() {
    this.initializeDefaultTools();
  }

  /**
   * Register a tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.id, tool);

    if (!this.toolsByType.has(tool.type)) {
      this.toolsByType.set(tool.type, []);
    }
    this.toolsByType.get(tool.type)!.push(tool);
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Get tools by type
   */
  getToolsByType(type: ToolType): Tool[] {
    return this.toolsByType.get(type) || [];
  }

  /**
   * List all tools
   */
  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Search tools
   */
  searchTools(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Initialize default tools
   */
  private initializeDefaultTools(): void {
    // HTTP API Tool
    const httpTool: APITool = {
      id: 'tool_http_api',
      name: 'HTTP API Call',
      description: 'Make HTTP requests to external APIs',
      type: 'api',
      endpoint: '',
      method: 'GET',
      schema: {
        endpoint: { type: 'string', required: true },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
        headers: { type: 'object' },
        body: { type: 'object' },
      },
      handler: async (params) => {
        const response = await fetch(params.endpoint, {
          method: params.method || 'GET',
          headers: params.headers || {},
          body: params.body ? JSON.stringify(params.body) : undefined,
        });
        return response.json();
      },
      requiresAuth: false,
    };

    // Webhook Tool
    const webhookTool: Tool = {
      id: 'tool_webhook',
      name: 'Webhook Trigger',
      description: 'Trigger webhooks for external integrations',
      type: 'webhook',
      schema: {
        url: { type: 'string', required: true },
        payload: { type: 'object' },
      },
      handler: async (params) => {
        const response = await fetch(params.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params.payload || {}),
        });
        return { status: response.status, success: response.ok };
      },
      requiresAuth: false,
    };

    // Email Tool
    const emailTool: Tool = {
      id: 'tool_email',
      name: 'Send Email',
      description: 'Send emails via email service',
      type: 'email',
      schema: {
        to: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        body: { type: 'string', required: true },
        html: { type: 'boolean' },
      },
      handler: async (params) => {
        // Implementation would use email service like SendGrid, Mailgun, etc.
        return { sent: true, messageId: `msg_${Date.now()}` };
      },
      requiresAuth: true,
    };

    // Slack Tool
    const slackTool: Tool = {
      id: 'tool_slack',
      name: 'Send Slack Message',
      description: 'Send messages to Slack channels',
      type: 'slack',
      schema: {
        channel: { type: 'string', required: true },
        message: { type: 'string', required: true },
        blocks: { type: 'array' },
      },
      handler: async (params) => {
        // Implementation would use Slack API
        return { ok: true, ts: `${Date.now()}` };
      },
      requiresAuth: true,
    };

    // Twitter Tool
    const twitterTool: Tool = {
      id: 'tool_twitter',
      name: 'Post to Twitter',
      description: 'Post tweets to Twitter',
      type: 'twitter',
      schema: {
        text: { type: 'string', required: true },
        media_ids: { type: 'array' },
        reply_settings: { type: 'string' },
      },
      handler: async (params) => {
        // Implementation would use Twitter API v2
        return { id: `tweet_${Date.now()}`, created_at: new Date().toISOString() };
      },
      requiresAuth: true,
    };

    // LinkedIn Tool
    const linkedinTool: Tool = {
      id: 'tool_linkedin',
      name: 'Post to LinkedIn',
      description: 'Post content to LinkedIn',
      type: 'linkedin',
      schema: {
        text: { type: 'string', required: true },
        media: { type: 'array' },
      },
      handler: async (params) => {
        // Implementation would use LinkedIn API
        return { id: `post_${Date.now()}`, created_at: new Date().toISOString() };
      },
      requiresAuth: true,
    };

    this.registerTool(httpTool);
    this.registerTool(webhookTool);
    this.registerTool(emailTool);
    this.registerTool(slackTool);
    this.registerTool(twitterTool);
    this.registerTool(linkedinTool);
  }
}

/**
 * ActionExecutor - Executes actions and manages their lifecycle
 */
export class ActionExecutor {
  private toolRegistry: ToolRegistry;
  private executionHistory: Map<string, Action> = new Map();
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Execute an action
   */
  async executeAction(
    agentId: string,
    toolId: string,
    params: Record<string, any>
  ): Promise<Action> {
    const tool = this.toolRegistry.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Check rate limit
    if (tool.rateLimit) {
      this.checkRateLimit(toolId, tool.rateLimit);
    }

    const actionId = this.generateActionId();
    const action: Action = {
      id: actionId,
      agentId,
      tool,
      params,
      status: 'pending',
      createdAt: new Date(),
    };

    this.executionHistory.set(actionId, action);

    try {
      action.status = 'executing';
      action.executedAt = new Date();

      // Execute the tool
      const result = await tool.handler(params);

      action.status = 'completed';
      action.result = result;
      action.completedAt = new Date();
    } catch (error) {
      action.status = 'failed';
      action.error = error instanceof Error ? error.message : 'Unknown error';
      action.completedAt = new Date();
    }

    return action;
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeSequence(
    agentId: string,
    actions: Array<{ toolId: string; params: Record<string, any> }>
  ): Promise<Action[]> {
    const results: Action[] = [];

    for (const actionConfig of actions) {
      const action = await this.executeAction(agentId, actionConfig.toolId, actionConfig.params);
      results.push(action);

      // If action failed, stop the sequence
      if (action.status === 'failed') {
        break;
      }
    }

    return results;
  }

  /**
   * Execute actions in parallel
   */
  async executeParallel(
    agentId: string,
    actions: Array<{ toolId: string; params: Record<string, any> }>
  ): Promise<Action[]> {
    const promises = actions.map((actionConfig) =>
      this.executeAction(agentId, actionConfig.toolId, actionConfig.params)
    );

    return Promise.all(promises);
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): Action | undefined {
    return this.executionHistory.get(actionId);
  }

  /**
   * Get agent actions
   */
  getAgentActions(agentId: string): Action[] {
    return Array.from(this.executionHistory.values()).filter((a) => a.agentId === agentId);
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(toolId: string, limit: number): void {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    if (!this.rateLimitTracker.has(toolId)) {
      this.rateLimitTracker.set(toolId, []);
    }

    const timestamps = this.rateLimitTracker.get(toolId)!;
    const recentTimestamps = timestamps.filter((t) => t > windowStart);

    if (recentTimestamps.length >= limit) {
      throw new Error(`Rate limit exceeded for tool: ${toolId}`);
    }

    recentTimestamps.push(now);
    this.rateLimitTracker.set(toolId, recentTimestamps);
  }

  /**
   * Generate action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * WorkflowEngine - Manages and executes workflows
 */
export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private actionExecutor: ActionExecutor;
  private toolRegistry: ToolRegistry;

  constructor(actionExecutor: ActionExecutor, toolRegistry: ToolRegistry) {
    this.actionExecutor = actionExecutor;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Create a workflow
   */
  createWorkflow(
    name: string,
    trigger: string,
    actions: Array<{ toolId: string; params: Record<string, any> }>,
    description?: string
  ): Workflow {
    const workflowId = this.generateWorkflowId();

    const workflow: Workflow = {
      id: workflowId,
      name,
      description,
      trigger,
      actions: actions.map((a) => ({
        id: `action_${Date.now()}`,
        agentId: workflowId,
        tool: this.toolRegistry.getTool(a.toolId)!,
        params: a.params,
        status: 'pending',
        createdAt: new Date(),
      })),
      enabled: true,
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string): Promise<Action[]> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    const actions: Array<{ toolId: string; params: Record<string, any> }> = workflow.actions.map(
      (a) => ({
        toolId: a.tool.id,
        params: a.params,
      })
    );

    return this.actionExecutor.executeSequence(workflowId, actions);
  }

  /**
   * Get workflow
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List workflows
   */
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Enable/disable workflow
   */
  setWorkflowEnabled(workflowId: string, enabled: boolean): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.enabled = enabled;
    }
  }

  /**
   * Generate workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * AgentEngine - Main orchestrator for agent actions
 */
export class AgentEngine {
  private toolRegistry: ToolRegistry;
  private actionExecutor: ActionExecutor;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.actionExecutor = new ActionExecutor(this.toolRegistry);
    this.workflowEngine = new WorkflowEngine(this.actionExecutor, this.toolRegistry);
  }

  /**
   * Get tool registry
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Get action executor
   */
  getActionExecutor(): ActionExecutor {
    return this.actionExecutor;
  }

  /**
   * Get workflow engine
   */
  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  /**
   * Register custom tool
   */
  registerTool(tool: Tool): void {
    this.toolRegistry.registerTool(tool);
  }

  /**
   * Execute action
   */
  async executeAction(
    agentId: string,
    toolId: string,
    params: Record<string, any>
  ): Promise<Action> {
    return this.actionExecutor.executeAction(agentId, toolId, params);
  }

  /**
   * Create and execute workflow
   */
  async createAndExecuteWorkflow(
    name: string,
    trigger: string,
    actions: Array<{ toolId: string; params: Record<string, any> }>
  ): Promise<Action[]> {
    const workflow = this.workflowEngine.createWorkflow(name, trigger, actions);
    return this.workflowEngine.executeWorkflow(workflow.id);
  }
}
