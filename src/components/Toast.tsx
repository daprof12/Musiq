import { useToastStore } from '../store/useToastStore';
import type { ToastType } from '../store/useToastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px', // Above player and mobile nav
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: any, onRemove: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color="#1ed760" />;
      case 'error': return <XCircle size={18} color="#ff4444" />;
      case 'info': return <Info size={18} color="#1d9bf0" />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: 'rgba(40, 40, 40, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: '280px',
      maxWidth: '400px',
      pointerEvents: 'auto',
      transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      {getIcon(toast.type)}
      <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{toast.message}</div>
      <button 
        onClick={onRemove}
        style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer', padding: '4px' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
