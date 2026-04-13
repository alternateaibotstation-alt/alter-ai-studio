-- Agent Actions System Tables

-- Tools Registry
CREATE TABLE IF NOT EXISTS tools (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  schema JSONB NOT NULL,
  requires_auth BOOLEAN DEFAULT FALSE,
  rate_limit INT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Actions Log
CREATE TABLE IF NOT EXISTS actions (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255),
  tool_id VARCHAR(255) REFERENCES tools(id),
  params JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger VARCHAR(255),
  actions JSONB NOT NULL,
  conditions JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id VARCHAR(255) REFERENCES workflows(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  actions_executed INT DEFAULT 0,
  actions_failed INT DEFAULT 0,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Tool Integrations (API keys, credentials)
CREATE TABLE IF NOT EXISTS tool_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id VARCHAR(255) REFERENCES tools(id),
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

-- Action Templates
CREATE TABLE IF NOT EXISTS action_templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tool_id VARCHAR(255) REFERENCES tools(id),
  params JSONB NOT NULL,
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_actions_agent_id ON actions(agent_id);
CREATE INDEX idx_actions_tool_id ON actions(tool_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);
CREATE INDEX idx_workflows_enabled ON workflows(enabled);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_tool_integrations_user_id ON tool_integrations(user_id);
CREATE INDEX idx_tool_integrations_tool_id ON tool_integrations(tool_id);
CREATE INDEX idx_action_templates_tool_id ON action_templates(tool_id);

-- Enable RLS
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own actions"
  ON actions FOR SELECT
  USING (agent_id = auth.uid()::text);

CREATE POLICY "Users can view their own workflows"
  ON workflows FOR SELECT
  USING (id IN (
    SELECT workflow_id FROM workflow_executions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own workflow executions"
  ON workflow_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tool integrations"
  ON tool_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tool integrations"
  ON tool_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool integrations"
  ON tool_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tool integrations"
  ON tool_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Function to execute workflow
CREATE OR REPLACE FUNCTION execute_workflow(
  p_workflow_id VARCHAR,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
BEGIN
  INSERT INTO workflow_executions (workflow_id, user_id, status)
  VALUES (p_workflow_id, p_user_id, 'processing')
  RETURNING id INTO v_execution_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record action execution
CREATE OR REPLACE FUNCTION record_action_execution(
  p_action_id VARCHAR,
  p_status VARCHAR,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE actions
  SET
    status = p_status,
    result = p_result,
    error = p_error,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END
  WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get workflow execution history
CREATE OR REPLACE FUNCTION get_workflow_execution_history(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  workflow_id VARCHAR,
  status VARCHAR,
  actions_executed INT,
  actions_failed INT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.workflow_id,
    we.status,
    we.actions_executed,
    we.actions_failed,
    we.created_at,
    we.completed_at
  FROM workflow_executions we
  WHERE we.user_id = p_user_id
  ORDER BY we.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get available tools
CREATE OR REPLACE FUNCTION get_available_tools()
RETURNS TABLE (
  id VARCHAR,
  name VARCHAR,
  description TEXT,
  type VARCHAR,
  requires_auth BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.type,
    t.requires_auth
  FROM tools t
  WHERE t.enabled = TRUE
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;

-- Insert default tools
INSERT INTO tools (id, name, description, type, schema, requires_auth)
VALUES
  ('tool_http_api', 'HTTP API Call', 'Make HTTP requests to external APIs', 'api', '{"endpoint": {"type": "string", "required": true}, "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]}, "headers": {"type": "object"}, "body": {"type": "object"}}'::jsonb, FALSE),
  ('tool_webhook', 'Webhook Trigger', 'Trigger webhooks for external integrations', 'webhook', '{"url": {"type": "string", "required": true}, "payload": {"type": "object"}}'::jsonb, FALSE),
  ('tool_email', 'Send Email', 'Send emails via email service', 'email', '{"to": {"type": "string", "required": true}, "subject": {"type": "string", "required": true}, "body": {"type": "string", "required": true}, "html": {"type": "boolean"}}'::jsonb, TRUE),
  ('tool_slack', 'Send Slack Message', 'Send messages to Slack channels', 'slack', '{"channel": {"type": "string", "required": true}, "message": {"type": "string", "required": true}, "blocks": {"type": "array"}}'::jsonb, TRUE),
  ('tool_twitter', 'Post to Twitter', 'Post tweets to Twitter', 'twitter', '{"text": {"type": "string", "required": true}, "media_ids": {"type": "array"}, "reply_settings": {"type": "string"}}'::jsonb, TRUE),
  ('tool_linkedin', 'Post to LinkedIn', 'Post content to LinkedIn', 'linkedin', '{"text": {"type": "string", "required": true}, "media": {"type": "array"}}'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;
