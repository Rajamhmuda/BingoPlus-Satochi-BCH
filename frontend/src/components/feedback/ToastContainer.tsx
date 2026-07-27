import React from 'react';
import { useUIStore } from '../../stores/ui.store.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map((toast) => {
        const bg =
          toast.type === 'success'
            ? 'rgba(10, 193, 142, 0.9)'
            : toast.type === 'error'
            ? 'rgba(244, 63, 94, 0.9)'
            : 'rgba(59, 130, 246, 0.9)';

        return (
          <div
            key={toast.id}
            style={{
              background: bg,
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '280px',
              backdropFilter: 'blur(8px)',
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span style={{ fontSize: '14px', fontWeight: 600, flex: 1 }}>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
