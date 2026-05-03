import { useState, useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import { CreditCard, ShoppingBag, ShieldCheck, ArrowRight, Loader2, Globe, Zap, Star, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createCheckoutSession } from '../lib/paymentService';
import type { PaymentProvider } from '../lib/paymentService';

const Checkout = () => {
  const { items, total, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>('stripe');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract plan from navigation state if redirected from Subscription page
  const selectedPlan = location.state?.planName;
  const planPrice = selectedPlan === 'Premium' ? 9.99 : selectedPlan === 'Artist' ? 19.99 : 0;
  
  const finalTotal = total + planPrice;

  const handlePayment = async () => {
    if (items.length === 0 && !selectedPlan) return;
    
    setLoading(true);
    try {
      const response = await createCheckoutSession(provider, {
        items: [
            ...items,
            ...(selectedPlan ? [{ name: `${selectedPlan} Subscription`, price: planPrice, quantity: 1 }] : [])
        ],
        totalAmount: finalTotal,
        type: selectedPlan ? 'subscription' : 'merch',
        metadata: { 
            source: 'web_checkout',
            plan: selectedPlan 
        }
      });

      // In a real app, this redirects to Stripe/Paystack
      window.location.href = response.url;
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !selectedPlan) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <ShoppingBag size={64} color="#282828" style={{ marginBottom: '24px' }} />
        <h2>Your cart is empty</h2>
        <p style={{ color: '#a7a7a7', marginBottom: '32px' }}>Looks like you haven't added any merch or selected a plan yet.</p>
        <button className="btn-primary" onClick={() => navigate('/store')}>Back to Store</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '8px' }}>Checkout</h1>
        <p style={{ color: '#a7a7a7' }}>Review your order and choose a payment method.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingBag size={20} color="#1ed760" />
                Order Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Show Plan if selected */}
              {selectedPlan && (
                <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(30,215,96,0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(30,215,96,0.2)'
                }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: '#1ed760',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    color: 'black'
                  }}>
                    {selectedPlan === 'Premium' ? <Star size={32} /> : <Crown size={32} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '18px' }}>{selectedPlan} Plan</div>
                    <div style={{ fontSize: '14px', color: '#1ed760' }}>Monthly Subscription</div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px' }}>${planPrice.toFixed(2)}</div>
                </div>
              )}

              {/* Show Cart Items */}
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: `url(${item.image_url})`, 
                    backgroundSize: 'cover',
                    borderRadius: '8px' 
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: '#a7a7a7' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CreditCard size={20} color="#1ed760" />
                Payment Method
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button 
                    onClick={() => setProvider('stripe')}
                    style={{ 
                        padding: '16px', 
                        borderRadius: '12px', 
                        background: provider === 'stripe' ? 'rgba(30,215,96,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${provider === 'stripe' ? '#1ed760' : 'transparent'}`,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Globe size={24} color={provider === 'stripe' ? '#1ed760' : '#a7a7a7'} />
                    <span style={{ fontWeight: '600' }}>Stripe</span>
                    <span style={{ fontSize: '10px', color: '#a7a7a7' }}>International Cards</span>
                </button>
                <button 
                    onClick={() => setProvider('paystack')}
                    style={{ 
                        padding: '16px', 
                        borderRadius: '12px', 
                        background: provider === 'paystack' ? 'rgba(30,215,96,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${provider === 'paystack' ? '#1ed760' : 'transparent'}`,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Zap size={24} color={provider === 'paystack' ? '#1ed760' : '#a7a7a7'} />
                    <span style={{ fontWeight: '600' }}>Paystack</span>
                    <span style={{ fontSize: '10px', color: '#a7a7a7' }}>Africa/Global</span>
                </button>
            </div>
          </section>
        </div>

        <aside>
          <div className="glass" style={{ padding: '32px', borderRadius: '16px', position: 'sticky', top: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Price Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {selectedPlan && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7' }}>
                    <span>{selectedPlan} Subscription</span>
                    <span>${planPrice.toFixed(2)}</span>
                </div>
              )}
              {items.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7' }}>
                    <span>Merchandise ({items.length})</span>
                    <span>${total.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a7a7a7' }}>
                <span>Shipping</span>
                <span style={{ color: '#1ed760' }}>FREE</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700' }}>
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', height: '56px', fontSize: '16px' }}
              disabled={loading}
              onClick={handlePayment}
            >
              {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    Pay ${finalTotal.toFixed(2)}
                    <ArrowRight size={20} />
                </span>
              )}
            </button>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a7a7a7', fontSize: '12px', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
              Secure encrypted payments
            </div>
          </div>
        </aside>
      </div>
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
