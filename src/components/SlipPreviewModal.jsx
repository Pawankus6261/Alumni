import React from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import ImageWithPlaceholder from './ImageWithPlaceholder';

export default function SlipPreviewModal({ slipData, onClose, onActivate }) {
  if (!slipData) return null;

  const fields = [
    ['Applicant', slipData.name],
    ['Enrollment number', slipData.enrollment],
    ['College & branch', [slipData.college, slipData.branch].filter(Boolean).join(' · ')],
    ['UPI transaction reference', slipData.utr],
  ];

  return (
    <div className="modal-backdrop slip-preview-backdrop" onClick={onClose}>
      <section
        className="modal-dialog-box slip-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slip-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="slip-preview-header">
          <div className="slip-preview-heading-icon" aria-hidden="true"><ShieldCheck size={20} /></div>
          <div className="slip-preview-heading-copy">
            <span className="slip-preview-eyebrow">Membership application</span>
            <h2 id="slip-preview-title">Payment slip</h2>
            <p>₹300 BISTAA lifetime membership</p>
          </div>
          <button className="slip-preview-close" onClick={onClose} aria-label="Close payment slip preview"><X size={19} /></button>
        </header>

        <div className="slip-preview-content">
          <div className="slip-preview-image-frame">
            <ImageWithPlaceholder
              src={slipData.slipUrl}
              alt="Uploaded UPI payment slip"
              placeholderLabel="No payment slip was uploaded"
              className="slip-preview-image"
            />
          </div>

          <section className="slip-preview-details" aria-label="Application payment details">
            {fields.map(([label, value]) => (
              <div className="slip-preview-detail" key={label}>
                <span>{label}</span>
                <strong className={label === 'UPI transaction reference' ? 'slip-preview-utr' : ''}>{value || 'Not provided'}</strong>
              </div>
            ))}
          </section>
        </div>

        <footer className="slip-preview-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close preview</button>
          {onActivate && slipData.status !== 'ACTIVE' && (
            <button className="btn btn-primary" onClick={() => { onActivate(slipData.appId); onClose(); }}>
              <CheckCircle2 size={16} /> Activate member
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
