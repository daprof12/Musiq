import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useCartStore } from '../store/useCartStore';
import {
  CreditCard, ShoppingBag, ShieldCheck, ArrowRight,
  Loader2, Star, Crown, CheckCircle, Zap, Smartphone, Monitor,
  Clock, ChevronLeft,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../lib/paymentService';
import { useToastStore } from '../store/useToastStore';

// ── Mobile detection ──────────────────────────────────────────────────────────
const isMobileDevice = () =>
  /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent);

// ── Live countdown hook ───────────────────────────────────────────────────────
function useCountdown(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00');
        setExpired(true);
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { timeLeft, expired };
}

// ── QR Code (real, scannable) ─────────────────────────────────────────────────
const QRCodeDisplay = ({ url, sessionId }: { url: string; sessionId: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        display: 'inline-block',
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 0 0 4px rgba(30,215,96,0.3)',
        margin: '0 auto',
      }}
    >
      <QRCodeSVG
        value={url}
        size={160}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin={false}
        imageSettings={{
          src: '/nrt-icon.svg',
          x: undefined,
          y: undefined,
          height: 32,
          width: 32,
          excavate: true,
        }}
      />
    </div>
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
    <a href={url} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, #1ed760 0%, #0ea5e9 100%)',
          color: 'black', fontWeight: '800', fontSize: '16px',
          padding: '16px 24px', borderRadius: '14px', cursor: 'pointer',
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
  const [sessionData, setSessionData] = useState<{
    url: string;
    sessionId: string;
    expiresAt: string;
    merchantName: string;
  } | null>(null);

  const { user } = useAuth();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Preserve cart snapshot so it still shows after clearCart()
  const cartSnapshot = useRef(items);

  const selectedPlan = location.state?.planName as string | undefined;
  const planPrice = selectedPlan === 'Premium' ? 9.99 : selectedPlan === 'Artist' ? 19.99 : 0;
  const finalTotal = total + planPrice;

  const isMobile = isMobileDevice();

  // Build the NetReward pay URL (deep-link on mobile, QR on desktop)
  const payUrl = sessionData
    ? `https://netreward.online/pay?session=${sessionData.sessionId}`
    : '';

  // Live countdown
  const { timeLeft, expired: sessionExpired } = useCountdown(sessionData?.expiresAt ?? null);

  const handlePayment = async () => {
    if (items.length === 0 && !selectedPlan) return;
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setLoading(true);
    addToast('Preparing secure checkout...', 'info');
    setError(null);

    try {
      // Snapshot cart before clearing
      cartSnapshot.current = [...items];

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
        // Desktop: show QR code
        setSessionData({
          url: response.url,
          sessionId: response.sessionId,
          expiresAt: response.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          merchantName: response.merchantName || 'Musiq',
        });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast(err instanceof Error ? err.message : 'Failed to start checkout', 'error');
      const msg = err instanceof Error ? err.message : 'Payment initialization failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !selectedPlan && !sessionData) {
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

  // ── Session expired screen ─────────────────────────────────────────────────
  if (sessionExpired && sessionData) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
        background: 'var(--bg-primary, #121212)',
      }}>
        <div className="glass" style={{
          maxWidth: '360px', width: '100%', borderRadius: '20px',
          padding: '40px 32px', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(241,196,15,0.12)', border: '3px solid rgba(241,196,15,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Clock size={32} color="#f1c40f" />
          </div>
          <h2 style={{ marginBottom: '8px', fontSize: '22px' }}>Request Expired</h2>
          <p style={{ color: '#a7a7a7', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
            This payment request has expired. Please go back and try again to generate a new one.
          </p>
          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: '12px' }}
            onClick={() => {
              setSessionData(null);
              setError(null);
            }}
          >
            Try Again
          </button>
          <button
            style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#a7a7a7', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '600',
            }}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: '#a7a7a7',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '14px', padding: '8px 0',
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Checkout</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Order Summary */}
          <section className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={18} color="#1ed760" />
              Order Summary
            </h3>
            {selectedPlan && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedPlan === 'Premium' ? <Star size={16} color="#1ed760" /> : <Crown size={16} color="#f59e0b" />}
                  <div>
                    <div style={{ fontWeight: '600' }}>{selectedPlan} Subscription</div>
                    <div style={{ fontSize: '12px', color: '#a7a7a7' }}>Monthly plan</div>
                  </div>
                </div>
                <div style={{ fontWeight: '700', flexShrink: 0 }}>${planPrice.toFixed(2)}</div>
              </div>
            )}
            {(sessionData ? cartSnapshot.current : items).map((item) => (
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

              {/* Countdown timer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '20px',
                background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)',
              }}>
                <Clock size={14} color="#f1c40f" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f1c40f', fontFamily: 'monospace' }}>
                  Expires in {timeLeft}
                </span>
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
              {(sessionData ? cartSnapshot.current : items).length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7', fontSize: '14px' }}>
                  <span>Merchandise ({(sessionData ? cartSnapshot.current : items).length})</span>
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
  );
};

export default Checkout;
