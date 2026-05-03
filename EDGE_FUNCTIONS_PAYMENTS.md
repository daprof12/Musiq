# Supabase Edge Functions for Payments

To handle real payments securely, you need to deploy these two Edge Functions using the Supabase CLI.

## 1. Create Checkout Session (`create-checkout`)

This function creates the actual session with Stripe or Paystack.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  const { provider, items, totalAmount, type, metadata } = await req.json()
  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabaseClient.auth.getUser()

  if (provider === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
      customer_email: user?.email,
      metadata: { userId: user?.id, type, ...metadata },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Add Paystack logic here...
})
```

## 2. Payment Webhook (`payment-webhook`)

This function receives the "Success" event from Stripe/Paystack and updates your database.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()
  
  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, type, tier } = session.metadata

    // 1. Log Transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      amount: session.amount_total / 100,
      status: 'completed',
      provider: 'stripe',
      provider_id: session.id,
      type: type
    })

    // 2. If it's a subscription, update user tier
    if (type === 'subscription') {
      await supabaseAdmin.from('profiles').update({ tier }).eq('id', userId)
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

## Setup Instructions

1.  **Install Supabase CLI**: `npm install -g supabase`
2.  **Initialize**: `supabase init`
3.  **Link Project**: `supabase link --project-ref your-project-id`
4.  **Set Secrets**:
    - `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`
    - `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
5.  **Deploy**: `supabase functions deploy create-checkout`
