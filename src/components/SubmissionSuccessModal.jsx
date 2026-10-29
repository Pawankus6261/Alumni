import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export default function SubmissionSuccessModal({ eyebrow = 'SUBMISSION RECEIVED', title, message, reference, actionLabel = 'Continue', onAction }) {
  return (
    <div className="submission-success-backdrop">
      <section className="submission-success-dialog" role="dialog" aria-modal="true" aria-labelledby="submission-success-title">
        <div className="submission-success-icon"><Check size={27} strokeWidth={2.6} /></div>
        <p className="submission-success-eyebrow">{eyebrow}</p>
        <h2 id="submission-success-title">{title}</h2>
        <p className="submission-success-message">{message}</p>
        {reference && <div className="submission-success-reference"><span>Reference</span><strong>{reference}</strong></div>}
        <button type="button" className="btn btn-primary submission-success-action" onClick={onAction}>{actionLabel}<ArrowRight size={17} /></button>
        <small>Thank you for being part of the BGI alumni community.</small>
      </section>
    </div>
  );
}
