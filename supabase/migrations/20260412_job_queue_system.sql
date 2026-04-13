-- Job Queue System Tables

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  result JSONB,
  error TEXT,
  retries INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Job History (for analytics and debugging)
CREATE TABLE IF NOT EXISTS job_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  status VARCHAR(20),
  user_id UUID,
  duration_ms INT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  concurrency INT DEFAULT 1,
  timeout INT DEFAULT 30000,
  status VARCHAR(20) DEFAULT 'idle',
  active_jobs INT DEFAULT 0,
  total_processed INT DEFAULT 0,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Queue Statistics
CREATE TABLE IF NOT EXISTS queue_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  pending_count INT DEFAULT 0,
  processing_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  avg_processing_time_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(type, date)
);

-- Scheduled Jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_priority ON jobs(priority);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_job_history_job_id ON job_history(job_id);
CREATE INDEX idx_job_history_user_id ON job_history(user_id);
CREATE INDEX idx_job_history_created_at ON job_history(created_at DESC);
CREATE INDEX idx_workers_type ON workers(type);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_scheduled_jobs_scheduled_for ON scheduled_jobs(scheduled_for);
CREATE INDEX idx_scheduled_jobs_user_id ON scheduled_jobs(user_id);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own job history"
  ON job_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scheduled jobs"
  ON scheduled_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get job status
CREATE OR REPLACE FUNCTION get_job_status(p_job_id VARCHAR)
RETURNS TABLE (
  id VARCHAR,
  type VARCHAR,
  status VARCHAR,
  progress INT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.type,
    j.status,
    CASE
      WHEN j.status = 'completed' THEN 100
      WHEN j.status = 'processing' THEN 50
      WHEN j.status = 'pending' THEN 0
      ELSE 0
    END as progress,
    j.result,
    j.error,
    j.created_at,
    j.completed_at
  FROM jobs j
  WHERE j.id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_statistics(p_type VARCHAR)
RETURNS TABLE (
  type VARCHAR,
  pending INT,
  processing INT,
  completed INT,
  failed INT,
  total INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_type,
    COUNT(CASE WHEN status = 'pending' THEN 1 END)::INT as pending,
    COUNT(CASE WHEN status = 'processing' THEN 1 END)::INT as processing,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INT as completed,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INT as failed,
    COUNT(*)::INT as total
  FROM jobs
  WHERE type = p_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's recent jobs
CREATE OR REPLACE FUNCTION get_user_recent_jobs(p_user_id UUID, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id VARCHAR,
  type VARCHAR,
  status VARCHAR,
  priority VARCHAR,
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.type,
    j.status,
    j.priority,
    j.created_at,
    j.completed_at,
    EXTRACT(EPOCH FROM (j.completed_at - j.created_at))::INT * 1000 as duration_ms
  FROM jobs j
  WHERE j.user_id = p_user_id
  ORDER BY j.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update worker heartbeat
CREATE OR REPLACE FUNCTION update_worker_heartbeat(p_worker_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE workers
  SET
    last_heartbeat = NOW(),
    updated_at = NOW()
  WHERE id = p_worker_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record job completion
CREATE OR REPLACE FUNCTION record_job_completion(
  p_job_id VARCHAR,
  p_status VARCHAR,
  p_duration_ms INT,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_type VARCHAR;
BEGIN
  -- Get job details
  SELECT user_id, type INTO v_user_id, v_type
  FROM jobs
  WHERE id = p_job_id;

  -- Update job
  UPDATE jobs
  SET
    status = p_status,
    result = p_result,
    error = p_error,
    completed_at = NOW()
  WHERE id = p_job_id;

  -- Record in history
  INSERT INTO job_history (job_id, type, status, user_id, duration_ms, result, error)
  VALUES (p_job_id, v_type, p_status, v_user_id, p_duration_ms, p_result, p_error);

  -- Update queue stats
  INSERT INTO queue_stats (type, date, completed_count, avg_processing_time_ms)
  VALUES (v_type, CURRENT_DATE, 1, p_duration_ms)
  ON CONFLICT (type, date) DO UPDATE SET
    completed_count = queue_stats.completed_count + 1,
    avg_processing_time_ms = (queue_stats.avg_processing_time_ms + p_duration_ms) / 2;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup expired jobs
CREATE OR REPLACE FUNCTION cleanup_expired_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM jobs
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup old job history
CREATE OR REPLACE FUNCTION cleanup_old_job_history()
RETURNS void AS $$
BEGIN
  DELETE FROM job_history
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
