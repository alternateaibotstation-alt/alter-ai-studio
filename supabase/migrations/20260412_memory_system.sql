-- Conversation and Memory System Tables

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  title VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  communication_style VARCHAR(50),
  technical_level VARCHAR(50),
  preferred_tone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_bot_id ON conversations(bot_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get conversation with recent messages
CREATE OR REPLACE FUNCTION get_conversation_with_messages(
  p_conversation_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  conversation_id UUID,
  user_id UUID,
  bot_id UUID,
  title VARCHAR,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.bot_id,
    c.title,
    jsonb_agg(
      jsonb_build_object(
        'id', cm.id,
        'role', cm.role,
        'content', cm.content,
        'timestamp', cm.created_at,
        'tokens_used', cm.tokens_used
      )
      ORDER BY cm.message_index
    ) as messages
  FROM conversations c
  LEFT JOIN conversation_memory cm ON c.id = cm.conversation_id
  WHERE c.id = p_conversation_id
  GROUP BY c.id, c.user_id, c.bot_id, c.title;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's recent conversations
CREATE OR REPLACE FUNCTION get_user_recent_conversations(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  bot_id UUID,
  title VARCHAR,
  message_count INT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.bot_id,
    c.title,
    COUNT(cm.id)::INT as message_count,
    MAX(cm.created_at) as last_message_at,
    c.created_at
  FROM conversations c
  LEFT JOIN conversation_memory cm ON c.id = cm.conversation_id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.bot_id, c.title, c.created_at
  ORDER BY c.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search conversations
CREATE OR REPLACE FUNCTION search_conversations(
  p_user_id UUID,
  p_search_query TEXT
)
RETURNS TABLE (
  id UUID,
  bot_id UUID,
  title VARCHAR,
  preview TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id,
    c.bot_id,
    c.title,
    SUBSTRING(cm.content, 1, 100) as preview,
    c.created_at
  FROM conversations c
  LEFT JOIN conversation_memory cm ON c.id = cm.conversation_id
  WHERE c.user_id = p_user_id
    AND (c.title ILIKE '%' || p_search_query || '%'
         OR cm.content ILIKE '%' || p_search_query || '%')
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON conversation_memory
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
