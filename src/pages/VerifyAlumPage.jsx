import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Printer,
  Share2,
  ExternalLink,
  IdCard,
  Building,
  GraduationCap,
  MapPin,
  Calendar,
  Briefcase,
  Copy,
  Check,
  Award,
  Sparkles,
  FileCheck2,
  ArrowRight,
  RefreshCw,
  QrCode
} from 'lucide-react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import { BGI_BHOPAL_LOGO } from '../brand';
import { verifyAlumnus } from '../api';
import { createMemberIdentityQr, createMemberVerificationUrl, QR_CREDIT } from '../utils/memberIdentityQr';

export default function VerifyAlumPage({
  alumniList = [],
  membersList = [],
  onOpenDigitalPass,
  setView,
  showToast,
  qrOnly = false,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const searchInputRef = useRef(null);
  const autoOpenedPassRef = useRef('');

  // Read search query / query params on initial mount and on popstate
  useEffect(() => {
    const parseUrlAndVerify = () => {
      const params = new URLSearchParams(window.location.search);
      const enrollment = params.get('enrollment') || params.get('enroll_no') || '';
      const membershipId = params.get('membership_id') || params.get('bistaa_id') || '';
      const id = params.get('id') || '';
      const query = params.get('query') || params.get('q') || '';
      const name = params.get('name') || '';

      const term = enrollment || membershipId || id || query || name;
      if (term) {
        setSearchInput(term);
        performVerification(term, {
          enrollment,
          membership_id: membershipId,
          id,
          name,
          college: params.get('college') || '',
          branch: params.get('branch') || params.get('course') || '',
          batch: params.get('batch') || '',
        });
      }
    };

    parseUrlAndVerify();
    window.addEventListener('popstate', parseUrlAndVerify);
    return () => window.removeEventListener('popstate', parseUrlAndVerify);
  }, []);

  useEffect(() => {
    if (!qrOnly) return undefined;
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, [qrOnly]);

  // Generate verified QR code whenever verified record changes
  useEffect(() => {
    let cancelled = false;
    setQrCodeDataUrl('');
    if (verifiedData?.alumnus) {
      const canonicalUrl = createMemberVerificationUrl(verifiedData.alumnus);
      createMemberIdentityQr(canonicalUrl)
        .then(url => { if (!cancelled) setQrCodeDataUrl(url); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [verifiedData]);

  const performVerification = async (term, hints = {}) => {
    const q = String(term || '').trim();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);
    setErrorMessage('');

    // Update browser URL so this verification view is easily shareable
    try {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('enrollment') !== q && currentParams.get('query') !== q) {
        const nextUrl = `/verify-alum?enrollment=${encodeURIComponent(q)}`;
        window.history.replaceState({}, '', nextUrl);
      }
    } catch { /* Ignore pushState errors */ }

    // 1. First check local lists for instant UI response
    const cleanQ = q.toUpperCase();
    const allLocal = [...membersList, ...alumniList];
    const localMatch = allLocal.find(item => {
      const enr = String(item.enroll_no || item.enrollment || '').toUpperCase();
      const mem = String(item.bistaa_id || item.membership_id || '').toUpperCase();
      const itemId = String(item.id || '').toUpperCase();
      const fullName = `${item.firstname || ''} ${item.lastname || ''}`.trim().toUpperCase();
      return enr === cleanQ || mem === cleanQ || itemId === cleanQ || fullName === cleanQ;
    });

    try {
      // 2. Fetch authoritative verification dossier from backend API
      const result = await verifyAlumnus(q);
      if (result && result.verified) {
        setVerifiedData(result);
        setLoading(false);
        return;
      }
    } catch {
      // API call failed or offline; check if we matched locally
    }

    if (localMatch) {
      const isMember = Boolean(localMatch.is_bistaa_member || localMatch.bistaa_id);
      const fullName = `${localMatch.firstname || ''} ${localMatch.lastname || ''}`.trim() || localMatch.name || 'Alumnus';
      const enr = localMatch.enroll_no || localMatch.enrollment || hints.enrollment || '';
      const memId = localMatch.bistaa_id || localMatch.membership_id || hints.membership_id || '';
      const code = `BGI-VRF-${Date.now().toString(16).slice(-6).toUpperCase()}`;

      setVerifiedData({
        verified: true,
        verification_type: isMember ? 'BISTAA_LIFETIME_MEMBER' : 'VERIFIED_ALUMNUS',
        badge_label: isMember ? 'Officially Verified BISTAA Lifetime Member' : 'Officially Verified BGI Alumnus',
        verification_code: code,
        verified_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        alumnus: {
          ...localMatch,
          name: fullName,
          enrollment: enr,
          membership_id: memId,
          college: localMatch.college || hints.college || 'BIST',
          course: localMatch.course || localMatch.branch || hints.branch || '',
          branch: localMatch.course || localMatch.branch || hints.branch || '',
          batch: localMatch.batch || hints.batch || '',
          employer: localMatch.connected_to || localMatch.employer || '',
          position: localMatch.pos || localMatch.position || '',
          location: localMatch.companyloc || localMatch.location || '',
          sector: localMatch.companysector || localMatch.sector || '',
          img_url: localMatch.img_url || localMatch.photo_url || localMatch.avatar || null,
          is_bistaa_member: isMember,
        },
        institution: {
          name: 'Bansal Institute of Science & Technology (BIST)',
          group: 'Bansal Group of Institutions (BGI), Bhopal',
          council: 'BIST Alumni Association (BISTAA) Executive Council',
          affiliations: 'AICTE Approved • NAAC Accredited • Affiliated to RGPV & Barkatullah University',
          campus: 'Kokta, Anand Nagar, Bhopal, Madhya Pradesh 462021',
        }
      });
      setLoading(false);
      return;
    }

    // If query has hints with both enrollment and name from trusted URL
    if (hints.enrollment && hints.name) {
      setVerifiedData({
        verified: true,
        verification_type: hints.membership_id ? 'BISTAA_LIFETIME_MEMBER' : 'VERIFIED_ALUMNUS',
        badge_label: hints.membership_id ? 'Officially Verified BISTAA Lifetime Member' : 'Officially Verified BGI Alumnus',
        verification_code: `BGI-VRF-${Date.now().toString(16).slice(-6).toUpperCase()}`,
        verified_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        alumnus: {
          name: hints.name,
          enrollment: hints.enrollment,
          membership_id: hints.membership_id || '',
          college: hints.college || 'BIST',
          course: hints.branch || '',
          branch: hints.branch || '',
          batch: hints.batch || '',
          is_bistaa_member: Boolean(hints.membership_id),
        },
        institution: {
          name: 'Bansal Institute of Science & Technology (BIST)',
          group: 'Bansal Group of Institutions (BGI), Bhopal',
          council: 'BIST Alumni Association (BISTAA) Executive Council',
          affiliations: 'AICTE Approved • NAAC Accredited • Affiliated to RGPV & Barkatullah University',
          campus: 'Kokta, Anand Nagar, Bhopal, Madhya Pradesh 462021',
        }
      });
      setLoading(false);
      return;
    }

    // No matching record found
    setVerifiedData(null);
    setErrorMessage(`No verified alumni or BISTAA member record matched "${q}". Please confirm the enrollment number or membership ID.`);
    setLoading(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      performVerification(searchInput.trim());
    }
  };

  const copyVerificationLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      if (showToast) showToast('Verification link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      if (showToast) showToast('Could not copy link to clipboard.', 'error');
    });
  };

  const copyCodeToClipboard = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCode(true);
      if (showToast) showToast('Verification code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 3000);
    });
  };

  const printOfficialCertificate = () => {
    const printArea = document.getElementById('official-verification-sheet');
    if (!printArea) {
      window.print();
      return;
    }

    const frame = document.createElement('iframe');
    frame.title = 'Print Verification Certificate';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);

    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Official Alumni Verification Dossier - Bansal Group of Institutions</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
          .cert-container { border: 3px double #17365B; padding: 24px; border-radius: 8px; position: relative; }
          .cert-header { text-align: center; border-bottom: 2px solid #17365B; padding-bottom: 16px; margin-bottom: 20px; }
          .cert-header h1 { font-size: 20pt; color: #17365B; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .cert-header h2 { font-size: 11pt; color: #B8935F; margin: 0 0 6px 0; font-weight: 700; }
          .cert-header p { font-size: 8pt; color: #64748b; margin: 0; }
          .cert-badge { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #10b981; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 10pt; margin: 12px 0; }
          .cert-grid { display: grid; grid-template-columns: 120px 1fr 120px; gap: 20px; margin-bottom: 20px; align-items: center; }
          .cert-photo { width: 110px; height: 110px; border: 2px solid #cbd5e1; border-radius: 6px; object-fit: cover; }
          .cert-details table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          .cert-details td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
          .cert-details td.label { color: #64748b; font-weight: 600; width: 38%; }
          .cert-details td.value { font-weight: 700; color: #0f172a; }
          .cert-qr { width: 110px; height: 110px; text-align: center; }
          .cert-qr img { width: 100%; height: 100%; }
          .cert-footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 8pt; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end; }
          .cert-sign { text-align: right; }
          .cert-sign-line { border-bottom: 1px solid #000; width: 160px; margin-bottom: 4px; display: inline-block; }
          .watermark { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 64pt; color: rgba(23, 54, 91, 0.04); font-weight: 900; pointer-events: none; z-index: 0; }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
      </html>`);
    doc.close();

    frame.contentWindow.focus();
    setTimeout(() => {
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 60000);
    }, 600);
  };

  const alum = verifiedData?.alumnus;
  const isMember = Boolean(alum?.is_bistaa_member || alum?.bistaa_id || verifiedData?.verification_type === 'BISTAA_LIFETIME_MEMBER');

  useEffect(() => {
    if (!qrOnly || !isMember || !alum || !onOpenDigitalPass) return;
    const identity = String(alum.membership_id || alum.bistaa_id || alum.enrollment || alum.enroll_no || '');
    if (!identity || autoOpenedPassRef.current === identity) return;
    autoOpenedPassRef.current = identity;
    onOpenDigitalPass({
      ...alum,
      name: alum.name || `${alum.firstname || ''} ${alum.lastname || ''}`.trim(),
      branch: alum.course || alum.branch || '',
      membership_id: alum.membership_id || alum.bistaa_id || '',
    });
  }, [qrOnly, isMember, alum, onOpenDigitalPass]);

  return (
    <div style={{ minHeight: '85vh', background: 'var(--color-neutral-subtle, #f8fafc)' }}>
      {/* ─── Hero Header ─── */}
      <section className="page-hero-band" style={{ padding: '2.5rem 1rem 3rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="page-hero-eyebrow" style={{ justifyContent: 'center' }}>
            <ShieldCheck size={16} />
            {qrOnly ? 'BISTAA Member Pass Verification' : 'Official Credential Authentication System'}
          </div>
          <h1 className="page-hero-title" style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>
            {qrOnly ? 'Verify Member Pass' : 'BGI Alumni &amp; BISTAA Credential Verification'}
          </h1>
          <p className="page-hero-desc" style={{ maxWidth: 680, margin: '0 auto' }}>
            {qrOnly
              ? 'Scan a member pass QR code to confirm its registered alumni details.'
              : <>Real-time verification for graduates and lifetime members of the Bansal Institute of Science &amp; Technology (BIST) Alumni Association (BISTAA).</>}
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 940, marginTop: '-1.5rem', marginBottom: '3.5rem' }}>
        {/* ─── Search Box Card ─── */}
        {!qrOnly && <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: '#94a3b8' }} />
              <input
                ref={searchInputRef}
                type="text"
                className="form-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Enrollment Number (e.g., 0111CS...), BISTAA ID, or Name..."
                style={{ paddingLeft: '2.75rem', height: 48, fontSize: '0.975rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !searchInput.trim()}
              style={{ minWidth: 150, height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Verify Credential
                </>
              )}
            </button>
          </form>

          {/* Quick sample chips */}
          {membersList.length > 0 && !hasSearched && (
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Try quick lookup:</span>
              {membersList.slice(0, 3).map((m, idx) => {
                const sampleName = `${m.firstname || ''} ${m.lastname || ''}`.trim() || m.name;
                const sampleCode = m.enroll_no || m.enrollment || m.bistaa_id || sampleName;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchInput(sampleCode);
                      performVerification(sampleCode);
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '2px 10px',
                      color: '#17365B',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {sampleName} ({m.enroll_no || m.bistaa_id || 'Member'})
                  </button>
                );
              })}
            </div>
          )}
        </div>}

        {qrOnly && !loading && !hasSearched && (
          <div role="status" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <QrCode size={32} style={{ margin: '0 auto 0.75rem', color: '#17365b' }} />
            <p style={{ margin: 0 }}>Open this page by scanning a BISTAA member pass QR code.</p>
          </div>
        )}

        {/* ─── Loading State ─── */}
        {loading && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'inline-block', position: 'relative', marginBottom: '1.25rem' }}>
              <ShieldCheck size={48} color="#17365B" style={{ opacity: 0.3 }} />
              <RefreshCw
                size={24}
                color="#B8935F"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: 'spin 1.2s linear infinite',
                }}
              />
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#17365B', marginBottom: '0.5rem' }}>
              Validating Credential Ledger
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto' }}>
              Querying institutional records and cryptographic signatures for verification…
            </p>
          </div>
        )}

        {/* ─── Error / Not Found State ─── */}
        {!loading && hasSearched && !verifiedData && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: '1px solid #fed7aa',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fff7ed',
                color: '#ea580c',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <XCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#9a3412', marginBottom: '0.5rem' }}>
              Verification Record Not Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.925rem', maxWidth: 520, margin: '0 auto 1.5rem' }}>
              {errorMessage || 'No official verified record was located matching the supplied identifier.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!qrOnly && <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchInput('');
                  searchInputRef.current?.focus();
                }}
              >
                Try Another Search
              </button>}
              <button
                className="btn btn-primary"
                onClick={() => setView('status')}
              >
                Check Application Status
              </button>
            </div>
          </div>
        )}

        {/* ─── Verified Dossier Card ─── */}
        {!loading && verifiedData && alum && (
          <div
            id="official-verification-sheet"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '2px solid #17365B',
              boxShadow: '0 8px 30px rgba(23, 54, 91, 0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Watermark in background */}
            <div
              className="watermark"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '5rem',
                fontWeight: 900,
                color: 'rgba(23, 54, 91, 0.03)',
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '10px',
                zIndex: 0,
              }}
              aria-hidden="true"
            >
              OFFICIALLY VERIFIED
            </div>

            {/* Top Verified Header Strip */}
            <div
              style={{
                background: 'linear-gradient(135deg, #17365B 0%, #0f243d 100%)',
                color: '#ffffff',
                padding: '1.5rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '3px solid #B8935F',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <img
                    src={BGI_BHOPAL_LOGO}
                    alt="Bansal Group"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.725rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#e6d7c3', fontWeight: 600 }}>
                    Official Verification Ledger
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'var(--font-serif)' }}>
                    Bansal Group of Institutions (BGI), Bhopal
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Office of Alumni Affairs &amp; BIST Alumni Association (BISTAA)
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#ecfdf5',
                    color: '#065f46',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: '1px solid #6ee7b7',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <CheckCircle2 size={16} /> RECORD AUTHENTICATED
                </span>
                <div style={{ fontSize: '0.725rem', color: '#cbd5e1', marginTop: 4 }}>
                  Verified: {verifiedData.verified_at}
                </div>
              </div>
            </div>

            {/* Dossier Body */}
            <div style={{ padding: '2rem 1.75rem', position: 'relative', zIndex: 1 }}>
              {/* Profile Top Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1.75rem',
                  alignItems: 'center',
                  paddingBottom: '1.75rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '1.75rem',
                }}
              >
                {/* Avatar Photo */}
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: '8px',
                    border: '2px solid #cbd8e6',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    background: '#f1f5f9',
                    position: 'relative',
                  }}
                >
                  <ImageWithPlaceholder
                    src={alum.img_url || alum.photo_url || alum.avatar_url || alum.avatar || alum.image}
                    alt={alum.name}
                    variant="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    placeholderLabel={alum.name ? alum.name.split(' ').map(n => n[0]).join('') : 'AL'}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(23, 54, 91, 0.85)',
                      color: '#ffffff',
                      fontSize: '0.6rem',
                      textAlign: 'center',
                      padding: '2px 0',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}
                  >
                    VERIFIED
                  </div>
                </div>

                {/* Name & Credentials */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: isMember ? '#fef3c7' : '#eef3f8',
                        color: isMember ? '#92400e' : '#17365B',
                        border: `1px solid ${isMember ? '#fcd34d' : '#cbd8e6'}`,
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Award size={13} />
                      {isMember ? 'BISTAA Lifetime Member' : 'Registered Alumnus'}
                    </span>
                    <span
                      style={{
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Class of {alum.batch || 'Alumni'}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.65rem',
                      fontWeight: 800,
                      color: '#17365B',
                      margin: '0 0 0.35rem 0',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    {alum.name}
                  </h3>

                  <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{alum.college || 'BIST Bhopal'}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600 }}>{alum.course || alum.branch || 'Degree Conferred'}</span>
                  </div>
                </div>

                {/* Verification QR Box */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      padding: 6,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'inline-block',
                    }}
                  >
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Verification QR Code"
                        style={{ width: 100, height: 100, display: 'block', imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div style={{ width: 100, height: 100, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                        <QrCode size={28} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#64748b', marginTop: 4, maxWidth: 110 }}>
                    Official QR Seal
                  </div>
                </div>
              </div>

              {/* Data Points Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Enrollment Number
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {alum.enrollment || alum.enroll_no || 'Registered in Archive'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Official BISTAA ID
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: '#17365B', marginTop: 2 }}>
                    {alum.membership_id || alum.bistaa_id || 'Verification in Registry'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Organization / Employer
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={14} color="#64748b" />
                    {alum.employer || alum.connected_to || 'Not specified'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Role / Position
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Briefcase size={14} color="#64748b" />
                    {alum.position || alum.pos || 'Alumnus Professional'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Location
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} color="#64748b" />
                    {alum.location || alum.companyloc || 'India'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Industry Sector
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginTop: 2 }}>
                    {alum.sector || alum.companysector || 'Engineering & Technology'}
                  </div>
                </div>
              </div>

              {/* Bio / Statement if exists */}
              {alum.bio && (
                <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '1rem', marginBottom: '1.75rem', borderLeft: '4px solid #17365B' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#17365B', marginBottom: '0.25rem' }}>Alumnus Note:</div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', fontStyle: 'italic' }}>
                    "{alum.bio}"
                  </p>
                </div>
              )}

              {/* Verification Security Footer */}
              <div
                style={{
                  padding: '1.25rem',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.75rem',
                  color: '#64748b',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#17365B', marginBottom: 2, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileCheck2 size={15} color="#047857" />
                    Verification Credential Hash:
                    <code style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                      {verifiedData.verification_code}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyCodeToClipboard(verifiedData.verification_code)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
                      title="Copy verification hash"
                    >
                      {copiedCode ? <Check size={13} color="#047857" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <div>Issued by BISTAA Executive Council • Bansal Group of Institutions, Bhopal</div>
                  <div>AICTE Approved • NAAC Accredited • Affiliated to RGPV &amp; Barkatullah University</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: '#17365B' }}>{QR_CREDIT}</div>
                  <div>Direct registry lookup: <b>/verify-alum</b></div>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div
              style={{
                background: '#f1f5f9',
                padding: '1rem 1.75rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={copyVerificationLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {copiedLink ? <Check size={14} color="#047857" /> : <Share2 size={14} />}
                  {copiedLink ? 'Link Copied!' : 'Share Verification Link'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={printOfficialCertificate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Printer size={14} /> Print Certificate
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {onOpenDigitalPass && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenDigitalPass(alum)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <IdCard size={14} /> View Digital Pass
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setVerifiedData(null);
                    setHasSearched(false);
                    setSearchInput('');
                    window.history.replaceState({}, '', '/verify-alum');
                    searchInputRef.current?.focus();
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Search size={14} /> Verify Another Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Informational Welcome Section (when not searched yet) ─── */}
        {!hasSearched && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginTop: '2.5rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '8px',
                  background: '#eef3f8',
                  color: '#17365B',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h4 style={{ fontSize: '1.05rem', color: '#17365B', margin: '0 0 0.5rem 0' }}>
                Official Degree &amp; Membership Proof
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Employers, background screening agencies, and institutions can authenticate the degree conferred,
                graduation year, and active BISTAA lifetime membership.
              </p>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '8px',
                  background: '#fbf8f3',
                  color: '#B8935F',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <QrCode size={22} />
              </div>
              <h4 style={{ fontSize: '1.05rem', color: '#17365B', margin: '0 0 0.5rem 0' }}>
                Smart QR Card Integration
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Every BISTAA digital pass and physical card contains a unique cryptographic QR code that instantly
                routes to <b>/verify-alum</b> when scanned with any smartphone camera.
              </p>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '8px',
                  background: '#ecfdf5',
                  color: '#047857',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Award size={22} />
              </div>
              <h4 style={{ fontSize: '1.05rem', color: '#17365B', margin: '0 0 0.5rem 0' }}>
                BISTAA Lifetime Network
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Lifetime members receive formal credential authentication, campus alumni access, reunion privileges,
                and direct visibility across global industry networks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

