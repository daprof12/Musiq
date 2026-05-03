import { Check, Star, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0.00',
      icon: Zap,
      color: '#a7a7a7',
      features: ['Ad-supported listening', 'Standard audio quality', 'Online listening only'],
      buttonText: 'Current Plan',
      active: true,
    },
    {
      name: 'Premium',
      price: '$9.99',
      icon: Star,
      color: '#1ed760',
      features: ['Ad-free music listening', 'High quality audio', 'Download for offline listening', 'Unlimited skips'],
      buttonText: 'Upgrade to Premium',
      active: false,
    },
    {
      name: 'Artist',
      price: '$19.99',
      icon: Crown,
      color: '#9b59b6',
      features: ['Everything in Premium', 'Upload your own music', 'Artist dashboard & analytics', 'Verified profile badge'],
      buttonText: 'Become an Artist',
      active: false,
    }
  ];

  const handleUpgrade = (planName: string) => {
    // Navigate to checkout with plan info
    navigate('/checkout', { state: { planName } });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Choose your plan</h1>
        <p style={{ fontSize: '18px', color: '#a7a7a7' }}>Listen without limits on your phone, speaker, and other devices.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className="glass" 
            style={{ 
              padding: '40px', 
              borderRadius: '24px', 
              display: 'flex', 
              flexDirection: 'column',
              border: plan.active ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.1)',
              position: 'relative'
            }}
          >
            {plan.active && (
                <div style={{ 
                    position: 'absolute', 
                    top: '-12px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    background: plan.color,
                    color: 'black',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700'
                }}>
                    CURRENT PLAN
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <plan.icon size={32} color={plan.color} />
                <h2 style={{ margin: 0 }}>{plan.name}</h2>
            </div>

            <div style={{ marginBottom: '32px' }}>
                <span style={{ fontSize: '32px', fontWeight: '700' }}>{plan.price}</span>
                <span style={{ color: '#a7a7a7' }}> / month</span>
            </div>

            <div style={{ flex: 1, marginBottom: '40px' }}>
                {plan.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '14px', alignItems: 'center' }}>
                        <Check size={18} color={plan.color} />
                        {feature}
                    </div>
                ))}
            </div>

            <button 
                className="btn-primary" 
                onClick={() => !plan.active && handleUpgrade(plan.name)}
                style={{ 
                    width: '100%', 
                    background: plan.active ? 'transparent' : plan.color,
                    color: plan.active ? 'white' : 'black',
                    border: plan.active ? '1px solid white' : 'none',
                    cursor: plan.active ? 'default' : 'pointer'
                }}
            >
                {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
