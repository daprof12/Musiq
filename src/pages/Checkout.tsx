import { useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import {
  CreditCard, ShoppingBag, ShieldCheck, Star, Crown, Smartphone, Monitor, ChevronLeft,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const isMobileDevice = () =>
  /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent);

const Checkout = () => {
  const { items, total } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedPlan = location.state?.planName as string | undefined;
  const planPrice = selectedPlan === 'Premium' ? 9.99 : selectedPlan === 'Artist' ? 19.99 : 0;
  const finalTotal = total + planPrice;

  const isMobile = isMobileDevice();

  useEffect(() => {
    if ((items.length === 0 && !selectedPlan) || !user) return;

    // Inject the NetReward Pay button dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.netreward.online/pay.js';
    script.setAttribute('data-api-key', import.meta.env.VITE_NRT_API_KEY);
    script.setAttribute('data-amount', finalTotal.toString());
    script.setAttribute('data-order-id', `MUSIQ_${Date.now()}`);
    script.setAttribute('data-container', '#nrt-pay-container');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      const container = document.getElementById('nrt-pay-container');
      if (container) container.innerHTML = '';
    };
  }, [finalTotal, items.length, selectedPlan, user]);

  if (!user) {
    navigate('/login', { state: { from: '/checkout' } });
    return null;
  }

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          </section>

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
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "black", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src="https://pmpeyfkbqipfnhokfksl.supabase.co/storage/v1/object/public/assets/nrt-logo.png" width="28" height="28" style={{ borderRadius: "50%" }} alt="NRT Logo" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700' }}>NetReward (Zero-Touch)</div>
                <div style={{ fontSize: '12px', color: '#a7a7a7' }}>
                  Powered by NetReward CDN
                </div>
              </div>
            </div>
            <div style={{
              marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: '#a7a7a7',
            }}>
              {isMobile ? <Smartphone size={13} /> : <Monitor size={13} />}
              {isMobile ? 'Mobile detected — tap to pay' : 'Desktop detected — QR code will appear after clicking'}
            </div>
          </section>
        </div>

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

            {/* NetReward Payment Container */}
            <div id="nrt-pay-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>

            <div style={{
              marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px',
              color: '#a7a7a7', fontSize: '12px', justifyContent: 'center',
            }}>
              <ShieldCheck size={14} />
              Secured by NetReward CDN
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
