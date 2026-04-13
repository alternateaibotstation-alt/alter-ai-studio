/**
 * Onboarding Funnel System
 * Guides new users through first-run experience with 30-second quick win
 */

export type OnboardingStep = 'welcome' | 'profile' | 'quick_demo' | 'first_generation' | 'share' | 'complete';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface OnboardingFlow {
  userId: string;
  currentStep: OnboardingStep;
  status: OnboardingStatus;
  completedSteps: OnboardingStep[];
  startedAt: Date;
  completedAt?: Date;
  timeToComplete?: number; // in seconds
}

export interface QuickWinTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  expectedOutput: string;
  estimatedTime: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface OnboardingMetrics {
  userId: string;
  step: OnboardingStep;
  timeSpent: number; // in seconds
  completed: boolean;
  skipped: boolean;
  completedAt?: Date;
}

/**
 * OnboardingEngine - Manages user onboarding flow
 */
export class OnboardingEngine {
  private supabase: any;
  private flows: Map<string, OnboardingFlow> = new Map();
  private quickWinTemplates: QuickWinTemplate[] = [];

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
    this.initializeQuickWinTemplates();
  }

  /**
   * Initialize onboarding for new user
   */
  async initializeOnboarding(userId: string): Promise<OnboardingFlow> {
    const flow: OnboardingFlow = {
      userId,
      currentStep: 'welcome',
      status: 'in_progress',
      completedSteps: [],
      startedAt: new Date(),
    };

    const { error } = await this.supabase.from('onboarding_flows').insert({
      user_id: userId,
      current_step: flow.currentStep,
      status: flow.status,
      completed_steps: flow.completedSteps,
      started_at: flow.startedAt.toISOString(),
    });

    if (error) console.error('Error initializing onboarding:', error);

    this.flows.set(userId, flow);
    return flow;
  }

  /**
   * Get onboarding flow
   */
  async getOnboardingFlow(userId: string): Promise<OnboardingFlow | null> {
    if (this.flows.has(userId)) {
      return this.flows.get(userId) || null;
    }

    const { data, error } = await this.supabase
      .from('onboarding_flows')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;

    const flow: OnboardingFlow = {
      userId: data.user_id,
      currentStep: data.current_step,
      status: data.status,
      completedSteps: data.completed_steps || [],
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      timeToComplete: data.time_to_complete,
    };

    this.flows.set(userId, flow);
    return flow;
  }

  /**
   * Complete onboarding step
   */
  async completeStep(userId: string, step: OnboardingStep): Promise<OnboardingFlow> {
    const flow = await this.getOnboardingFlow(userId);
    if (!flow) throw new Error('Onboarding flow not found');

    if (!flow.completedSteps.includes(step)) {
      flow.completedSteps.push(step);
    }

    // Determine next step
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'quick_demo', 'first_generation', 'share', 'complete'];
    const currentIndex = stepOrder.indexOf(step);
    const nextStep = currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : 'complete';

    flow.currentStep = nextStep;

    // Check if all steps completed
    if (nextStep === 'complete') {
      flow.status = 'completed';
      flow.completedAt = new Date();
      flow.timeToComplete = Math.floor((flow.completedAt.getTime() - flow.startedAt.getTime()) / 1000);
    }

    // Update database
    const { error } = await this.supabase
      .from('onboarding_flows')
      .update({
        current_step: flow.currentStep,
        status: flow.status,
        completed_steps: flow.completedSteps,
        completed_at: flow.completedAt?.toISOString(),
        time_to_complete: flow.timeToComplete,
      })
      .eq('user_id', userId);

    if (error) console.error('Error completing step:', error);

    // Record metrics
    await this.recordMetrics(userId, step, true);

    this.flows.set(userId, flow);
    return flow;
  }

  /**
   * Skip onboarding step
   */
  async skipStep(userId: string, step: OnboardingStep): Promise<OnboardingFlow> {
    const flow = await this.getOnboardingFlow(userId);
    if (!flow) throw new Error('Onboarding flow not found');

    // Record metrics
    await this.recordMetrics(userId, step, false);

    // Skip to next step
    return this.completeStep(userId, step);
  }

  /**
   * Get quick win template
   */
  getQuickWinTemplate(): QuickWinTemplate {
    // Return a random quick win template
    return this.quickWinTemplates[Math.floor(Math.random() * this.quickWinTemplates.length)];
  }

  /**
   * Generate first content with quick win
   */
  async generateFirstContent(userId: string, prompt: string): Promise<any> {
    const template = this.getQuickWinTemplate();

    // Use the quick win template with user's input
    const finalPrompt = `${template.prompt}\n\nUser input: ${prompt}`;

    return {
      templateId: template.id,
      prompt: finalPrompt,
      expectedOutput: template.expectedOutput,
      estimatedTime: template.estimatedTime,
    };
  }

  /**
   * Record onboarding metrics
   */
  private async recordMetrics(
    userId: string,
    step: OnboardingStep,
    completed: boolean
  ): Promise<void> {
    const { error } = await this.supabase.from('onboarding_metrics').insert({
      user_id: userId,
      step,
      completed,
      skipped: !completed,
      completed_at: completed ? new Date().toISOString() : null,
    });

    if (error) console.error('Error recording metrics:', error);
  }

  /**
   * Initialize quick win templates
   */
  private initializeQuickWinTemplates(): void {
    this.quickWinTemplates = [
      {
        id: 'qw_twitter_hook',
        name: 'Twitter Hook Generator',
        description: 'Generate a viral Twitter hook in 30 seconds',
        category: 'social',
        prompt: 'Generate a catchy, viral Twitter hook about [TOPIC] that gets engagement. Make it punchy and under 280 characters.',
        expectedOutput: 'A single compelling Twitter hook',
        estimatedTime: 10,
        difficulty: 'easy',
      },
      {
        id: 'qw_email_subject',
        name: 'Email Subject Line',
        description: 'Create a high-converting email subject line',
        category: 'email',
        prompt: 'Generate 3 high-converting email subject lines for [TOPIC]. Make them curiosity-driven and compelling.',
        expectedOutput: '3 email subject line options',
        estimatedTime: 15,
        difficulty: 'easy',
      },
      {
        id: 'qw_linkedin_post',
        name: 'LinkedIn Post',
        description: 'Write a professional LinkedIn post',
        category: 'social',
        prompt: 'Write a professional LinkedIn post about [TOPIC] that drives engagement. Include a call-to-action.',
        expectedOutput: 'A complete LinkedIn post',
        estimatedTime: 20,
        difficulty: 'easy',
      },
      {
        id: 'qw_product_description',
        name: 'Product Description',
        description: 'Generate a compelling product description',
        category: 'sales',
        prompt: 'Write a compelling product description for [TOPIC]. Focus on benefits, not features. Include a call-to-action.',
        expectedOutput: 'A product description (100-150 words)',
        estimatedTime: 25,
        difficulty: 'medium',
      },
      {
        id: 'qw_blog_intro',
        name: 'Blog Post Introduction',
        description: 'Write an engaging blog post intro',
        category: 'content',
        prompt: 'Write an engaging introduction for a blog post about [TOPIC]. Hook the reader in the first 2 sentences.',
        expectedOutput: 'A blog post introduction (50-100 words)',
        estimatedTime: 20,
        difficulty: 'medium',
      },
      {
        id: 'qw_sales_email',
        name: 'Sales Email Copy',
        description: 'Create a sales email template',
        category: 'email',
        prompt: 'Write a persuasive sales email for [TOPIC]. Include: subject line, greeting, hook, value proposition, CTA.',
        expectedOutput: 'A complete sales email',
        estimatedTime: 30,
        difficulty: 'medium',
      },
    ];
  }
}

/**
 * OnboardingUI - Manages UI state for onboarding
 */
export class OnboardingUI {
  /**
   * Get step configuration
   */
  static getStepConfig(step: OnboardingStep): Record<string, any> {
    const configs: Record<OnboardingStep, Record<string, any>> = {
      welcome: {
        title: 'Welcome to Alter AI',
        description: 'The AI Monetization Engine for Creators',
        duration: 10,
        action: 'Get Started',
        content: {
          heading: 'Create, Monetize & Distribute AI-Powered Content',
          subheading: 'Generate viral content in 30 seconds',
          features: [
            'AI-powered content generation',
            'Multi-platform distribution',
            'Built-in monetization',
            'Affiliate embedding',
          ],
        },
      },
      profile: {
        title: 'Set Up Your Profile',
        description: 'Tell us about yourself',
        duration: 30,
        action: 'Continue',
        fields: ['username', 'bio', 'avatar'],
      },
      quick_demo: {
        title: 'See It In Action',
        description: 'Watch a 30-second demo',
        duration: 30,
        action: 'Try It',
        content: {
          videoUrl: '/demo-video.mp4',
          transcript: 'Watch how to generate your first piece of content',
        },
      },
      first_generation: {
        title: 'Generate Your First Content',
        description: 'Create something amazing in 30 seconds',
        duration: 30,
        action: 'Generate',
        content: {
          prompt: 'What would you like to create?',
          templates: [
            'Twitter Hook',
            'Email Subject',
            'LinkedIn Post',
            'Product Description',
          ],
        },
      },
      share: {
        title: 'Share Your Content',
        description: 'Start earning with affiliate links',
        duration: 20,
        action: 'Share Now',
        platforms: ['Twitter', 'LinkedIn', 'Email', 'Copy Link'],
      },
      complete: {
        title: 'You\'re All Set!',
        description: 'Start creating and monetizing',
        duration: 10,
        action: 'Go to Dashboard',
        content: {
          message: 'You\'ve completed the onboarding. Start creating content now!',
          nextSteps: [
            'Explore the template marketplace',
            'Create your first campaign',
            'Set up your creator profile',
          ],
        },
      },
    };

    return configs[step] || {};
  }

  /**
   * Get progress percentage
   */
  static getProgress(completedSteps: OnboardingStep[]): number {
    const totalSteps = 6;
    return Math.round((completedSteps.length / totalSteps) * 100);
  }

  /**
   * Get remaining time estimate
   */
  static getRemainingTime(currentStep: OnboardingStep): number {
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'quick_demo', 'first_generation', 'share', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const remainingSteps = stepOrder.slice(currentIndex);

    const timePerStep: Record<OnboardingStep, number> = {
      welcome: 10,
      profile: 30,
      quick_demo: 30,
      first_generation: 30,
      share: 20,
      complete: 10,
    };

    return remainingSteps.reduce((total, step) => total + (timePerStep[step] || 0), 0);
  }
}

/**
 * OnboardingAnalytics - Tracks onboarding performance
 */
export class OnboardingAnalytics {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get onboarding completion rate
   */
  async getCompletionRate(): Promise<number> {
    const { data, error } = await this.supabase
      .from('onboarding_flows')
      .select('status', { count: 'exact' })
      .eq('status', 'completed');

    const { data: allData, error: allError } = await this.supabase
      .from('onboarding_flows')
      .select('id', { count: 'exact' });

    if (error || allError) return 0;

    const completed = data?.length || 0;
    const total = allData?.length || 1;

    return (completed / total) * 100;
  }

  /**
   * Get average time to complete
   */
  async getAverageTimeToComplete(): Promise<number> {
    const { data, error } = await this.supabase
      .from('onboarding_flows')
      .select('time_to_complete')
      .eq('status', 'completed')
      .not('time_to_complete', 'is', null);

    if (error || !data || data.length === 0) return 0;

    const total = data.reduce((sum, item) => sum + (item.time_to_complete || 0), 0);
    return total / data.length;
  }

  /**
   * Get drop-off rate by step
   */
  async getDropOffByStep(): Promise<Record<OnboardingStep, number>> {
    const { data, error } = await this.supabase
      .from('onboarding_metrics')
      .select('step, completed', { count: 'exact' });

    if (error || !data) return {} as Record<OnboardingStep, number>;

    const stepCounts: Record<string, { total: number; completed: number }> = {};

    for (const item of data) {
      if (!stepCounts[item.step]) {
        stepCounts[item.step] = { total: 0, completed: 0 };
      }
      stepCounts[item.step].total++;
      if (item.completed) {
        stepCounts[item.step].completed++;
      }
    }

    const dropOff: Record<OnboardingStep, number> = {} as any;
    for (const [step, counts] of Object.entries(stepCounts)) {
      dropOff[step as OnboardingStep] = ((counts.total - counts.completed) / counts.total) * 100;
    }

    return dropOff;
  }
}
