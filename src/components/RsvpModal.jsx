import React, { useEffect, useState } from 'react';
import { X, Ticket, Calendar, MapPin, CheckCircle2, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createMemberIdentityQr } from '../utils/memberIdentityQr';

export default function RsvpModal({ event, onClose, onConfirm }) {
  const [alumniName, setAlumniName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('1');
  const [confirmedPass, setConfirmedPass] = useState(null);
  const [passQr, setPassQr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!confirmedPass?.passId) { setPassQr(''); return undefined; }
    let cancelled = false;
    const payload = [
      'BGI OFFICIAL EVENT ENTRY PASS',
      `Pass code: ${confirmedPass.passId}`,
      `Attendee: ${confirmedPass.alumniName || ''}`,
      `Enrollment: ${confirmedPass.enrollment || ''}`,
      `Event: ${confirmedPass.eventTitle || ''}`,
    ].join('\n');
    createMemberIdentityQr(payload).then(qr => { if (!cancelled) setPassQr(qr); }).catch(() => { });
    return () => { cancelled = true; };
  }, [confirmedPass]);

  if (!event) return null;

  const isPast = event.is_past ?? (event.schedule ? new Date(event.schedule) < new Date() : false);
  const isRegOpen = event.registration_open !== false;
  const canRsvp = event.can_rsvp ?? (isRegOpen && !isPast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await onConfirm({
        attendee_name: alumniName.trim(),
        enrollment_number: enrollment.trim(),
        email: email.trim(),
        guest_count: Number(guests),
      });
      setConfirmedPass({
        ...response,
        alumniName: response.attendee_name,
        enrollment: response.enrollment_number,
        guests: String(response.guest_count),
        eventTitle: event.title,
        eventDate: event.date,
        venue: event.venue,
      });
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (error) {
      setSubmitError(error.message || 'Your RSVP could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const printPassOnly = () => {
    document.body.classList.add('printing-event-pass');
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-event-pass');
    }, { once: true });
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog-box rsvp-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-icon" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!confirmedPass ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: '#eff6ff',
                color: 'var(--bgi-navy-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ticket size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--bgi-navy-900)' }}>RSVP for Reunion</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)' }}>{event.title}</p>
              </div>
            </div>

            <div className="event-entry-pass" style={{
              background: '#f8fafc',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Calendar size={14} style={{ color: 'var(--bgi-gold)' }} />
                <span><b>Date &amp; Time:</b> {event.date} • {event.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} style={{ color: 'var(--bgi-gold)' }} />
                <span><b>Venue:</b> {event.venue}</span>
              </div>
            </div>

            {!canRsvp ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: isPast ? '#f1f5f9' : '#fef2f2', color: isPast ? '#64748b' : '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Ticket size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                  {isPast ? 'This Event Has Concluded' : 'Registrations Are Closed'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {isPast 
                    ? 'RSVPs cannot be submitted for past events.'
                    : 'The administrator has closed registrations for this event.'}
                </p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Alumnus Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Your full name"
                    required
                    value={alumniName}
                    onChange={(e) => setAlumniName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Enrollment Number <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your enrollment number"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    required
                    value={enrollment}
                    onChange={(e) => setEnrollment(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email for Digital Gate Pass <span className="req">*</span></label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Attendees (Self + Family/Guests)</label>
                  <select
                    className="select-field"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="1">1 Person (Self)</option>
                    <option value="2">2 Persons</option>
                    <option value="3">3 Persons</option>
                    <option value="4">4 Persons</option>
                  </select>
                </div>

                {submitError && <p className="admin-login-error" role="alert">{submitError}</p>}

                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '0.5rem' }}>
                  <CheckCircle2 size={16} /> {isSubmitting ? 'Saving your RSVP…' : 'Confirm Attendance & Generate Gate Pass'}
                </button>
              </form>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#ecfdf5',
              color: 'var(--bgi-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <span className="rsvp-success-label"><CheckCircle2 size={14} /> RSVP CONFIRMED</span>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--bgi-navy-900)', marginBottom: '0.35rem' }}>
              You’re on the guest list!
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your RSVP for <b>{confirmedPass.eventTitle}</b> is confirmed. Your digital gate pass is ready for <b>{confirmedPass.email}</b>—keep it handy at check-in.
            </p>

            {/* Entry Gate Pass Visual */}
            <div style={{
              background: '#ffffff',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'left',
              border: '2px solid #003366',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.675rem', color: '#003366', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>OFFICIAL EVENT ENTRY PASS</span>
                  <h4 style={{ color: '#003366', fontSize: '1.05rem', fontFamily: 'var(--font-serif)', marginTop: '2px' }}>{confirmedPass.eventTitle}</h4>
                </div>
                <div style={{ background: '#ffffff', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  {passQr ? <img src={passQr} alt="Unique event entry pass QR code" width="44" height="44" style={{ width: 44, height: 44, display: 'block' }} /> : <QrCode size={36} aria-label="Generating event pass QR" />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.675rem', textTransform: 'uppercase', fontWeight: 600 }}>ATTENDEE</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{confirmedPass.alumniName}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.675rem', textTransform: 'uppercase', fontWeight: 600 }}>PASS CODE</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#003366' }}>{confirmedPass.passId}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.675rem', textTransform: 'uppercase', fontWeight: 600 }}>ENROLLMENT</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: '#334155' }}>{confirmedPass.enrollment}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.675rem', textTransform: 'uppercase', fontWeight: 600 }}>GUESTS</div>
                  <div style={{ color: '#334155' }}>{confirmedPass.guests} {confirmedPass.guests === '1' ? 'Person' : 'Persons'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Done
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={printPassOnly}>
                Print Pass
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
