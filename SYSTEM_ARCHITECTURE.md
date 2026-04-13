# Alter AI Studio - System Architecture

## Overview

Alter AI Studio is a comprehensive AI platform with integrated content creation, memory management, job processing, monetization, and agent automation capabilities. This document outlines the complete system architecture.

## Core Systems

### 1. AI Engine (`src/lib/ai-engine/`)

**Components:**
- **Orchestrator** - Manages prompt templates, system prompts, and context injection
- **Model Router** - Intelligent model selection based on user tier and task complexity
- **Output Formatter** - Converts responses to platform-specific formats

**Features:**
- Multi-model support (GPT-4, Gemini, Claude)
- Tier-based model routing (free, pro, power)
- Platform-specific formatting (TikTok, Instagram, Twitter, LinkedIn, Facebook, Pinterest, YouTube, Blog)
- Cost-aware routing

**Edge Functions:**
- `ai-engine-v2` - Main AI processing with streaming support

### 2. Memory System (`src/lib/ai-engine/memory-system.ts`)

**Components:**
- **ConversationStore** - Persistent conversation storage
- **MemoryManager** - Context retrieval and memory optimization
- **UserProfileManager** - User preferences and profile management

**Features:**
- Persistent conversation history
- Context injection based on conversation history
- Key topic extraction
- User preference inference
- Conversation style analysis

**Edge Functions:**
- `chat-with-memory` - Chat with persistent context

### 3. Creator Engine (`src/lib/creator-engine/`)

**Components:**
- **ContentPipeline** - 5-stage content generation pipeline
- **ContentStudio** - Session management and batch processing
- **PromptTemplateEngine** - Reusable prompt templates
- **MultiStepWorkflowBuilder** - Complex workflow creation

**Features:**
- Multi-platform content generation
- Batch processing with status tracking
- Pre-built templates (LinkedIn, TikTok, Email, Blog)
- Tone and style customization
- Template variable substitution

**Edge Functions:**
- `content-studio-v2` - Content generation and formatting

### 4. Job Queue System (`src/lib/job-queue/`)

**Components:**
- **JobManager** - Job lifecycle management
- **JobWorker** - Background job processing
- **JobScheduler** - Delayed job execution

**Features:**
- Priority-based queue (urgent, high, normal, low)
- Automatic retry logic
- Concurrent job processing
- Job history and analytics
- Scheduled job execution

**Edge Functions:**
- `job-queue-worker` - Job management and execution

### 5. Monetization System (`src/lib/monetization/`)

**Components:**
- **UsageTracker** - Token and API usage tracking
- **FeatureGate** - Feature access control
- **CostCalculator** - Cost calculation and projection

**Features:**
- Real-time usage tracking
- Plan limits enforcement (monthly, daily, per-minute)
- Feature gating by subscription tier
- Cost calculation and breakdown
- 4 subscription tiers with different limits

**Subscription Tiers:**
- **Free:** 10K tokens/month, 500/day, 10 req/min
- **Pro:** 500K tokens/month, 20K/day, 100 req/min, $29.99/month
- **Power:** Unlimited, 1000 req/min, custom models, $99.99/month
- **Enterprise:** Everything, dedicated support

**Edge Functions:**
- `usage-tracking` - Usage recording and statistics

### 6. Agent Actions Layer (`src/lib/agent-actions/`)

**Components:**
- **ToolRegistry** - Tool management and discovery
- **ActionExecutor** - Action execution and lifecycle
- **WorkflowEngine** - Workflow management and execution
- **AgentEngine** - Main orchestrator

**Features:**
- 6 built-in tools (HTTP API, Webhooks, Email, Slack, Twitter, LinkedIn)
- Sequential and parallel action execution
- Rate limiting per tool
- Workflow automation
- Tool authentication and credential management

**Edge Functions:**
- `agent-actions` - Action execution and workflow management

## Database Schema

### AI Engine Tables
- `ai_requests` - Request logging and analytics
- `prompt_templates` - Reusable prompt templates
- `bot_personas` - Bot personality definitions
- `conversation_memory` - Conversation message storage
- `content_generations` - Generated content history
- `usage_tracking` - Aggregated usage statistics
- `model_performance` - Model performance metrics

### Memory System Tables
- `conversations` - Conversation metadata
- `user_favorites` - User favorite bots
- `user_preferences` - User settings and preferences

### Job Queue Tables
- `jobs` - Job records
- `job_history` - Job execution history
- `workers` - Worker management
- `queue_stats` - Queue statistics
- `scheduled_jobs` - Scheduled job storage

### Monetization Tables
- `usage_records` - Detailed usage records
- `usage_summary` - Daily usage aggregation
- `monthly_usage_summary` - Monthly usage aggregation
- `subscription_plans` - Plan definitions
- `user_subscriptions` - User subscription records
- `cost_config` - Cost configuration per resource
- `billing_events` - Billing event log

### Agent Actions Tables
- `tools` - Tool registry
- `actions` - Action execution log
- `workflows` - Workflow definitions
- `workflow_executions` - Workflow execution history
- `tool_integrations` - User tool credentials
- `action_templates` - Action templates

## API Endpoints

### AI Engine
- `POST /functions/v1/ai-engine-v2` - Generate content with AI

### Memory System
- `POST /functions/v1/chat-with-memory` - Chat with persistent context

### Creator Engine
- `POST /functions/v1/content-studio-v2` - Generate content for multiple platforms

### Job Queue
- `POST /functions/v1/job-queue-worker` - Manage jobs (create, status, list, cancel, schedule)

### Usage Tracking
- `POST /functions/v1/usage-tracking` - Track usage and check limits

### Agent Actions
- `POST /functions/v1/agent-actions` - Execute actions and workflows

## Data Flow

### Content Generation Flow
1. User submits prompt via ContentStudio
2. Request routed to `content-studio-v2` edge function
3. AI engine generates content using selected model
4. Output formatter converts to platform-specific formats
5. Content stored in `content_generations` table
6. Usage tracked in `usage_records` and `usage_summary`
7. Response returned to user

### Chat with Memory Flow
1. User sends message via chat interface
2. Request routed to `chat-with-memory` edge function
3. Conversation history retrieved from `conversation_memory`
4. Context extracted and injected into system prompt
5. AI generates response with context awareness
6. User and assistant messages saved to conversation
7. Conversation timestamp updated
8. Response streamed to user

### Job Processing Flow
1. User creates job via `job-queue-worker`
2. Job stored in `jobs` table with pending status
3. Worker picks up job from queue
4. Job status updated to processing
5. Job handler executes
6. Result stored and status updated to completed
7. Job history recorded
8. User can query job status anytime

### Usage Enforcement Flow
1. User attempts action
2. `usage-tracking` checks current usage vs limits
3. If limit exceeded, action denied
4. If allowed, action proceeds
5. Usage recorded in `usage_records`
6. Daily/monthly summaries updated
7. Cost calculated and tracked

### Action Execution Flow
1. User executes action via `agent-actions`
2. Tool looked up in registry
3. If auth required, credentials retrieved
4. Action executed with parameters
5. Result stored in `actions` table
6. Status updated based on result
7. Workflow continues if part of workflow

## Security

### Row-Level Security (RLS)
- All user data tables have RLS policies
- Users can only access their own data
- Admin functions use service role key

### Authentication
- Supabase Auth integration
- JWT token validation
- Bearer token in Authorization header

### Credential Management
- Sensitive credentials stored encrypted in `tool_integrations`
- Credentials never exposed in logs or responses
- Per-user credential isolation

## Monitoring & Analytics

### Metrics Tracked
- AI request count and latency
- Model performance and accuracy
- Job queue depth and processing time
- Usage by resource type
- Cost per user and tier
- Action execution success rate
- Workflow completion rate

### Logging
- All requests logged in respective tables
- Error messages captured for debugging
- Execution time tracked
- User attribution for all operations

## Deployment

### Requirements
- Supabase project with PostgreSQL
- Deno runtime for edge functions
- Environment variables configured
- API keys for external services

### Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
NEXTAUTH_SECRET=
```

### Migrations
Run all migrations in order:
1. `20260412_ai_engine_core.sql`
2. `20260412_memory_system.sql`
3. `20260412_job_queue_system.sql`
4. `20260412_monetization_system.sql`
5. `20260412_agent_actions.sql`

## Performance Optimization

### Caching
- Usage stats cached for 5 minutes
- Conversation context cached
- Tool registry cached

### Indexing
- Indexes on frequently queried columns
- Composite indexes for common queries
- Partial indexes for status-based queries

### Query Optimization
- Batch operations where possible
- Aggregation at database level
- Pagination for large result sets

## Future Enhancements

1. **Real-time Updates** - WebSocket support for live status updates
2. **Advanced Analytics** - Detailed usage analytics and reporting
3. **Custom Models** - Support for fine-tuned models
4. **Webhooks** - Event-driven integrations
5. **Rate Limiting** - Advanced rate limiting strategies
6. **Caching Layer** - Redis caching for performance
7. **Message Queue** - RabbitMQ/Kafka for async processing
8. **Monitoring** - Prometheus/Grafana integration
