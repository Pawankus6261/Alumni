import React, { useEffect, useState } from 'react';
import { X, Printer, ShieldCheck, GraduationCap, CheckCircle, QrCode } from 'lucide-react';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import { BGI_BHOPAL_LOGO } from '../brand';
import { createMemberIdentityPayload, createMemberIdentityQr, QR_CREDIT } from '../utils/memberIdentityQr';

export default function DigitalPassModal({ passData, onClose }) {
  const [identityQr, setIdentityQr] = useState('');
  const enrollment = String(passData?.enrollment || passData?.enroll_no || '').trim();
  const officialMembershipId = String(passData?.membership_id || passData?.bistaa_id || '').trim();
  const memberIdentifier = officialMembershipId || enrollment || (passData?.id ? `PROFILE-${passData.id}` : 'ID-UNAVAILABLE');
  const qrPayload = createMemberIdentityPayload({ ...passData, membership_id: memberIdentifier });

  useEffect(() => {
    let cancelled = false;
    setIdentityQr('');
    if (passData) {
      createMemberIdentityQr(qrPayload).then(dataUrl => { if (!cancelled) setIdentityQr(dataUrl); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [passData, qrPayload]);

  const printCardOnly = async () => {
    const card = document.querySelector('.digital-pass-modal .digital-pass-print-card');
    if (!card) return;

    const frame = document.createElement('iframe');
    frame.title = 'Print BISTAA membership card';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);

    const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => `<link rel="stylesheet" href="${link.href.replaceAll('&', '&amp;')}">`)
      .join('');
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(style => `<style>${style.textContent}</style>`)
      .join('');

    const printDocument = frame.contentDocument;
    printDocument.open();
    printDocument.write(`<!doctype html>
      <html><head><meta charset="utf-8"><base href="${window.location.origin}/">
      <title>BISTAA Membership Card</title>${stylesheetLinks}${inlineStyles}
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        html, body { width: 100%; min-height: 0; margin: 0; padding: 0; background: #fff; }
        body { display: grid; place-items: center; }
        .digital-pass-print-card {
          position: relative !important; inset: auto !important; top: auto !important; left: auto !important;
          width: 190mm !important; max-width: 190mm !important; margin: 0 !important;
          padding: 8mm !important; transform: none !important; visibility: visible !important;
          box-shadow: none !important; break-inside: avoid !important; page-break-inside: avoid !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
        }
        .digital-pass-print-card * { visibility: visible !important; }
        @media print {
          html, body { height: 190mm; }
          body { display: grid; place-items: center; }
          .digital-pass-print-card { position: relative !important; }
        }
      </style></head><body>${card.outerHTML}</body></html>`);
    printDocument.close();

    let didPrint = false;
    const printWhenReady = async () => {
      if (didPrint || !frame.contentWindow) return;
      didPrint = true;
      const printWindow = frame.contentWindow;
      const imageLoads = Array.from(printDocument.images).map(image =>
        typeof image.decode === 'function' ? image.decode().catch(() => {}) : Promise.resolve()
      );
      await Promise.race([
        Promise.all([printDocument.fonts?.ready, ...imageLoads]),
        new Promise(resolve => window.setTimeout(resolve, 1500)),
      ]);
      printWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => frame.remove(), 60000);
    };

    frame.addEventListener('load', printWhenReady, { once: true });
    window.setTimeout(printWhenReady, 800);
  };

  if (!passData) return null;

  return (
    <div className="modal-backdrop digital-pass-modal" onClick={onClose}>
      <div className="modal-dialog-box digital-pass-modal-dialog" style={{ maxWidth: 760, padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-icon digital-pass-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span className="pill pill-gold" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} /> Verified Association Credential
          </span>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--bgi-navy-900)' }}>
            Official BISTAA Digital Membership Pass
          </h3>
        </div>

        {/* Digital Membership Pass Card (Printable) */}
        <div className="digital-id-pass digital-pass-print-card">
          <div className="digital-pass-watermark" aria-hidden="true">
            <ShieldCheck size={142} strokeWidth={0.8} />
            <span>BISTAA</span>
          </div>
          <div className="pass-header digital-pass-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div className="pass-crest-group digital-pass-brand">
              <div className="digital-pass-brand-mark">
                <span aria-hidden="true"><GraduationCap size={22} /></span>
                <img src={BGI_BHOPAL_LOGO} alt="BGI Bhopal" decoding="async" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="digital-pass-brand-copy">
                <h4 style={{ color: '#003366', fontSize: '1.05rem', lineHeight: 1.2, fontFamily: 'var(--font-serif)' }}>Bansal Group of Institutions</h4>
                <p style={{ color: '#64748b', fontSize: '0.725rem', letterSpacing: '0.8px', fontWeight: 600 }}>
                  ALUMNI ASSOCIATION • BISTAA LIFETIME PASS
                </p>
              </div>
            </div>
            <div className="digital-pass-status-wrap">
              <span className="pill pill-emerald digital-pass-status" style={{ background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.675rem' }}>
                <CheckCircle size={12} /> ACTIVE MEMBER
              </span>
            </div>
          </div>

          <div className="pass-grid-body digital-pass-body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
            <div className="pass-avatar-box digital-pass-avatar" style={{ width: 84, height: 84, borderRadius: '4px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <ImageWithPlaceholder
                src={passData.img_url}
                alt={passData.name}
                variant="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                placeholderLabel={passData.name ? passData.name.split(' ').map(n => n[0]).join('') : 'AL'}
              />
            </div>

            <div className="pass-fields-col digital-pass-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Member Full Name</div>
                <div className="pass-field-val" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{passData.name}</div>
              </div>
              <div>
                <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Enrollment Number</div>
                <div className="pass-field-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#0f172a' }}>
                  {enrollment || 'Not provided'}
                </div>
              </div>
              <div>
                <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>College &amp; Branch</div>
                <div className="pass-field-val" style={{ fontSize: '0.85rem', color: '#334155' }}>
                  {passData.college || 'BIST'} • {passData.branch}
                </div>
              </div>
              <div>
                <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Official Membership ID</div>
                <div className="pass-field-val" style={{ color: '#003366', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {officialMembershipId || 'Verification pending'}
                </div>
              </div>
            </div>

            <div className="pass-qr-box digital-pass-qr" style={{ textAlign: 'center' }}>
              {identityQr ? <img className="digital-pass-identity-qr" src={identityQr} alt={`Unique BISTAA identity QR for ${memberIdentifier}`} /> : <div className="digital-pass-qr-loading" role="status" aria-label="Generating member identity QR"><QrCode size={20} /></div>}
            </div>
          </div>

          <div className="digital-pass-footer" style={{
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.725rem',
            color: '#64748b'
          }}>
            <span>Issued by BISTAA Executive Council, Bhopal</span>
            <span>{QR_CREDIT} · Lifetime member</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="digital-pass-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={printCardOnly} disabled={!identityQr}>
            <Printer size={16} /> {identityQr ? 'Print / Download Card' : 'Preparing member QR…'}
          </button>
        </div>
      </div>
    </div>
  );
}
