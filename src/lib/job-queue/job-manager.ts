/**
 * Job Queue System
 * Manages async job processing, background workers, and status tracking
 */

export type JobType = 'content_generation' | 'image_generation' | 'video_generation' | 'audio_generation' | 'batch_processing' | 'export' | 'webhook';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  userId: string;
  data: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface JobQueue {
  name: string;
  jobs: Map<string, Job>;
  processing: Set<string>;
  failed: Map<string, Job>;
}

export interface WorkerConfig {
  id: string;
  type: JobType;
  concurrency: number;
  timeout: number;
  handler: (job: Job) => Promise<any>;
}

/**
 * JobManager - Manages job lifecycle and queue operations
 */
export class JobManager {
  private queues: Map<string, JobQueue> = new Map();
  private workers: Map<string, WorkerConfig> = new Map();
  private jobHistory: Map<string, Job> = new Map();
  private maxHistorySize: number = 10000;

  constructor() {
    this.initializeQueues();
  }

  /**
   * Initialize default queues
   */
  private initializeQueues(): void {
    const queueTypes: JobType[] = [
      'content_generation',
      'image_generation',
      'video_generation',
      'audio_generation',
      'batch_processing',
      'export',
      'webhook',
    ];

    for (const type of queueTypes) {
      this.queues.set(type, {
        name: type,
        jobs: new Map(),
        processing: new Set(),
        failed: new Map(),
      });
    }
  }

  /**
   * Create and queue a new job
   */
  createJob(
    type: JobType,
    userId: string,
    data: Record<string, any>,
    priority: JobPriority = 'normal',
    maxRetries: number = 3
  ): Job {
    const jobId = this.generateJobId();
    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
      priority,
      userId,
      data,
      retries: 0,
      maxRetries,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    queue.jobs.set(jobId, job);
    this.jobHistory.set(jobId, job);

    // Cleanup old history if needed
    if (this.jobHistory.size > this.maxHistorySize) {
      this.cleanupOldHistory();
    }

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobHistory.get(jobId);
  }

  /**
   * Get next job from queue
   */
  getNextJob(type: JobType): Job | undefined {
    const queue = this.queues.get(type);
    if (!queue) return undefined;

    // Get jobs sorted by priority and creation time
    const sortedJobs = Array.from(queue.jobs.values())
      .filter((job) => job.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder];

        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return sortedJobs[0];
  }

  /**
   * Mark job as processing
   */
  markAsProcessing(jobId: string): void {
    const job = this.jobHistory.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();

    const queue = this.queues.get(job.type);
    if (queue) {
      queue.processing.add(jobId);
    }
  }

  /**
   * Mark job as completed
   */
  markAsCompleted(jobId: string, result: Record<string, any>): void {
    const job = this.jobHistory.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.result = result;
    job.completedAt = new Date();

    const queue = this.queues.get(job.type);
    if (queue) {
      queue.processing.delete(jobId);
      queue.jobs.delete(jobId);
    }
  }

  /**
   * Mark job as failed
   */
  markAsFailed(jobId: string, error: string): void {
    const job = this.jobHistory.get(jobId);
    if (!job) return;

    job.error = error;
    job.retries++;

    const queue = this.queues.get(job.type);
    if (!queue) return;

    queue.processing.delete(jobId);

    if (job.retries < job.maxRetries) {
      // Retry the job
      job.status = 'pending';
      queue.jobs.set(jobId, job);
    } else {
      // Move to failed queue
      job.status = 'failed';
      queue.failed.set(jobId, job);
      queue.jobs.delete(jobId);
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): void {
    const job = this.jobHistory.get(jobId);
    if (!job) return;

    job.status = 'cancelled';

    const queue = this.queues.get(job.type);
    if (queue) {
      queue.processing.delete(jobId);
      queue.jobs.delete(jobId);
    }
  }

  /**
   * Register a worker
   */
  registerWorker(config: WorkerConfig): void {
    this.workers.set(config.id, config);
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): WorkerConfig | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get all workers for a job type
   */
  getWorkersForType(type: JobType): WorkerConfig[] {
    return Array.from(this.workers.values()).filter((w) => w.type === type);
  }

  /**
   * Get queue statistics
   */
  getQueueStats(type: JobType): Record<string, any> {
    const queue = this.queues.get(type);
    if (!queue) return {};

    return {
      type,
      pending: queue.jobs.size,
      processing: queue.processing.size,
      failed: queue.failed.size,
      total: queue.jobs.size + queue.processing.size + queue.failed.size,
    };
  }

  /**
   * Get all queue statistics
   */
  getAllQueueStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [type, queue] of this.queues) {
      stats[type] = {
        pending: queue.jobs.size,
        processing: queue.processing.size,
        failed: queue.failed.size,
        total: queue.jobs.size + queue.processing.size + queue.failed.size,
      };
    }

    return stats;
  }

  /**
   * Get user's jobs
   */
  getUserJobs(userId: string, type?: JobType): Job[] {
    const jobs: Job[] = [];

    for (const job of this.jobHistory.values()) {
      if (job.userId === userId && (!type || job.type === type)) {
        jobs.push(job);
      }
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cleanup old history
   */
  private cleanupOldHistory(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [jobId, job] of this.jobHistory) {
      if (now - job.createdAt.getTime() > maxAge) {
        this.jobHistory.delete(jobId);
      }
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue by type
   */
  getQueue(type: JobType): JobQueue | undefined {
    return this.queues.get(type);
  }

  /**
   * List all queues
   */
  listQueues(): JobQueue[] {
    return Array.from(this.queues.values());
  }
}

/**
 * JobWorker - Processes jobs from queue
 */
export class JobWorker {
  private config: WorkerConfig;
  private jobManager: JobManager;
  private isRunning: boolean = false;
  private activeJobs: Map<string, Promise<any>> = new Map();

  constructor(config: WorkerConfig, jobManager: JobManager) {
    this.config = config;
    this.jobManager = jobManager;
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`Worker ${this.config.id} started for type: ${this.config.type}`);

    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs.size < this.config.concurrency) {
          const job = this.jobManager.getNextJob(this.config.type);

          if (job) {
            this.processJob(job);
          } else {
            // No jobs available, wait before checking again
            await this.sleep(1000);
          }
        } else {
          // At max concurrency, wait
          await this.sleep(500);
        }
      } catch (error) {
        console.error(`Worker ${this.config.id} error:`, error);
        await this.sleep(1000);
      }
    }
  }

  /**
   * Stop the worker
   */
  stop(): void {
    this.isRunning = false;
    console.log(`Worker ${this.config.id} stopped`);
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    this.jobManager.markAsProcessing(job.id);

    const promise = this.executeJobWithTimeout(job);
    this.activeJobs.set(job.id, promise);

    try {
      const result = await promise;
      this.jobManager.markAsCompleted(job.id, result);
      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.jobManager.markAsFailed(job.id, errorMessage);
      console.error(`Job ${job.id} failed:`, errorMessage);
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Execute job with timeout
   */
  private async executeJobWithTimeout(job: Job): Promise<any> {
    return Promise.race([
      this.config.handler(job),
      this.createTimeout(this.config.timeout),
    ]);
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Job timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get active job count
   */
  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  /**
   * Get worker config
   */
  getConfig(): WorkerConfig {
    return this.config;
  }
}

/**
 * JobScheduler - Schedules jobs for delayed execution
 */
export class JobScheduler {
  private jobManager: JobManager;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(jobManager: JobManager) {
    this.jobManager = jobManager;
  }

  /**
   * Schedule a job for later execution
   */
  scheduleJob(
    type: JobType,
    userId: string,
    data: Record<string, any>,
    delayMs: number,
    priority: JobPriority = 'normal'
  ): string {
    const jobId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const timeout = setTimeout(() => {
      this.jobManager.createJob(type, userId, data, priority);
      this.scheduledJobs.delete(jobId);
    }, delayMs);

    this.scheduledJobs.set(jobId, timeout);
    return jobId;
  }

  /**
   * Cancel a scheduled job
   */
  cancelScheduledJob(jobId: string): void {
    const timeout = this.scheduledJobs.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledJobs.delete(jobId);
    }
  }

  /**
   * Get scheduled jobs count
   */
  getScheduledJobsCount(): number {
    return this.scheduledJobs.size;
  }
}
