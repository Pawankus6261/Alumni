import React from 'react';
import { X, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import ImageWithPlaceholder from './ImageWithPlaceholder';

export default function SlipPreviewModal({ slipData, onClose, onActivate }) {
  if (!slipData) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog-box" style={{ maxWidth: 480, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-icon" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.2rem', color: 'var(--bgi-navy-900)', marginBottom: '0.35rem' }}>
          UPI Payment Slip Verification
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
          Submitted for ₹300 BISTAA Lifetime Membership
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px',
          marginBottom: '1.25rem',
          maxHeight: '380px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <ImageWithPlaceholder
            src={slipData.slipUrl}
            alt="Submitted UPI screenshot"
            placeholderLabel="No payment slip was uploaded"
            style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>

        <div style={{
          background: '#f1f5f9',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem',
          textAlign: 'left',
          fontSize: '0.825rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem'
        }}>
          <div><b>Applicant:</b> {slipData.name}</div>
          <div><b>Enrollment:</b> <code style={{ fontFamily: 'var(--font-mono)' }}>{slipData.enrollment}</code></div>
          <div><b>College &amp; Branch:</b> {slipData.college} - {slipData.branch}</div>
          <div><b>UPI UTR (12 Digits):</b> <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--bgi-navy-600)', fontWeight: 700 }}>{slipData.utr}</code></div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close Preview
          </button>
          {onActivate && slipData.status !== 'ACTIVE' && (
            <button 
              className="btn btn-primary" 
              style={{ flex: 1.2 }}
              onClick={() => {
                onActivate(slipData.appId);
                onClose();
              }}
            >
              <CheckCircle2 size={16} /> Activate Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
