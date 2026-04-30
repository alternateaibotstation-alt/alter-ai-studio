import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgentActionRequest {
  action: 'execute' | 'list_tools' | 'create_workflow' | 'execute_workflow' | 'get_history';
  toolId?: string;
  params?: Record<string, any>;
  workflowName?: string;
  workflowTrigger?: string;
  workflowActions?: Array<{ toolId: string; params: Record<string, any> }>;
}

/**
 * Execute an action
 */
async function executeAction(
  supabaseClient: any,
  userId: string,
  toolId: string,
  params: Record<string, any>
): Promise<any> {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get tool details
  const { data: toolData, error: toolError } = await supabaseClient
    .from('tools')
    .select('*')
    .eq('id', toolId)
    .single();

  if (toolError || !toolData) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  // Check if tool requires auth
  if (toolData.requires_auth) {
    const { data: integration } = await supabaseClient
      .from('tool_integrations')
      .select('credentials')
      .eq('user_id', userId)
      .eq('tool_id', toolId)
      .single();

    if (!integration) {
      throw new Error(`Tool integration not configured: ${toolId}`);
    }

    // Add credentials to params for in-memory execution only
    params.credentials = integration.credentials;
  }

  // Strip credentials before persisting to the audit log so external API keys
  // are never written to long-lived storage.
  const { credentials: _omitCredentials, ...safeParams } = params;

  // Record action
  const { error: insertError } = await supabaseClient.from('actions').insert({
    id: actionId,
    agent_id: userId,
    tool_id: toolId,
    params: safeParams,
    status: 'executing',
    created_at: new Date().toISOString(),
    executed_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;

  // Execute the action based on tool type
  let result: any;
  try {
    switch (toolData.type) {
      case 'api':
        result = await executeAPICall(params);
        break;
      case 'webhook':
        result = await executeWebhook(params);
        break;
      case 'email':
        result = await sendEmail(params);
        break;
      case 'slack':
        result = await sendSlackMessage(params);
        break;
      case 'twitter':
        result = await postToTwitter(params);
        break;
      case 'linkedin':
        result = await postToLinkedIn(params);
        break;
      default:
        throw new Error(`Unknown tool type: ${toolData.type}`);
    }

    // Update action status
    await supabaseClient
      .from('actions')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', actionId);

    return {
      actionId,
      status: 'completed',
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update action status
    await supabaseClient
      .from('actions')
      .update({
        status: 'failed',
        error: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', actionId);

    throw error;
  }
}

/**
 * Execute API call
 */
async function executeAPICall(params: Record<string, any>): Promise<any> {
  const response = await fetch(params.endpoint, {
    method: params.method || 'GET',
    headers: params.headers || { 'Content-Type': 'application/json' },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Execute webhook
 */
async function executeWebhook(params: Record<string, any>): Promise<any> {
  const response = await fetch(params.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.payload || {}),
  });

  return { status: response.status, success: response.ok };
}

/**
 * Send email
 */
async function sendEmail(params: Record<string, any>): Promise<any> {
  // This would integrate with email service like SendGrid
  // For now, returning a mock response
  return {
    sent: true,
    messageId: `msg_${Date.now()}`,
    to: params.to,
    subject: params.subject,
  };
}

/**
 * Send Slack message
 */
async function sendSlackMessage(params: Record<string, any>): Promise<any> {
  // This would integrate with Slack API
  // For now, returning a mock response
  return {
    ok: true,
    channel: params.channel,
    ts: `${Date.now()}`,
  };
}

/**
 * Post to Twitter
 */
async function postToTwitter(params: Record<string, any>): Promise<any> {
  // This would integrate with Twitter API v2
  // For now, returning a mock response
  return {
    id: `tweet_${Date.now()}`,
    text: params.text,
    created_at: new Date().toISOString(),
  };
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(params: Record<string, any>): Promise<any> {
  // This would integrate with LinkedIn API
  // For now, returning a mock response
  return {
    id: `post_${Date.now()}`,
    text: params.text,
    created_at: new Date().toISOString(),
  };
}

/**
 * List available tools
 */
async function listTools(supabaseClient: any): Promise<any[]> {
  const { data, error } = await supabaseClient
    .rpc('get_available_tools');

  if (error) throw error;

  return data || [];
}

/**
 * Create workflow
 */
async function createWorkflow(
  supabaseClient: any,
  userId: string,
  name: string,
  trigger: string,
  actions: Array<{ toolId: string; params: Record<string, any> }>
): Promise<any> {
  const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabaseClient.from('workflows').insert({
    id: workflowId,
    name,
    trigger,
    actions: JSON.stringify(actions),
    enabled: true,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  return { workflowId, name, trigger, actions };
}

/**
 * Execute workflow
 */
async function executeWorkflow(
  supabaseClient: any,
  userId: string,
  workflowId: string
): Promise<any> {
  const executionId = await supabaseClient
    .rpc('execute_workflow', {
      p_workflow_id: workflowId,
      p_user_id: userId,
    });

  return {
    executionId,
    workflowId,
    status: 'processing',
  };
}

/**
 * Get execution history
 */
async function getHistory(supabaseClient: any, userId: string): Promise<any[]> {
  const { data, error } = await supabaseClient
    .rpc('get_workflow_execution_history', {
      p_user_id: userId,
      p_limit: 20,
    });

  if (error) throw error;

  return data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: AgentActionRequest = await req.json();
    const { action, toolId, params, workflowName, workflowTrigger, workflowActions } = requestData;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract user ID
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
        }
      }
    }

    let result: any;

    switch (action) {
      case 'execute':
        if (!userId || !toolId || !params) {
          throw new Error('userId, toolId, and params are required');
        }
        result = await executeAction(supabaseClient, userId, toolId, params);
        break;

      case 'list_tools':
        result = await listTools(supabaseClient);
        break;

      case 'create_workflow':
        if (!userId || !workflowName || !workflowTrigger || !workflowActions) {
          throw new Error('workflowName, workflowTrigger, and workflowActions are required');
        }
        result = await createWorkflow(supabaseClient, userId, workflowName, workflowTrigger, workflowActions);
        break;

      case 'execute_workflow':
        if (!userId || !toolId) {
          throw new Error('workflowId is required');
        }
        result = await executeWorkflow(supabaseClient, userId, toolId);
        break;

      case 'get_history':
        if (!userId) {
          throw new Error('Authentication required');
        }
        result = await getHistory(supabaseClient, userId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in agent actions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
