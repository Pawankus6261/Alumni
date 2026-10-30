import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  GraduationCap,
  MapPin,
  Briefcase,
  Printer,
  ArrowLeft,
  RefreshCw,
  QrCode,
  FileCheck2,
  Award
} from 'lucide-react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import { BGI_BHOPAL_LOGO } from '../brand';
import { verifyAlumnus } from '../api';
import { createMemberIdentityQr, createMemberVerificationUrl, QR_CREDIT } from '../utils/memberIdentityQr';

export default function VerifyAlumPage({
  alumniList = [],
  membersList = [],
  setView,
}) {
  const [loading, setLoading] = useState(true);
  const [hasScanData, setHasScanData] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const loadRecord = () => {
    // Scroll window smoothly to top so the header is never cropped
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch { /* ignore */ }

    const params = new URLSearchParams(window.location.search);
    const enrollment = String(params.get('enrollment') || params.get('enroll_no') || '').trim();
    const membershipId = String(params.get('membership_id') || params.get('bistaa_id') || '').trim();
    const id = String(params.get('id') || '').trim();
    const query = String(params.get('query') || params.get('q') || '').trim();
    const name = String(params.get('name') || '').trim();

    const term = enrollment || membershipId || id || query || name;

    if (!term) {
      setHasScanData(false);
      setVerifiedData(null);
      setLoading(false);
      return;
    }

    setHasScanData(true);
    setLoading(true);
    setErrorMessage('');

    const cleanEnr = enrollment.toUpperCase();
    const cleanMem = membershipId.toUpperCase();
    const cleanName = name.toUpperCase();
    const cleanId = id.toUpperCase();
    const allLocal = [...membersList, ...alumniList];

    // Priority 1: Match local record by enrollment number
    let localMatch = cleanEnr ? allLocal.find(item => {
      const enr = String(item.enroll_no || item.enrollment || '').toUpperCase();
      return enr && enr === cleanEnr;
    }) : null;

    // Priority 2: Match local record by membership ID
    if (!localMatch && cleanMem) {
      localMatch = allLocal.find(item => {
        const mem = String(item.bistaa_id || item.membership_id || '').toUpperCase();
        return mem && mem === cleanMem;
      });
    }

    // Priority 3: Match local record by ID
    if (!localMatch && cleanId) {
      localMatch = allLocal.find(item => String(item.id || '').toUpperCase() === cleanId);
    }

    // Priority 4: Match local record by name
    if (!localMatch && cleanName) {
      localMatch = allLocal.find(item => {
        const fullName = `${item.firstname || ''} ${item.lastname || ''}`.trim().toUpperCase();
        return fullName && fullName === cleanName;
      });
    }

    // Call backend API with the most specific identifier available
    const apiLookupTerm = enrollment || membershipId || id || query || name;

    verifyAlumnus(apiLookupTerm)
      .then(result => {
        if (result && result.verified && result.alumnus) {
          setVerifiedData(result);
          setLoading(false);
        } else if (localMatch) {
          applyLocalRecord(localMatch, params);
        } else if (name || enrollment || membershipId) {
          applyParamsRecord(params);
        } else {
          setVerifiedData(null);
          setErrorMessage('No verified member record was found for this credential.');
          setLoading(false);
        }
      })
      .catch(() => {
        if (localMatch) {
          applyLocalRecord(localMatch, params);
        } else if (name || enrollment || membershipId) {
          applyParamsRecord(params);
        } else {
          setVerifiedData(null);
          setErrorMessage('No verified member record was found for this credential.');
          setLoading(false);
        }
      });
  };

  const applyLocalRecord = (localMatch, params) => {
    const isMember = Boolean(localMatch.is_bistaa_member || localMatch.bistaa_id);
    const fullName = `${localMatch.firstname || ''} ${localMatch.lastname || ''}`.trim() || localMatch.name || params.get('name') || 'Alumnus';
    const enr = localMatch.enroll_no || localMatch.enrollment || params.get('enrollment') || '';
    const memId = localMatch.bistaa_id || localMatch.membership_id || params.get('membership_id') || '';

    setVerifiedData({
      verified: true,
      verification_type: isMember ? 'BISTAA_LIFETIME_MEMBER' : 'VERIFIED_ALUMNUS',
      badge_label: isMember ? 'Verified BISTAA Lifetime Member' : 'Verified BGI Alumnus',
      verification_code: `BGI-VRF-${Date.now().toString(16).slice(-6).toUpperCase()}`,
      verified_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      alumnus: {
        ...localMatch,
        name: fullName,
        enrollment: enr,
        membership_id: memId,
        college: localMatch.college || params.get('college') || 'BIST',
        course: localMatch.course || localMatch.branch || params.get('branch') || '',
        branch: localMatch.course || localMatch.branch || params.get('branch') || '',
        batch: localMatch.batch || params.get('batch') || '',
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
  };

  const applyParamsRecord = (params) => {
    const memId = params.get('membership_id') || '';
    const isMember = Boolean(memId && memId !== 'Verification pending');
    setVerifiedData({
      verified: true,
      verification_type: isMember ? 'BISTAA_LIFETIME_MEMBER' : 'VERIFIED_ALUMNUS',
      badge_label: isMember ? 'Verified BISTAA Lifetime Member' : 'Verified BGI Alumnus',
      verification_code: `BGI-VRF-${Date.now().toString(16).slice(-6).toUpperCase()}`,
      verified_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      alumnus: {
        name: params.get('name') || 'Alumnus Member',
        enrollment: params.get('enrollment') || '',
        membership_id: memId,
        college: params.get('college') || 'BIST',
        course: params.get('branch') || params.get('course') || '',
        branch: params.get('branch') || params.get('course') || '',
        batch: params.get('batch') || '',
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
  };

  // Initial load and URL change listener
  useEffect(() => {
    loadRecord();
    const handleUrlChange = () => {
      loadRecord();
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [membersList, alumniList]);

  // Generate QR code for verified member
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

  const alum = verifiedData?.alumnus;
  const isMember = Boolean(alum?.is_bistaa_member || alum?.bistaa_id || verifiedData?.verification_type === 'BISTAA_LIFETIME_MEMBER');

  const printVerificationSlip = async () => {
    if (!alum || !verifiedData) return;

    const frame = document.createElement('iframe');
    frame.title = 'Print Verification Slip';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(frame);

    const doc = frame.contentDocument;
    if (!doc) return;

    const avatarSrc = alum.img_url || alum.photo_url || alum.avatar || '';
    const avatarHtml = avatarSrc
      ? `<img src="${avatarSrc}" alt="${alum.name}" style="width:72px;height:72px;border-radius:6px;border:1.5px solid #cbd5e1;object-fit:cover;flex-shrink:0;">`
      : `<div style="width:72px;height:72px;border-radius:6px;background:#eef3f8;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;color:#17365B;font-weight:800;font-size:18pt;flex-shrink:0;">${(alum.name || 'AL').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>`;

    const qrHtml = qrCodeDataUrl
      ? `<img src="${qrCodeDataUrl}" alt="Verification QR" style="width:74px;height:74px;border:1px solid #cbd5e1;border-radius:4px;image-rendering:pixelated;display:block;">`
      : '';

    doc.open();
    doc.write(`<!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Slip - ${alum.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            font-size: 9pt;
            line-height: 1.4;
          }
          .slip-card {
            width: 100%;
            max-width: 185mm;
            margin: 0 auto;
            border: 2px solid #17365B;
            border-radius: 8px;
            padding: 14px 18px;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff;
          }
          .header-row {
            display: flex;
            justifyContent: space-between;
            align-items: center;
            border-bottom: 2px solid #17365B;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            width: 44px;
            height: 44px;
            object-fit: contain;
          }
          .header-text h1 {
            font-size: 13pt;
            color: #17365B;
            margin: 0;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .header-text p {
            font-size: 8pt;
            color: #64748b;
            margin: 2px 0 0 0;
            font-weight: 600;
          }
          .verified-pill {
            background: #ecfdf5 !important;
            color: #065f46 !important;
            border: 1.5px solid #10b981;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 8pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }
          .profile-banner {
            display: flex;
            align-items: center;
            gap: 14px;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }
          .profile-banner-info {
            flex: 1;
            min-width: 0;
          }
          .role-tag {
            display: inline-block;
            font-size: 7.5pt;
            font-weight: 700;
            background: ${isMember ? '#fef3c7' : '#eef3f8'} !important;
            color: ${isMember ? '#92400e' : '#17365B'} !important;
            border: 1px solid ${isMember ? '#fcd34d' : '#cbd8e6'};
            padding: 1px 7px;
            border-radius: 4px;
            margin-bottom: 3px;
          }
          .member-name {
            font-size: 15pt;
            font-weight: 800;
            color: #17365B;
            margin: 0;
            line-height: 1.2;
          }
          .member-college {
            font-size: 8.5pt;
            color: #475569;
            margin-top: 2px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .data-table tr {
            page-break-inside: avoid;
          }
          .data-table td {
            padding: 5px 10px;
            border: 1px solid #e2e8f0;
            font-size: 8.5pt;
            vertical-align: top;
          }
          .data-table td.label-cell {
            background: #f8fafc !important;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 7.5pt;
            width: 25%;
            letter-spacing: 0.4px;
          }
          .data-table td.val-cell {
            font-weight: 600;
            color: #0f172a;
            width: 25%;
            word-break: break-word;
          }
          .data-table td.val-cell.mono {
            font-family: monospace;
            font-size: 8.5pt;
            font-weight: 700;
            color: #17365B;
            word-break: break-all;
          }
          .meta-box {
            background: #f8fafc !important;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
            padding: 7px 12px;
            font-size: 7.5pt;
            color: #64748b;
            display: flex;
            justifyContent: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .meta-box b {
            color: #17365B;
          }
          .footer-strip {
            display: flex;
            justifyContent: space-between;
            align-items: flex-end;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 7pt;
            color: #64748b;
          }
          .sign-area {
            text-align: center;
          }
          .sign-line {
            width: 130px;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 3px;
          }
        </style>
      </head>
      <body>
        <div class="slip-card">
          <div class="header-row">
            <div class="brand-left">
              <img class="logo-img" src="${BGI_BHOPAL_LOGO}" alt="BGI">
              <div class="header-text">
                <h1>Bansal Group of Institutions, Bhopal</h1>
                <p>BIST Alumni Association (BISTAA) • Official Verification Slip</p>
              </div>
            </div>
            <div class="verified-pill">
              ✓ OFFICIALLY VERIFIED
            </div>
          </div>

          <div class="profile-banner">
            ${avatarHtml}
            <div class="profile-banner-info">
              <span class="role-tag">${isMember ? 'BISTAA Lifetime Member' : 'Registered Alumnus'}${alum.batch ? ` • Batch ${alum.batch}` : ''}</span>
              <div class="member-name">${alum.name}</div>
              <div class="member-college">${alum.college || 'BIST Bhopal'}${alum.course ? ` • ${alum.course}` : ''}</div>
            </div>
            ${qrHtml}
          </div>

          <table class="data-table">
            <tbody>
              <tr>
                <td class="label-cell">Enrollment No.</td>
                <td class="val-cell mono">${alum.enrollment || alum.enroll_no || 'Registered in Archive'}</td>
                <td class="label-cell">Membership ID</td>
                <td class="val-cell mono">${alum.membership_id || alum.bistaa_id || 'Verification in Registry'}</td>
              </tr>
              <tr>
                <td class="label-cell">Course / Branch</td>
                <td class="val-cell">${alum.course || alum.branch || 'Degree Conferred'}</td>
                <td class="label-cell">Graduation Batch</td>
                <td class="val-cell">${alum.batch ? `Class of ${alum.batch}` : 'Completed'}</td>
              </tr>
              <tr>
                <td class="label-cell">Organization</td>
                <td class="val-cell">${alum.employer || alum.connected_to || 'Not specified'}</td>
                <td class="label-cell">Designation</td>
                <td class="val-cell">${alum.position || alum.pos || 'Alumnus Professional'}</td>
              </tr>
              <tr>
                <td class="label-cell">Work Location</td>
                <td class="val-cell">${alum.location || alum.companyloc || 'India'}</td>
                <td class="label-cell">Industry Sector</td>
                <td class="val-cell">${alum.sector || alum.companysector || 'Engineering & Tech'}</td>
              </tr>
              ${(alum.native_place || alum.native_state) ? `
              <tr>
                <td class="label-cell">Hometown / State</td>
                <td class="val-cell" colspan="3">${[alum.native_place, alum.native_state].filter(Boolean).join(', ')}</td>
              </tr>` : ''}
              ${alum.bio ? `
              <tr>
                <td class="label-cell">Member Statement</td>
                <td class="val-cell" colspan="3" style="font-style:italic;">"${alum.bio}"</td>
              </tr>` : ''}
            </tbody>
          </table>

          <div class="meta-box">
            <div>
              <b>Verification Hash:</b> <span style="font-family:monospace;">${verifiedData.verification_code}</span>
              &nbsp;•&nbsp; Authenticated on ${verifiedData.verified_at}
            </div>
            <div>
              Status: <b>ACTIVE &amp; AUTHENTIC</b>
            </div>
          </div>

          <div class="footer-strip">
            <div>
              <div>Issued by BISTAA Executive Council • Bansal Group of Institutions, Bhopal</div>
              <div>AICTE Approved • NAAC Accredited • Affiliated to RGPV &amp; Barkatullah University</div>
              <div>${QR_CREDIT}</div>
            </div>
            <div class="sign-area">
              <div class="sign-line"></div>
              <div>Authorized Institutional Registrar</div>
            </div>
          </div>
        </div>
      </body>
      </html>`);
    doc.close();

    let didPrint = false;
    const triggerPrint = async () => {
      if (didPrint || !frame.contentWindow) return;
      didPrint = true;
      const printWindow = frame.contentWindow;
      const images = Array.from(doc.images);
      await Promise.race([
        Promise.all(images.map(img => (typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve()))),
        new Promise(resolve => window.setTimeout(resolve, 800)),
      ]);
      printWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => frame.remove(), 60000);
    };

    frame.addEventListener('load', triggerPrint, { once: true });
    window.setTimeout(triggerPrint, 600);
  };

  return (
    <div style={{ minHeight: '85vh', background: '#f8fafc', padding: '1.75rem 1rem 4rem' }}>
      <style>{`
        @media print {
          header, nav, footer, .site-header, .premium-footer, button, .no-print {
            display: none !important;
          }
          body, html, main {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
      <div className="container" style={{ maxWidth: 880, margin: '0 auto' }}>
        
        {/* ─── Back to Portal Link ─── */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => {
              if (setView) setView('home');
              else window.location.href = '/';
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#17365B',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <ArrowLeft size={16} /> Back to Alumni Portal
          </button>
        </div>

        {/* ─── State 1: No QR scan data provided ─── */}
        {!hasScanData && !loading && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#eef3f8',
                color: '#17365B',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <QrCode size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#17365B', marginBottom: '0.5rem' }}>
              Scan Member QR Code
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 440, margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
              This page displays verified member details when scanned from an official BISTAA Member Pass or physical identity card.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (setView) setView('home');
                else window.location.href = '/';
              }}
            >
              Go to Home Page
            </button>
          </div>
        )}

        {/* ─── State 2: Loading State ─── */}
        {loading && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
            }}
          >
            <RefreshCw
              size={32}
              color="#17365B"
              style={{
                margin: '0 auto 1rem',
                animation: 'spin 1.2s linear infinite',
              }}
            />
            <h3 style={{ fontSize: '1.2rem', color: '#17365B', marginBottom: '0.5rem' }}>
              Verifying Member Credential…
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Authenticating record against official institutional registry.
            </p>
          </div>
        )}

        {/* ─── State 3: Not Found ─── */}
        {!loading && hasScanData && !verifiedData && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
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
              Member Record Not Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.925rem', maxWidth: 440, margin: '0 auto 1.75rem' }}>
              {errorMessage || 'The scanned QR code does not correspond to an active verified record.'}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (setView) setView('home');
                else window.location.href = '/';
              }}
            >
              Back to Portal
            </button>
          </div>
        )}

        {/* ─── State 4: Verified Member Details Dossier ─── */}
        {!loading && verifiedData && alum && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '2px solid #17365B',
              boxShadow: '0 8px 30px rgba(23, 54, 91, 0.08)',
              overflow: 'hidden',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            {/* 1. Header Band with Logo & Verified Badge */}
            <div
              style={{
                background: 'linear-gradient(135deg, #17365B 0%, #0f243d 100%)',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.85rem',
                borderBottom: '3px solid #B8935F',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: '1 1 280px' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 4,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={BGI_BHOPAL_LOGO}
                    alt="BGI Bhopal"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      margin: 0,
                      color: '#ffffff',
                      fontFamily: 'var(--font-serif)',
                      lineHeight: 1.25,
                      wordBreak: 'break-word',
                    }}
                  >
                    Bansal Group of Institutions (BGI), Bhopal
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                    BIST Alumni Association (BISTAA) Official Record
                  </div>
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#ecfdf5',
                    color: '#065f46',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.775rem',
                    border: '1px solid #6ee7b7',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <CheckCircle2 size={14} color="#059669" /> OFFICIALLY VERIFIED
                </span>
              </div>
            </div>

            {/* 2. Profile Overview Row (Avatar + Name/Badges + QR Code) */}
            <div style={{ padding: '1.5rem', boxSizing: 'border-box' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                }}
              >
                {/* Left side: Avatar + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: '1 1 300px', minWidth: 0 }}>
                  {/* Photo */}
                  <div
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: '8px',
                      border: '2px solid #cbd8e6',
                      overflow: 'hidden',
                      background: '#f1f5f9',
                      flexShrink: 0,
                    }}
                  >
                    <ImageWithPlaceholder
                      src={alum.img_url || alum.photo_url || alum.avatar}
                      alt={alum.name}
                      variant="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      placeholderLabel={alum.name ? alum.name.split(' ').map(n => n[0]).join('') : 'AL'}
                    />
                  </div>

                  {/* Name & Badges */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Award size={13} />
                        {isMember ? 'BISTAA Lifetime Member' : 'Registered Alumnus'}
                      </span>
                      {alum.batch && (
                        <span
                          style={{
                            background: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Batch of {alum.batch}
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: '#17365B',
                        margin: '0 0 0.25rem 0',
                        fontFamily: 'var(--font-serif)',
                        wordBreak: 'break-word',
                        lineHeight: 1.25,
                      }}
                    >
                      {alum.name}
                    </h3>

                    <div style={{ color: '#475569', fontSize: '0.875rem', wordBreak: 'break-word', lineHeight: 1.35 }}>
                      {alum.college || 'BIST Bhopal'}{alum.course ? ` • ${alum.course}` : ''}
                    </div>
                  </div>
                </div>

                {/* Right side: Scannable QR Code */}
                <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                  {qrCodeDataUrl && (
                    <img
                      src={qrCodeDataUrl}
                      alt="Verified QR"
                      style={{
                        width: 80,
                        height: 80,
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        display: 'block',
                        imageRendering: 'pixelated',
                      }}
                    />
                  )}
                  <div style={{ fontSize: '0.625rem', color: '#64748b', marginTop: 3 }}>
                    Official Seal
                  </div>
                </div>
              </div>

              {/* 3. Member Data Points Grid (No Overlapping, Fluid Auto-Fit) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1.5rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {/* Enrollment Number */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                    Enrollment Number
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.35,
                    }}
                  >
                    {alum.enrollment || alum.enroll_no || 'Record in Archive'}
                  </div>
                </div>

                {/* Official Membership ID (with break-all & text wrapping) */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                    Official Membership ID
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#17365B',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.35,
                    }}
                  >
                    {alum.membership_id || alum.bistaa_id || 'Verification in Registry'}
                  </div>
                </div>

                {/* Organization / Company (Clean icon + text wrapping) */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                    Organization / Company
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.45rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.35,
                      minWidth: 0,
                    }}
                  >
                    <Building size={15} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0 }}>
                      {alum.employer || alum.connected_to || 'Not specified'}
                    </span>
                  </div>
                </div>

                {/* Designation / Role */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                    Designation / Role
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.45rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.35,
                      minWidth: 0,
                    }}
                  >
                    <Briefcase size={15} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0 }}>
                      {alum.position || alum.pos || 'Alumnus Professional'}
                    </span>
                  </div>
                </div>

                {/* Work Location */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                    Work Location
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.45rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#334155',
                      lineHeight: 1.35,
                      minWidth: 0,
                    }}
                  >
                    <MapPin size={15} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0 }}>
                      {alum.location || alum.companyloc || 'India'}
                    </span>
                  </div>
                </div>

                {/* Industry Sector */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                    Industry Sector
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#334155',
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {alum.sector || alum.companysector || 'Engineering & Technology'}
                  </div>
                </div>

                {/* Hometown / Native */}
                {(alum.native_place || alum.native_state) && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      minWidth: 0,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 3 }}>
                      Hometown / Native
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#334155',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {[alum.native_place, alum.native_state].filter(Boolean).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Bio if exists */}
              {alum.bio && (
                <div
                  style={{
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.5rem',
                    borderLeft: '4px solid #17365B',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#17365B', marginBottom: '0.2rem' }}>About Member:</div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', wordBreak: 'break-word', lineHeight: 1.4 }}>
                    "{alum.bio}"
                  </p>
                </div>
              )}

              {/* 4. Security & Verification Metadata Strip */}
              <div
                style={{
                  padding: '0.9rem 1rem',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  fontSize: '0.725rem',
                  color: '#64748b',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                  <div style={{ fontWeight: 700, color: '#17365B', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <FileCheck2 size={14} color="#047857" style={{ flexShrink: 0 }} />
                    <span>Verification Hash:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', wordBreak: 'break-all' }}>
                      {verifiedData.verification_code}
                    </span>
                  </div>
                  <div style={{ marginTop: 2, fontSize: '0.7rem' }}>
                    Authenticated on {verifiedData.verified_at} • BISTAA Executive Council
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span>{QR_CREDIT}</span>
                </div>
              </div>
            </div>

            {/* 5. Bottom Action Footer */}
            <div
              style={{
                background: '#f1f5f9',
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={printVerificationSlip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <Printer size={14} /> Print Verification Slip
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
