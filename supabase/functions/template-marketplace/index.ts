import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketplaceRequest {
  action: 'list' | 'search' | 'get' | 'upload' | 'purchase' | 'review' | 'earnings';
  category?: string;
  query?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  rating?: number;
  reviewText?: string;
  licenseType?: string;
}

/**
 * List templates by category
 */
async function listTemplates(
  supabaseClient: any,
  category: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('templates')
    .select('id, name, description, category, thumbnail, price, rating, download_count')
    .eq('category', category)
    .eq('status', 'published')
    .order('rating', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return data || [];
}

/**
 * Search templates
 */
async function searchTemplates(
  supabaseClient: any,
  query: string,
  limit: number = 20
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('templates')
    .select('id, name, description, category, thumbnail, price, rating, download_count')
    .eq('status', 'published')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}

/**
 * Get template details
 */
async function getTemplate(supabaseClient: any, templateId: string): Promise<any> {
  const { data, error } = await supabaseClient
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) throw error;

  // Get reviews
  const { data: reviews } = await supabaseClient
    .from('template_reviews')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    ...data,
    reviews: reviews || [],
  };
}

/**
 * Upload template
 */
async function uploadTemplate(
  supabaseClient: any,
  userId: string,
  templateData: Record<string, any>
): Promise<any> {
  const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabaseClient.from('templates').insert({
    id: templateId,
    creator_id: userId,
    name: templateData.name,
    description: templateData.description,
    category: templateData.category,
    content: templateData.content,
    price: templateData.price || 0,
    license_type: templateData.licenseType || 'personal',
    tags: templateData.tags || [],
    status: 'pending_review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  return {
    templateId,
    status: 'pending_review',
    message: 'Template submitted for review',
  };
}

/**
 * Purchase template license
 */
async function purchaseTemplate(
  supabaseClient: any,
  userId: string,
  templateId: string,
  licenseType: string
): Promise<any> {
  // Get template details
  const { data: template, error: templateError } = await supabaseClient
    .from('templates')
    .select('price, creator_id')
    .eq('id', templateId)
    .single();

  if (templateError || !template) throw new Error('Template not found');

  const licenseId = `license_${templateId}_${userId}_${Date.now()}`;

  // Create license record
  const { error: licenseError } = await supabaseClient.from('template_licenses').insert({
    id: licenseId,
    template_id: templateId,
    buyer_id: userId,
    license_type: licenseType,
    purchase_price: template.price,
    purchased_at: new Date().toISOString(),
    is_active: true,
  });

  if (licenseError) throw licenseError;

  // Record revenue split
  const creatorShare = 0.7;
  const platformShare = 0.2;
  const affiliateShare = 0.1;

  await supabaseClient.from('template_revenue_splits').insert({
    template_id: templateId,
    creator_share: creatorShare,
    platform_share: platformShare,
    affiliate_share: affiliateShare,
    sale_amount: template.price,
    creator_earnings: template.price * creatorShare,
    platform_earnings: template.price * platformShare,
    affiliate_earnings: template.price * affiliateShare,
    recorded_at: new Date().toISOString(),
  });

  // Increment download count
  await supabaseClient.rpc('increment_template_downloads', {
    p_template_id: templateId,
  });

  return {
    licenseId,
    templateId,
    purchasePrice: template.price,
    licenseType,
    status: 'active',
  };
}

/**
 * Add review
 */
async function addReview(
  supabaseClient: any,
  userId: string,
  templateId: string,
  rating: number,
  reviewText: string
): Promise<any> {
  const reviewId = `review_${templateId}_${userId}`;

  const { error } = await supabaseClient.from('template_reviews').insert({
    id: reviewId,
    template_id: templateId,
    user_id: userId,
    rating,
    title: reviewText.substring(0, 100),
    comment: reviewText,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  // Update template rating
  const { data: reviews } = await supabaseClient
    .from('template_reviews')
    .select('rating')
    .eq('template_id', templateId);

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

    await supabaseClient
      .from('templates')
      .update({
        rating: avgRating,
        review_count: reviews.length,
      })
      .eq('id', templateId);
  }

  return {
    reviewId,
    templateId,
    rating,
    status: 'published',
  };
}

/**
 * Get creator earnings
 */
async function getEarnings(supabaseClient: any, userId: string): Promise<any> {
  const { data, error } = await supabaseClient
    .rpc('get_creator_earnings', {
      p_creator_id: userId,
    });

  if (error) throw error;

  const totalEarnings = (data || []).reduce((sum: number, item: any) => sum + (item.creator_earnings || 0), 0);

  return {
    earnings: data || [],
    totalEarnings,
    period: 'all_time',
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: MarketplaceRequest = await req.json();
    const { action, category, query, templateId, templateData, rating, reviewText, licenseType } = requestData;

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
      case 'list':
        if (!category) throw new Error('category is required');
        result = await listTemplates(supabaseClient, category);
        break;

      case 'search':
        if (!query) throw new Error('query is required');
        result = await searchTemplates(supabaseClient, query);
        break;

      case 'get':
        if (!templateId) throw new Error('templateId is required');
        result = await getTemplate(supabaseClient, templateId);
        break;

      case 'upload':
        if (!userId || !templateData) throw new Error('Authentication and templateData required');
        result = await uploadTemplate(supabaseClient, userId, templateData);
        break;

      case 'purchase':
        if (!userId || !templateId || !licenseType) throw new Error('userId, templateId, and licenseType required');
        result = await purchaseTemplate(supabaseClient, userId, templateId, licenseType);
        break;

      case 'review':
        if (!userId || !templateId || !rating || !reviewText) throw new Error('All review fields required');
        result = await addReview(supabaseClient, userId, templateId, rating, reviewText);
        break;

      case 'earnings':
        if (!userId) throw new Error('Authentication required');
        result = await getEarnings(supabaseClient, userId);
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
    console.error("Error in marketplace:", error);
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
