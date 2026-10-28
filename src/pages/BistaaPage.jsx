import React, { useState } from 'react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import ImageUploadField from '../components/ImageUploadField';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BistaaPage({ alumniList, onSubmitBistaa, setView, showToast }) {
  const [enrollment, setEnrollment] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('BIST');
  const [utr, setUtr] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
  const [detectedRecord, setDetectedRecord] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Autocomplete logic
  const handleEnrollmentChange = (val) => {
    const query = val.trim().toUpperCase();
    setEnrollment(query);

    if (query.length < 4) {
      setDetectedRecord(null);
      return;
    }

    const match = alumniList.find(a => a.enroll_no.toUpperCase() === query);
    if (match) {
      setName(`${match.firstname} ${match.lastname}`);
      setBranch(match.course);
      setCollege(match.college);
      setDetectedRecord(match);
    } else {
      setDetectedRecord(null);
      // Auto infer branch
      if (query.includes('CS')) setBranch('Computer Science Engg.');
      else if (query.includes('IT')) setBranch('Information Technology');
      else if (query.includes('EC')) setBranch('Electronic & Communication');
      else if (query.includes('EE')) setBranch('Electrical Engg.');
      else if (query.includes('ME')) setBranch('Mechanical Engg.');
      else if (query.includes('CE')) setBranch('Civil Engg');
    }
  };

  const handleSlipImageChange = ({ file, preview }) => {
    setSlipFile(file);
    setSlipPreviewUrl(preview);
    showToast('Payment screenshot attached successfully', 'success');
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('bistaa@sbi');
    setCopiedUpi(true);
    showToast('UPI ID copied to clipboard: bistaa@sbi', 'success');
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
      id: `app-${Date.now()}`,
      enrollment: enrollment.trim().toUpperCase(),
      name: name.trim(),
      branch: branch.trim(),
      college: college,
      batch: detectedRecord?.batch || 2024,
      amount: '300',
      upi_transaction_id: cleanUtr,
      transaction_slip: slipPreviewUrl || 'assets/bistaa_qr.jpg',
      status: 'PENDING_VERIFICATION',
      membership_id: null,
      submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      verified_at: null,
      verified_by: null
    };

    onSubmitBistaa(newApp);

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    showToast('BISTAA membership application submitted! Opening status tracker...', 'success');
    setTimeout(() => {
      setView('status');
    }, 1200);
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
                  placeholder="e.g. 0112CS151042 or 0114..."
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                  value={enrollment}
                  onChange={(e) => handleEnrollmentChange(e.target.value)}
                />
                <div className="form-hint">
                  Enter your university enrollment number. Registered graduate details will auto-fill.
                </div>
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
                  placeholder="e.g. 428910394821"
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
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                <ShieldCheck size={18} /> Submit BISTAA Application &amp; Verify
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
                <ImageWithPlaceholder
                  src="assets/bistaa_qr.jpg"
                  alt="BISTAA UPI payment QR code"
                  variant="compact"
                  placeholderLabel="Payment QR unavailable"
                  style={{ width: 220, height: 220, objectFit: 'contain' }}
                />
              </div>

              <div className="fee-badge-pill">
                Contribution: ₹300/- Only
              </div>

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
                  bistaa@sbi
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
                Help Desk: <b>+91 8878468786</b> • Mon–Sat (09:00 AM – 05:00 PM)
              </div>
            </div>
          </div>

        </div>

        </div>
      </div>
    </div>
  );
}
