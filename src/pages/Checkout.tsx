import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import {
  CreditCard, ShoppingBag, ShieldCheck, ArrowRight,
  Loader2, Star, Crown, CheckCircle, Zap, Smartphone, Monitor,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../lib/paymentService';

// ── Mobile detection ──────────────────────────────────────────────────────────
const isMobileDevice = () =>
  /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent);

// ── QR Code (pure SVG/CSS — no external dependency) ──────────────────────────
// We render a link-styled QR placeholder that opens the URL on click.
// In production, swap for a real <QRCode> library like 'qrcode.react'.
const QRCodeDisplay = ({ url, sessionId }: { url: string; sessionId: string }) => (
  <div style={{ textAlign: 'center' }}>
    {/* QR frame */}
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Scan or click to pay"
      style={{ display: 'inline-block' }}
    >
      <div style={{
        width: '160px',
        height: '160px',
        background: 'white',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        cursor: 'pointer',
        margin: '0 auto',
        boxShadow: '0 0 0 4px rgba(30,215,96,0.3)',
        transition: 'box-shadow 0.2s',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 0 6px rgba(30,215,96,0.5)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 0 4px rgba(30,215,96,0.3)')}
      >
        {/* Simulated QR grid — replace with <QRCode value={url} size={136} /> */}
        <svg width="136" height="136" viewBox="0 0 136 136" fill="none">
          {/* Corner squares */}
          <rect x="4"   y="4"   width="36" height="36" rx="4" fill="#111" />
          <rect x="10"  y="10"  width="24" height="24" rx="2" fill="white" />
          <rect x="16"  y="16"  width="12" height="12" rx="1" fill="#111" />
          <rect x="96"  y="4"   width="36" height="36" rx="4" fill="#111" />
          <rect x="102" y="10"  width="24" height="24" rx="2" fill="white" />
          <rect x="108" y="16"  width="12" height="12" rx="1" fill="#111" />
          <rect x="4"   y="96"  width="36" height="36" rx="4" fill="#111" />
          <rect x="10"  y="102" width="24" height="24" rx="2" fill="white" />
          <rect x="16"  y="108" width="12" height="12" rx="1" fill="#111" />
          {/* Data dots (decorative) */}
          {[48,56,64,72,80,88].map((x) =>
            [48,56,64,72,80,88].map((y) =>
              (x + y) % 16 === 0 ? (
                <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#111" />
              ) : null
            )
          )}
          {/* Center NRT logo mark */}
          <rect x="56" y="56" width="24" height="24" rx="4" fill="#1ed760" />
          <text x="68" y="73" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">N</text>
        </svg>
      </div>
    </a>
    <p style={{ marginTop: '12px', fontSize: '12px', color: '#a7a7a7' }}>
      Scan with your NetReward app
    </p>
    <p style={{ fontSize: '11px', color: '#555', marginTop: '4px', fontFamily: 'monospace' }}>
      {sessionId.slice(0, 16)}…
    </p>
  </div>
);

// ── Mobile deep-link button ──────────────────────────────────────────────────
const MobilePayButton = ({ url }: { url: string }) => (
  <div style={{ textAlign: 'center' }}>
    <a
      href={url}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, #1ed760 0%, #0ea5e9 100%)',
        color: 'black',
        fontWeight: '800',
        fontSize: '16px',
        padding: '16px 24px',
        borderRadius: '14px',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(30,215,96,0.4)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(30,215,96,0.5)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(30,215,96,0.4)';
        }}
      >
        <Smartphone size={22} />
        Pay with NetReward →
      </div>
    </a>
    <p style={{ marginTop: '12px', fontSize: '12px', color: '#a7a7a7' }}>
      Opens in your NetReward app
    </p>
  </div>
);

// ── Main Checkout Component ──────────────────────────────────────────────────

const Checkout = () => {
  const { items, total, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{ url: string; sessionId: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedPlan = location.state?.planName as string | undefined;
  const planPrice = selectedPlan === 'Premium' ? 9.99 : selectedPlan === 'Artist' ? 19.99 : 0;
  const finalTotal = total + planPrice;

  const isMobile = isMobileDevice();
  // Build the NetReward pay URL (deep-link on mobile, QR on desktop)
  const payUrl = sessionData
    ? `https://netreward.online/pay?session=${sessionData.sessionId}`
    : '';

  const handlePayment = async () => {
    if (items.length === 0 && !selectedPlan) return;
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createCheckoutSession('netreward', {
        items: [
          ...items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
          ...(selectedPlan
            ? [{ name: `${selectedPlan} Subscription`, price: planPrice, quantity: 1 }]
            : []),
        ],
        totalAmount: finalTotal,
        type: selectedPlan ? 'subscription' : 'merch',
        userId: user.id,
        metadata: {
          source: 'web_checkout',
          plan: selectedPlan,
          nrt_user_id: user.id,
        },
      });

      clearCart();

      if (isMobile) {
        // Mobile: redirect immediately via deep-link
        window.location.href = `https://netreward.online/pay?session=${response.sessionId}`;
      } else {
        // Desktop: show QR code + keep redirect as fallback
        setSessionData({ url: response.url, sessionId: response.sessionId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment initialization failed. Please try again.';
      setError(msg);
      console.error('[Checkout] Payment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !selectedPlan) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <ShoppingBag size={64} color="#282828" style={{ marginBottom: '24px' }} />
        <h2>Your cart is empty</h2>
        <p style={{ color: '#a7a7a7', marginBottom: '32px' }}>
          Looks like you haven't added any merch or selected a plan yet.
        </p>
        <button className="btn-primary" onClick={() => navigate('/store')}>
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Checkout</h1>
        <p style={{ color: '#a7a7a7' }}>Review your order and pay securely with NetReward.</p>
      </header>

      {/* Responsive 2-col → 1-col on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr)',
        gap: '24px',
      }}>
        <style>{`
          @media (min-width: 700px) {
            .checkout-grid { grid-template-columns: 1fr 320px !important; }
          }
        `}</style>
        <div className="checkout-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr)',
          gap: '32px',
        }}>
          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Order Summary */}
            <section className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={18} color="#1ed760" />
                Order Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedPlan && (
                  <div style={{
                    display: 'flex', gap: '14px', alignItems: 'center',
                    padding: '14px', background: 'rgba(30,215,96,0.1)',
                    borderRadius: '10px', border: '1px solid rgba(30,215,96,0.2)',
                  }}>
                    <div style={{
                      width: '52px', height: '52px', background: '#1ed760',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px', color: 'black', flexShrink: 0,
                    }}>
                      {selectedPlan === 'Premium' ? <Star size={28} /> : <Crown size={28} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>{selectedPlan} Plan</div>
                      <div style={{ fontSize: '13px', color: '#1ed760' }}>Monthly Subscription</div>
                    </div>
                    <div style={{ fontWeight: '700', flexShrink: 0 }}>${planPrice.toFixed(2)}</div>
                  </div>
                )}
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{
                      width: '52px', height: '52px', flexShrink: 0,
                      background: `url(${item.image_url}) center/cover`, borderRadius: '8px',
                    }} />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#a7a7a7' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: '700', flexShrink: 0, marginLeft: '8px' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment Method */}
            <section className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={18} color="#1ed760" />
                Payment Method
              </h3>
              <div style={{
                padding: '16px', borderRadius: '10px',
                background: 'rgba(30,215,96,0.08)', border: '2px solid #1ed760',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1ed760 0%, #0ea5e9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Zap size={22} color="black" fill="black" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700' }}>NetReward</div>
                  <div style={{ fontSize: '12px', color: '#a7a7a7' }}>
                    {isMobile ? 'Mobile deep-link payment' : 'Scan QR code with NetReward app'}
                  </div>
                </div>
                <CheckCircle size={18} color="#1ed760" />
              </div>

              {/* Device mode indicator */}
              <div style={{
                marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: '#a7a7a7',
              }}>
                {isMobile ? <Smartphone size={13} /> : <Monitor size={13} />}
                {isMobile ? 'Mobile detected — tap to pay' : 'Desktop detected — QR code will appear after confirming'}
              </div>
            </section>

            {/* ── NetReward Payment Widget (after session is created) ── */}
            {sessionData && (
              <section className="glass" style={{
                padding: '24px', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ fontWeight: '700', fontSize: '16px', textAlign: 'center' }}>
                  Complete Your Payment
                </div>

                {isMobile ? (
                  <MobilePayButton url={payUrl} />
                ) : (
                  <>
                    <QRCodeDisplay url={payUrl} sessionId={sessionData.sessionId} />
                    {/* Fallback desktop link */}
                    <a
                      href={payUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1ed760', fontSize: '13px', textDecoration: 'none' }}
                    >
                      Or click here to open in browser →
                    </a>
                  </>
                )}
              </section>
            )}
          </div>

          {/* ── Price sidebar ── */}
          <aside>
            <div className="glass" style={{
              padding: '24px', borderRadius: '16px',
              position: 'sticky', top: '16px',
            }}>
              <h3 style={{ marginBottom: '20px' }}>Price Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {selectedPlan && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7', fontSize: '14px' }}>
                    <span>{selectedPlan} Subscription</span>
                    <span>${planPrice.toFixed(2)}</span>
                  </div>
                )}
                {items.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7', fontSize: '14px' }}>
                    <span>Merchandise ({items.length})</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7', fontSize: '14px' }}>
                  <span>Shipping</span>
                  <span style={{ color: '#1ed760' }}>FREE</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700' }}>
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div style={{
                  marginBottom: '14px', padding: '12px', borderRadius: '8px',
                  background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                  color: '#e74c3c', fontSize: '13px',
                }}>
                  {error}
                </div>
              )}

              {!sessionData ? (
                <button
                  id="netreward-pay-btn"
                  className="btn-primary"
                  style={{ width: '100%', height: '52px', fontSize: '15px' }}
                  disabled={loading}
                  onClick={handlePayment}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      {isMobile ? <Smartphone size={18} /> : <Zap size={18} />}
                      Pay ${finalTotal.toFixed(2)}
                      <ArrowRight size={18} />
                    </span>
                  )}
                </button>
              ) : (
                <div style={{
                  padding: '12px', borderRadius: '10px',
                  background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.3)',
                  color: '#1ed760', fontSize: '13px', fontWeight: '600', textAlign: 'center',
                }}>
                  ✓ Session created — complete payment above
                </div>
              )}

              <div style={{
                marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                color: '#a7a7a7', fontSize: '12px', justifyContent: 'center',
              }}>
                <ShieldCheck size={14} />
                Secured by NetReward · HMAC-SHA256 verified
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
