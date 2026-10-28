import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: 'var(--bgi-emerald)' }} />
          ) : (
            <AlertCircle size={18} style={{ color: 'var(--bgi-crimson)' }} />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
