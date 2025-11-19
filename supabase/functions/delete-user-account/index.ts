import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const allowedOrigins = [
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete in cascade order (respecting foreign keys)
    // 1. Delete messages
    await supabaseClient.from('anonymous_messages').delete().or(`giver_id.eq.${userId},receiver_id.eq.${userId}`);
    
    // 2. Delete gift exchanges
    await supabaseClient.from('gift_exchanges').delete().or(`giver_id.eq.${userId},receiver_id.eq.${userId}`);
    
    // 3. Delete group memberships
    await supabaseClient.from('group_members').delete().eq('user_id', userId);
    
    // 4. Delete gift items from user's lists
    const { data: userLists } = await supabaseClient.from('gift_lists').select('id').eq('user_id', userId);
    if (userLists && userLists.length > 0) {
      const listIds = userLists.map(l => l.id);
      await supabaseClient.from('gift_items').delete().in('list_id', listIds);
    }
    
    // 5. Delete gift lists
    await supabaseClient.from('gift_lists').delete().eq('user_id', userId);
    
    // 6. Delete groups created by user
    await supabaseClient.from('groups').delete().eq('created_by', userId);
    
    // 7. Delete events
    await supabaseClient.from('events').delete().eq('created_by', userId);
    
    // 8. Delete affiliate products owned by user
    await supabaseClient.from('affiliate_products').delete().eq('owner_id', userId);
    
    // 9. Delete Amazon credentials
    await supabaseClient.from('amazon_credentials').delete().eq('user_id', userId);
    
    // 10. Delete affiliate clicks (optional - can keep for analytics)
    await supabaseClient.from('affiliate_clicks').delete().eq('user_id', userId);
    
    // 11. Delete usage tracking
    await supabaseClient.from('usage_tracking').delete().eq('user_id', userId);
    
    // 12. Delete user roles
    await supabaseClient.from('user_roles').delete().eq('user_id', userId);
    
    // 13. Delete subscriptions
    await supabaseClient.from('user_subscriptions').delete().eq('user_id', userId);
    
    // 14. Delete profile
    await supabaseClient.from('profiles').delete().eq('user_id', userId);
    
    // 15. Delete auth user (final step)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      throw new Error(`Failed to delete auth user: ${deleteError.message}`);
    }

    console.log(`Account deleted successfully: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error deleting account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

