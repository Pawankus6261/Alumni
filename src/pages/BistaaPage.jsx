import React, { useEffect, useState } from 'react';
import ImageUploadField from '../components/ImageUploadField';
import DataLoadNotice from '../components/DataLoadNotice';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';
import { verifyAlumnus } from '../api';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BISTAA_UPI_ID = '0795896a0298236.bqr@kotak';
const BISTAA_PAYMENT_URI = `upi://pay?${new URLSearchParams({
  pa: BISTAA_UPI_ID,
  pn: 'Bansal Institute of Science and Technology',
  am: '300.00',
  cu: 'INR',
  tn: 'BISTAA Lifetime Membership',
  mode: '02',
  purpose: '00',
})}`;

export default function BistaaPage({ alumniList, onSubmitBistaa, setView, showToast, dataLoadFailed, dataLoading, onRetryData, prefillData, onConsumePrefill }) {
  const [paymentQr, setPaymentQr] = useState('');
  const [enrollment, setEnrollment] = useState(() => prefillData?.enrollment?.trim().toUpperCase() || '');
  const [name, setName] = useState(() => prefillData?.name || '');
  const [branch, setBranch] = useState(() => prefillData?.branch || '');
  const [college, setCollege] = useState(() => prefillData?.college || 'BIST');
  const [utr, setUtr] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
  const [detectedRecord, setDetectedRecord] = useState(null);
  const [lookupStatus, setLookupStatus] = useState('idle');
  const [lookupRetry, setLookupRetry] = useState(0);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(BISTAA_PAYMENT_URI, { width: 320, margin: 2, errorCorrectionLevel: 'M' })
      .then(url => { if (active) setPaymentQr(url); })
      .catch(() => { if (active) showToast('The payment QR could not be generated.', 'error'); });
    return () => { active = false; };
  }, [showToast]);

  useEffect(() => {
    if (prefillData) onConsumePrefill?.();
  }, []);

  useEffect(() => {
    const query = enrollment.trim().toUpperCase();
    if (query.length < 4) {
      setDetectedRecord(null);
      setLookupStatus('idle');
      return undefined;
    }

    let active = true;
    const normalizeEnrollment = value => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const wanted = normalizeEnrollment(query);
    setLookupStatus('checking');
    const timer = setTimeout(async () => {
      const localMatch = alumniList.find(person => normalizeEnrollment(person.enroll_no || person.enrollment) === wanted);
      if (localMatch) {
        if (active) {
          setDetectedRecord(localMatch);
          setName(`${localMatch.firstname || ''} ${localMatch.lastname || ''}`.trim());
          setBranch(localMatch.course || localMatch.branch || '');
          setCollege(localMatch.college || 'BIST');
          setLookupStatus('found');
        }
        return;
      }

      try {
        const result = await verifyAlumnus(query);
        const person = result?.alumnus;
        const foundEnrollment = person?.enroll_no || person?.enrollment;
        if (result?.verified && person && normalizeEnrollment(foundEnrollment) === wanted) {
          const fullName = person.name || `${person.firstname || ''} ${person.lastname || ''}`.trim();
          const names = fullName.split(/\s+/);
          const matchedRecord = {
            ...person,
            firstname: person.firstname || names[0] || '',
            lastname: person.lastname || names.slice(1).join(' '),
            course: person.course || person.branch || '',
          };
          if (active) {
            setDetectedRecord(matchedRecord);
            setName(fullName);
            setBranch(matchedRecord.course);
            setCollege(person.college || 'BIST');
            setLookupStatus('found');
          }
        } else if (active) {
          setDetectedRecord(null);
          setLookupStatus('not-found');
        }
      } catch {
        if (active) {
          setDetectedRecord(null);
          setLookupStatus('error');
        }
      }
    }, 450);

    return () => { active = false; clearTimeout(timer); };
  }, [enrollment, alumniList, lookupRetry]);

  const handleEnrollmentChange = (val) => {
    const query = val.trim().toUpperCase();
    if (detectedRecord && query !== enrollment) {
      setName('');
      setBranch('');
      setCollege('BIST');
    }
    setEnrollment(query);
    setDetectedRecord(null);
    setLookupStatus(query.length >= 4 ? 'checking' : 'idle');
  };

  const handleSlipImageChange = ({ file, preview }) => {
    setSlipFile(file);
    setSlipPreviewUrl(preview);
    showToast('Payment screenshot attached successfully', 'success');
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(BISTAA_UPI_ID);
    setCopiedUpi(true);
    showToast(`UPI ID copied to clipboard: ${BISTAA_UPI_ID}`, 'success');
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lookupStatus !== 'found') {
      showToast(lookupStatus === 'not-found'
        ? 'No alumni record was found. Complete standard alumni registration first.'
        : lookupStatus === 'error'
          ? 'Could not check this enrollment number. Please retry the lookup.'
          : 'Enter a registered enrollment number and wait for its details to be confirmed.', 'error');
      return;
    }

    // Validate 12-digit UTR
    const cleanUtr = utr.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      showToast('UPI Transaction ID must be exactly 12 numeric digits (UTR)!', 'error');
      return;
    }

    if (!slipFile || !slipPreviewUrl) {
      showToast('Upload your payment screenshot before submitting.', 'error');
      return;
    }

    const newApp = {
      enrollment: enrollment.trim().toUpperCase(),
      name: name.trim(),
      branch: branch.trim(),
      college: college,
      upi_transaction_id: cleanUtr,
    };

    setIsSubmitting(true);
    try {
      const result = await onSubmitBistaa(newApp, slipFile);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) { }
      setSubmission({ reference: result?.id || '', utr: cleanUtr });
    } catch (error) {
      showToast(error.message || 'BISTAA application could not be submitted.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh' }}>

      {/* Premium Hero Band */}
      <div className="bistaa-hero-band">
        <div className="container">
          <div className="page-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>workspace_premium</span>
            Official Institutional Lifetime Credential
          </div>
          <h1 className="page-hero-title">BISTAA Lifetime Membership Portal</h1>
          <p className="page-hero-desc">
            Bansal Institute of Science &amp; Technology Alumni Association (BISTAA) lifetime membership registration.
            Contribute the one-time ₹300 association corpus fee to unlock your verifiable digital pass, voting rights, and privileged directory perks.
          </p>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <div style={{ borderLeft: '2px solid var(--gold-500)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-secondary-hover)' }}>
                ₹300
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                One-Time Lifetime Fee
              </div>
            </div>
            <div style={{ borderLeft: '2px solid var(--gold-500)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Digital Card + QR
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Official Verification Pass
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container">

          {/* Two-Column Form & QR Layout */}
          <div className="bistaa-split-layout">

            {/* Left Form Column */}
            <div className="form-card">
              <h3 style={{ fontSize: '1.25rem', color: 'var(--bgi-navy-900)', marginBottom: '0.35rem' }}>
                Alumni Verification &amp; Payment Details
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Fields marked with <span className="req">*</span> are required for official ledger verification.
              </p>

              <form onSubmit={handleSubmit}>

                {/* Enrollment Input with Autocomplete Feedback */}
                <div className="form-group">
                  <label className="form-label">
                    Enrollment Number <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your enrollment number"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    required
                    value={enrollment}
                    onChange={(e) => handleEnrollmentChange(e.target.value)}
                  />
                  <div className="form-hint">
                    Enter your university enrollment number. Registered graduate details will auto-fill.
                  </div>
                  {dataLoadFailed && alumniList.length === 0 && <DataLoadNotice label="Enrollment records" onRetry={onRetryData} loading={dataLoading} />}
                  {detectedRecord && (
                    <div style={{
                      marginTop: '0.4rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#ecfdf5',
                      color: '#065f46',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <CheckCircle2 size={15} />
                      <span><b>Record detected:</b> {detectedRecord.firstname} {detectedRecord.lastname} ({detectedRecord.college} • {detectedRecord.course})</span>
                    </div>
                  )}
                  {lookupStatus === 'checking' && <p role="status" style={{ marginTop: '0.45rem', color: '#536b84', fontSize: '0.8rem' }}>Checking the alumni register…</p>}
                  {lookupStatus === 'not-found' && (
                    <div role="alert" style={{ marginTop: '0.6rem', padding: '0.8rem', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', background: '#fff7f7', color: '#991b1b' }}>
                      <p style={{ margin: '0 0 0.55rem', fontSize: '0.85rem' }}><b>No alumni record found.</b> Complete standard alumni registration first, then return here to apply for BISTAA membership.</p>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setView('register')}>
                        Register as an alumnus first <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                  {lookupStatus === 'error' && (
                    <div role="alert" style={{ marginTop: '0.6rem', color: '#9a3412', fontSize: '0.8rem' }}>
                      Could not check the alumni register. Please check your connection and try again.{' '}
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLookupRetry(value => value + 1)}>Retry</button>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="form-group">
                  <label className="form-label">Alumnus Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full name as printed on degree"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Branch */}
                <div className="form-group">
                  <label className="form-label">Branch / Department <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Computer Science Engg. or Information Technology"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>

                {/* College */}
                <div className="form-group">
                  <label className="form-label">Constituent College <span className="req">*</span></label>
                  <select
                    className="select-field"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  >
                    <option value="BIST">Bansal Institute of Science &amp; Technology (BIST)</option>
                    <option value="BIRT">Bansal Institute of Research &amp; Technology (BIRT)</option>
                    <option value="BIRTS">Bansal Institute of Research, Technology &amp; Science (BIRTS)</option>
                  </select>
                </div>

                {/* Membership Fee Box */}
                <div className="form-group">
                  <label className="form-label">Association Lifetime Fee</label>
                  <div style={{
                    background: '#f0f7ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--bgi-navy-850)', fontSize: '0.95rem' }}>
                      ₹300.00 INR (One-Time Lifetime Membership)
                    </span>
                    <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>Fixed Fee</span>
                  </div>
                </div>

                {/* 12-Digit UPI UTR */}
                <div className="form-group">
                  <label className="form-label">
                    12-Digit UPI Transaction ID (UTR) <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    className="form-input"
                    placeholder="Enter the 12-digit UTR from your receipt"
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontWeight: 600 }}
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  />
                  <div className="form-hint">
                    Enter the 12-digit numeric Reference / UTR number from your payment receipt screenshot.
                  </div>
                </div>

                {/* File Upload Dropzone */}
                <div className="form-group">
                  <label className="form-label">
                    Payment screenshot <span className="req">*</span>
                  </label>
                  <ImageUploadField
                    id="bistaa-slip-input"
                    value={slipPreviewUrl}
                    variant="document"
                    title="Payment screenshot"
                    description="JPG, PNG or WebP · Up to 5 MB"
                    onChange={handleSlipImageChange}
                    onRemove={() => { setSlipFile(null); setSlipPreviewUrl(null); }}
                    onError={(message) => showToast(message, 'error')}
                  />
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || lookupStatus !== 'found'}
                  title={lookupStatus !== 'found' ? 'A matching alumni record is required before submitting a BISTAA application.' : undefined}
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', opacity: lookupStatus !== 'found' ? 0.55 : 1, cursor: lookupStatus !== 'found' ? 'not-allowed' : 'pointer' }}
                >
                  <ShieldCheck size={18} /> {isSubmitting ? 'Submitting application…' : 'Submit BISTAA Application & Verify'}
                </button>
              </form>
            </div>

            {/* Right Column: Scan & Pay QR Card */}
            <div>
              <div className="qr-sticky-card">
                <span className="pill pill-navy" style={{ marginBottom: '0.75rem' }}>
                  <QrCode size={14} /> Scan &amp; Pay Instant UPI
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--bgi-navy-900)', marginBottom: '0.25rem' }}>
                  BISTAA Official QR Code
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Bansal Institute of Science &amp; Technology Alumni Cell
                </p>

                {/* Visual QR Frame */}
                <div className="qr-frame">
                  {paymentQr
                    ? <img src={paymentQr} alt="BISTAA UPI payment QR code with ₹300 fixed amount" width="220" height="220" style={{ width: 220, height: 220, objectFit: 'contain' }} />
                    : <span role="status" style={{ color: 'var(--text-tertiary)', fontSize: '.85rem' }}>Preparing fixed ₹300 payment QR…</span>}
                </div>

                <div className="fee-badge-pill">
                  Fixed payment amount: ₹300/-
                </div>
                {paymentQr && <a href={paymentQr} download="BISTAA-UPI-QR-INR-300.png" className="btn btn-secondary btn-sm" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '1rem' }}>
                  <Download size={14} /> Download ₹300 QR
                </a>}

                {/* Copy UPI ID */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>UPI ID:</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--bgi-navy-850)' }}>
                    {BISTAA_UPI_ID}
                  </code>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    style={{ color: 'var(--bgi-navy-600)', padding: '2px 6px' }}
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check size={15} style={{ color: 'var(--bgi-emerald)' }} /> : <Copy size={15} />}
                  </button>
                </div>

                {/* Instructions List */}
                <div className="upi-instruction-list">
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <span style={{ color: 'var(--bgi-emerald)', fontWeight: 700 }}>1.</span>
                    <span>Scan QR code with any UPI app (GPay, PhonePe, Paytm, BHIM).</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <span style={{ color: 'var(--bgi-emerald)', fontWeight: 700 }}>2.</span>
                    <span>Pay the one-time ₹300 association fee.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <span style={{ color: 'var(--bgi-emerald)', fontWeight: 700 }}>3.</span>
                    <span>Copy the 12-digit UPI UTR reference number from receipt.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <span style={{ color: 'var(--bgi-emerald)', fontWeight: 700 }}>4.</span>
                    <span>Enter details and attach the transaction slip screenshot.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <span style={{ color: 'var(--bgi-emerald)', fontWeight: 700 }}>5.</span>
                    <span>Track status &amp; unlock your digital lifetime association ID pass.</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Help Desk: <a href="tel:+919109954681">+91 91099 54681</a> · <a href="tel:+919109954642">+91 91099 54642</a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
      {submission && <SubmissionSuccessModal
        eyebrow="BISTAA APPLICATION RECEIVED"
        title="Your application is submitted"
        message="Your application and payment proof are in the verification queue. Track the review using your enrollment number or UPI reference."
        reference={submission.reference || submission.utr}
        actionLabel="Track application"
        onAction={() => setView('status')}
      />}
    </div>
  );
}
