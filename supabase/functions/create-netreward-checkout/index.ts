/**
 * create-netreward-checkout — Supabase Edge Function (Deno runtime)
 *
 * Called by the Musiq frontend to create a NetReward checkout session.
 * Keeps the NRT_SECRET_KEY server-side — never exposed to the browser.
 *
 * Setup:
 *   supabase secrets set NRT_SECRET_KEY=<secret_key_from_dashboard>
 *   supabase functions deploy create-netreward-checkout
 *
 * NetReward Checkout API:
 *   POST https://api.netreward.online/v1/checkout/sessions
 *   Authorization: Bearer <NRT_SECRET_KEY>
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get('NRT_SECRET_KEY');
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: 'NRT_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();
    const {
      items,
      totalAmount,
      type,
      nrt_user_id,
      currency = 'USD',
      success_url,
      cancel_url,
      metadata = {},
    } = body;

    // Call the NetReward Checkout Sessions API
    const nrtRes = await fetch('https://api.netreward.online/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency,
        line_items: items,
        mode: type === 'subscription' ? 'subscription' : 'payment',
        metadata: {
          nrt_user_id,
          item_type: type,
          ...metadata,
        },
        success_url,
        cancel_url,
      }),
    });

    if (!nrtRes.ok) {
      const errText = await nrtRes.text();
      console.error('[create-netreward-checkout] NRT API error:', nrtRes.status, errText);
      return new Response(
        JSON.stringify({ error: `NetReward API error: ${nrtRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const session = await nrtRes.json();

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[create-netreward-checkout] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
