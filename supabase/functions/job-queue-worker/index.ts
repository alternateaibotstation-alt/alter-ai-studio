import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JobRequest {
  action: 'create' | 'status' | 'list' | 'cancel' | 'schedule';
  type?: string;
  jobId?: string;
  userId?: string;
  data?: Record<string, any>;
  priority?: string;
  delayMs?: number;
}

/**
 * Create a new job
 */
async function createJob(
  supabaseClient: any,
  type: string,
  userId: string,
  data: Record<string, any>,
  priority: string = 'normal'
): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { error } = await supabaseClient.from('jobs').insert({
    id: jobId,
    type,
    status: 'pending',
    priority,
    user_id: userId,
    data,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) throw error;

  return jobId;
}

/**
 * Get job status
 */
async function getJobStatus(supabaseClient: any, jobId: string): Promise<any> {
  const { data, error } = await supabaseClient
    .rpc('get_job_status', { p_job_id: jobId })
    .single();

  if (error) throw error;

  return data;
}

/**
 * List user's jobs
 */
async function listUserJobs(supabaseClient: any, userId: string, limit: number = 20): Promise<any[]> {
  const { data, error } = await supabaseClient
    .rpc('get_user_recent_jobs', { p_user_id: userId, p_limit: limit });

  if (error) throw error;

  return data || [];
}

/**
 * Cancel a job
 */
async function cancelJob(supabaseClient: any, jobId: string): Promise<void> {
  const { error } = await supabaseClient
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId);

  if (error) throw error;
}

/**
 * Schedule a job for later
 */
async function scheduleJob(
  supabaseClient: any,
  type: string,
  userId: string,
  data: Record<string, any>,
  delayMs: number,
  priority: string = 'normal'
): Promise<string> {
  const jobId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const scheduledFor = new Date(Date.now() + delayMs);

  const { error } = await supabaseClient.from('scheduled_jobs').insert({
    id: jobId,
    type,
    user_id: userId,
    data,
    scheduled_for: scheduledFor.toISOString(),
    priority,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  return jobId;
}

/**
 * Get queue statistics
 */
async function getQueueStats(supabaseClient: any, type: string): Promise<any> {
  const { data, error } = await supabaseClient
    .rpc('get_queue_statistics', { p_type: type });

  if (error) throw error;

  return data[0] || {};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: JobRequest = await req.json();
    const { action, type, jobId, userId, data, priority = 'normal', delayMs } = requestData;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract user ID from auth header
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          authenticatedUserId = userData.user.id;
        }
      }
    }

    let result: any;

    switch (action) {
      case 'create':
        if (!type || !data) {
          throw new Error('type and data are required for job creation');
        }
        if (!authenticatedUserId) {
          throw new Error('Authentication required');
        }
        result = await createJob(supabaseClient, type, authenticatedUserId, data, priority);
        break;

      case 'status':
        if (!jobId) {
          throw new Error('jobId is required');
        }
        result = await getJobStatus(supabaseClient, jobId);
        break;

      case 'list':
        if (!authenticatedUserId) {
          throw new Error('Authentication required');
        }
        result = await listUserJobs(supabaseClient, authenticatedUserId);
        break;

      case 'cancel':
        if (!jobId) {
          throw new Error('jobId is required');
        }
        await cancelJob(supabaseClient, jobId);
        result = { success: true, jobId };
        break;

      case 'schedule':
        if (!type || !data || !delayMs) {
          throw new Error('type, data, and delayMs are required for scheduling');
        }
        if (!authenticatedUserId) {
          throw new Error('Authentication required');
        }
        result = await scheduleJob(supabaseClient, type, authenticatedUserId, data, delayMs, priority);
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
    console.error("Error in job queue worker:", error);
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
