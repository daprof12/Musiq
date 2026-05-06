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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('NRT_API_KEY') || Deno.env.get('VITE_NRT_API_SECRET');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NRT_API_KEY not configured' }),
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

    // Call the NetReward Checkout Sessions API Directly
    // Bypassing the proxy (api.netreward.online) which is currently returning 405
    const nrtRes = await fetch('https://pmpeyfkbqipfnhokfksl.supabase.co/functions/v1/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency,
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
      
      let errorMessage = `NetReward API error: ${nrtRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        errorMessage = errJson.message || errJson.error || errorMessage;
      } catch {
        errorMessage = errText || errorMessage;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const session = await nrtRes.json();
    console.log('[create-netreward-checkout] NetReward response:', session);

    // Some versions of the API might return 'url' instead of 'checkout_url'
    const checkoutUrl = session.checkout_url || session.url || session.payment_url;

    return new Response(JSON.stringify({ ...session, checkout_url: checkoutUrl }), {
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
