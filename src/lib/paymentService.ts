import { supabase } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentProvider = 'netreward';

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutOptions {
  items: CheckoutItem[];
  totalAmount: number;
  type: 'subscription' | 'merch';
  userId: string;
  metadata?: Record<string, unknown>;
}

interface CheckoutSession {
  id: string;
  checkout_url: string;
  payment_status: 'pending';
}

// ── NetReward Checkout API ────────────────────────────────────────────────────

/**
 * Creates a NetReward checkout session via a Supabase Edge Function.
 *
 * The Edge Function (create-netreward-checkout) calls:
 *   POST https://api.netreward.online/v1/checkout/sessions
 * and returns { id, checkout_url, payment_status }.
 *
 * We redirect the user to checkout_url — identical flow to Stripe Checkout.
 */
export const createCheckoutSession = async (
  _provider: PaymentProvider,
  options: CheckoutOptions,
): Promise<{ url: string; sessionId: string }> => {

  // 1. Call the Supabase Edge Function to create the NetReward session
  //    (keeps the Secret Key server-side only)
  const { data, error } = await supabase.functions.invoke<CheckoutSession>(
    'create-netreward-checkout',
    {
      body: {
        items: options.items,
        totalAmount: options.totalAmount,
        type: options.type,
        nrt_user_id: options.userId,
        currency: 'USD',
        success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/checkout/cancel`,
        metadata: options.metadata ?? {},
      },
    },
  );

  if (error) {
    console.error('[PaymentService] Edge Function error:', error);
    throw new Error(error.message ?? 'Failed to create checkout session');
  }

  // Handle the pass-through error from NetReward
  if (data && (data as any).error) {
    throw new Error((data as any).error);
  }

  if (!data?.checkout_url) {
    throw new Error('No checkout_url returned from NetReward');
  }

  // 2. Write a pending transaction to our DB so we have a record before redirect
  await supabase.from('transactions').insert({
    user_id:   options.userId,
    type:      options.type,
    amount:    options.totalAmount,
    currency:  'USD',
    status:    'pending',
    provider:  'netreward',
    
    metadata:  {
      session_id: data.id,
      items: options.items,
      ...options.metadata,
    },
  });

  return {
    url: data.checkout_url,
    sessionId: data.id,
  };
};

// ── Verify payment (called on /checkout/success) ──────────────────────────────

export const verifyPayment = async (sessionId: string) => {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference', sessionId)
    .single();

  return { success: !!data && data.status === 'completed', data };
};
