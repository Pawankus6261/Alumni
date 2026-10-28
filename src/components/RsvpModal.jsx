import React, { useState } from 'react';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import { X, Ticket, Calendar, MapPin, CheckCircle2, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RsvpModal({ event, onClose, onConfirm }) {
  const [alumniName, setAlumniName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('1');
  const [confirmedPass, setConfirmedPass] = useState(null);

  if (!event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const pass = {
      passId: `BGI-PASS-${Math.floor(100000 + Math.random() * 900000)}`,
      alumniName,
      enrollment,
      email,
      guests,
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.venue
    };
    setConfirmedPass(pass);
    onConfirm(event.title);
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}
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
                  placeholder="e.g. 0112CS151042"
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <CheckCircle2 size={16} /> Confirm Attendance &amp; Generate Gate Pass
              </button>
            </form>
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

            <h3 style={{ fontSize: '1.35rem', color: 'var(--bgi-navy-900)', marginBottom: '0.35rem' }}>
              Attendance Confirmed!
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your digital entry QR pass has been generated and sent to <b>{confirmedPass.email}</b>.
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
                  <ImageWithPlaceholder
                    src="assets/bistaa_qr.jpg"
                    alt="Check-in QR code"
                    variant="compact"
                    placeholderLabel="QR unavailable"
                    style={{ width: 44, height: 44, display: 'block' }}
                  />
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
