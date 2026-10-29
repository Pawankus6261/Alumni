import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Printer, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  HelpCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getBistaaStatus } from '../api';
import { createMemberIdentityPayload, createMemberIdentityQr, QR_CREDIT } from '../utils/memberIdentityQr';

export default function StatusPage({ onOpenSlip, onOpenDigitalPass, setView, initialEnrollment = '' }) {
  const [queryInput, setQueryInput] = useState(initialEnrollment);
  const [searchedRecord, setSearchedRecord] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [memberIdentityQr, setMemberIdentityQr] = useState('');

  useEffect(() => {
    if (initialEnrollment) {
      handleSearch(initialEnrollment);
    }
  }, [initialEnrollment]);

  useEffect(() => {
    let cancelled = false;
    setMemberIdentityQr('');
    if (searchedRecord?.status === 'ACTIVE') {
      createMemberIdentityQr(createMemberIdentityPayload({
        ...searchedRecord,
        name: searchedRecord.name || [searchedRecord.firstname, searchedRecord.lastname].filter(Boolean).join(' '),
      })).then(dataUrl => { if (!cancelled) setMemberIdentityQr(dataUrl); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [searchedRecord]);

  const handleSearch = async (term) => {
    const q = (term || queryInput).trim().toUpperCase();
    if (!q) return;

    setHasSearched(true);
    setSearchError('');
    setSearchedRecord(null);
    try {
      const match = await getBistaaStatus(q);
      setSearchedRecord(match);
      if (match.status === 'ACTIVE') {
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
      }
    } catch (error) {
      if (error.status !== 404) setSearchError(error.message || 'Status could not be checked.');
    }
  };

  const isApproved = searchedRecord?.status === 'ACTIVE';
  const isRejected = searchedRecord?.status === 'REJECTED';
  const isPending = searchedRecord?.status === 'PENDING_VERIFICATION';

  return (
    <div style={{ minHeight: '80vh' }}>
      
      {/* Premium Hero Band */}
      <div className="status-hero-band">
        <div className="container">
          <div className="page-hero-eyebrow" style={{ justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
            Real-Time Application &amp; Membership Tracker
          </div>
          <h1 className="page-hero-title">Check BISTAA Registration Status</h1>
          <p className="page-hero-desc" style={{ margin: '0 auto' }}>
            Track your ₹300 association lifetime membership verification, UPI payment reconciliation, 
            and view or download your official digital membership identity pass.
          </p>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container">

        {/* Search Input Box */}
        <div className="status-tracker-card" style={{ marginBottom: '2.5rem' }}>
          <form className="status-search-form"
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <div className="status-search-input-wrap" style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.75rem', fontFamily: 'var(--font-mono)', fontSize: '1rem', height: 48 }}
                placeholder="Enter your enrollment number or 12-digit UTR..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
              />
            </div>
            <button type="submit" className="status-search-submit btn btn-primary btn-lg" style={{ height: 48 }}>
              <Search size={18} /> Track Status
            </button>
          </form>

        </div>

        {/* Results Container */}
        {hasSearched && (
          <div className="status-tracker-card" style={{ animation: 'scaleUp 0.25s ease-out' }}>
            
            {!searchedRecord ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--bgi-crimson-bg)',
                  color: 'var(--bgi-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <XCircle size={30} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--bgi-navy-900)', marginBottom: '0.4rem' }}>
                  No Application Found
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
                  {searchError || <>No BISTAA membership record found matching "<b>{queryInput}</b>". Please check the enrollment number spelling, or submit the ₹300 BISTAA registration form.</>}
                </p>
                <button className="btn btn-gold btn-sm" onClick={() => setView('bistaa')}>
                  Submit BISTAA Registration (₹300)
                </button>
              </div>
            ) : (
              <div>
                {/* Stepper Timeline */}
                <div className="stepper-timeline">
                  {/* Step 1: Submitted */}
                  <div className="step-node completed">
                    <div className="step-circle">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="step-label">Application Submitted</div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className={`step-node ${isApproved ? 'completed' : isPending ? 'active' : ''}`}>
                    <div className="step-circle">
                      {isApproved ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="step-label">Payment Verification</div>
                  </div>

                  {/* Step 3: Activated / Decision */}
                  <div className={`step-node ${isApproved ? 'completed' : isRejected ? 'active' : ''}`}>
                    <div className="step-circle" style={{
                      borderColor: isRejected ? 'var(--bgi-crimson)' : undefined,
                      color: isRejected ? 'var(--bgi-crimson)' : undefined
                    }}>
                      {isApproved ? <ShieldCheck size={20} /> : isRejected ? <XCircle size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div className="step-label">
                      {isRejected ? 'Application Rejected' : 'BISTAA Lifetime Member'}
                    </div>
                  </div>
                </div>

                {/* Status Callout Banner */}
                <div style={{
                  background: isApproved ? '#ecfdf5' : isPending ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${isApproved ? '#a7f3d0' : isPending ? '#fde68a' : '#fecaca'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <span className={`pill ${isApproved ? 'pill-emerald' : isPending ? 'pill-gold' : 'pill-navy'}`} style={{ marginBottom: '0.35rem' }}>
                      {isApproved && <CheckCircle2 size={13} />}
                      {isPending && <Clock size={13} />}
                      {isRejected && <XCircle size={13} />}
                      Status: {searchedRecord.status}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', color: isApproved ? '#065f46' : isPending ? '#92400e' : '#991b1b', marginTop: '0.25rem' }}>
                      {isApproved && 'Approved & Active BISTAA Lifetime Member'}
                      {isPending && 'Payment Verification in Progress (Review Queue)'}
                      {isRejected && 'Application Not Approved'}
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: isApproved ? '#047857' : isPending ? '#b45309' : '#b91c1c', marginTop: '0.2rem' }}>
                      {isApproved && `Official Membership ID: ${searchedRecord.membership_id}. Verified by ${searchedRecord.verified_by || 'BISTAA Desk'}.`}
                      {isPending && 'Your 12-digit UPI UTR is currently being matched against the bank ledger. Usually verified within 4–12 hours.'}
                      {isRejected && (searchedRecord.rejection_reason || 'Rejection reason: Slip image unreadable or invalid UTR.')}
                    </p>
                  </div>

                  {isApproved && (
                    <button 
                      className="btn btn-gold btn-sm"
                      onClick={() => onOpenDigitalPass(searchedRecord)}
                    >
                      <ShieldCheck size={16} /> View Digital ID Card
                    </button>
                  )}
                </div>

                {/* Application Details Breakdown Grid */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--bgi-navy-900)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                    Application &amp; Payment Ledger Record
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.85rem' }}>
                    <div>
                      <span className="pass-field-label">Alumnus Name</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {searchedRecord.name}
                      </div>
                    </div>

                    <div>
                      <span className="pass-field-label">Enrollment Number</span>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--bgi-navy-850)', fontSize: '0.95rem' }}>
                        {searchedRecord.enrollment}
                      </div>
                    </div>

                    <div>
                      <span className="pass-field-label">College &amp; Branch</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {searchedRecord.college} • {searchedRecord.branch}
                      </div>
                    </div>

                    <div>
                      <span className="pass-field-label">Membership Contribution</span>
                      <div style={{ fontWeight: 700, color: 'var(--bgi-emerald)' }}>
                        ₹{searchedRecord.amount}.00 INR [Paid]
                      </div>
                    </div>

                    <div>
                      <span className="pass-field-label">UPI Reference / UTR</span>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--bgi-navy-600)' }}>
                        {searchedRecord.upi_transaction_id}
                      </div>
                    </div>

                    <div>
                      <span className="pass-field-label">Submission Timestamp</span>
                      <div style={{ color: 'var(--text-tertiary)' }}>
                        {searchedRecord.submitted_at}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenSlip({
                        slipUrl: searchedRecord.transaction_slip,
                        name: searchedRecord.name,
                        enrollment: searchedRecord.enrollment,
                        branch: searchedRecord.branch,
                        college: searchedRecord.college,
                        utr: searchedRecord.upi_transaction_id,
                        status: searchedRecord.status
                      })}
                    >
                      <Eye size={14} /> View Attached Payment Slip
                    </button>
                    {isApproved && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--bgi-emerald)', fontWeight: 600 }}>
                        <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Official ID Issued: {searchedRecord.membership_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Digital Pass Preview Card if Approved */}
                {isApproved && (
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--bgi-navy-900)' }}>
                        Official BISTAA Lifetime Identity Pass
                      </h4>
                      <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                        <Printer size={15} /> Print Physical Card
                      </button>
                    </div>

                    <div className="digital-id-pass" style={{
                      background: '#ffffff',
                      border: '2px solid #003366',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.75rem',
                      color: 'var(--text-main)',
                      position: 'relative',
                      boxShadow: 'var(--shadow-subtle)'
                    }}>
                      <div className="pass-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: '1rem',
                        marginBottom: '1.25rem'
                      }}>
                        <div className="pass-crest-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: '4px',
                            background: '#003366',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '1.25rem'
                          }}>
                            B
                          </div>
                          <div>
                            <h4 style={{ color: '#003366', fontSize: '1.05rem', lineHeight: 1.2, fontFamily: 'var(--font-serif)' }}>Bansal Group of Institutions</h4>
                            <p style={{ color: '#64748b', fontSize: '0.725rem', letterSpacing: '0.8px', fontWeight: 600 }}>
                              ALUMNI ASSOCIATION • BISTAA LIFETIME PASS
                            </p>
                          </div>
                        </div>
                        <span className="pill pill-emerald" style={{ background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.675rem' }}>
                          <CheckCircle2 size={12} /> ACTIVE MEMBER
                        </span>
                      </div>

                      <div className="pass-grid-body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="pass-avatar-box" style={{ width: 84, height: 84, borderRadius: '4px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#003366',
                            fontWeight: 700,
                            fontSize: '1.75rem'
                          }}>
                            {searchedRecord.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                        </div>

                        <div className="pass-fields-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Member Full Name</div>
                            <div className="pass-field-val" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{searchedRecord.name}</div>
                          </div>
                          <div>
                            <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Enrollment Number</div>
                            <div className="pass-field-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#0f172a' }}>
                              {searchedRecord.enrollment}
                            </div>
                          </div>
                          <div>
                            <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>College &amp; Branch</div>
                            <div className="pass-field-val" style={{ fontSize: '0.85rem', color: '#334155' }}>
                              {searchedRecord.college} • {searchedRecord.branch}
                            </div>
                          </div>
                          <div>
                            <div className="pass-field-label" style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Membership ID</div>
                            <div className="pass-field-val" style={{ color: '#003366', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {searchedRecord.membership_id}
                            </div>
                          </div>
                        </div>

                        <div className="pass-qr-box" style={{ textAlign: 'center' }}>
                          {memberIdentityQr ? <img src={memberIdentityQr} alt={`Unique identity QR for ${searchedRecord.membership_id}`} style={{ display: 'block', boxSizing: 'border-box', width: 128, height: 128, minWidth: 128, aspectRatio: '1 / 1', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '6px', imageRendering: 'pixelated' }} /> : <div style={{ boxSizing: 'border-box', width: 128, height: 128, minWidth: 128, aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: 10 }}>Preparing QR…</div>}
                        </div>
                      </div>

                      <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#64748b' }}>
                        <span>Issued by BISTAA Executive Council, Bhopal</span>
                        <span>{QR_CREDIT} · Lifetime member</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  </div>
);
}
