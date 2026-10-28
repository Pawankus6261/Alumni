import React, { useState } from 'react';
import { X, Send, User, Mail, MessageSquare, Briefcase, Building } from 'lucide-react';
import ImageWithPlaceholder from './ImageWithPlaceholder';

export default function ConnectModal({ alumnus, onClose, onSend }) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [category, setCategory] = useState('Professional networking');
  const [message, setMessage] = useState('');

  if (!alumnus) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend({
      toAlumnus: alumnus,
      senderName,
      senderEmail,
      category,
      message
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-icon" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: alumnus.avatar_color || 'var(--bgi-navy-850)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.2rem',
            overflow: 'hidden'
          }}>
            <ImageWithPlaceholder
              src={alumnus.img_url}
              alt={`${alumnus.firstname} ${alumnus.lastname}`}
              variant="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover', background: alumnus.avatar_color || 'var(--bgi-navy-850)' }}
              placeholderLabel={`${alumnus.firstname[0]}${alumnus.lastname[0]}`}
            />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--bgi-navy-900)' }}>
              Connect with {alumnus.firstname} {alumnus.lastname}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--bgi-blue-accent)', fontWeight: 600 }}>
              {alumnus.pos} @ {alumnus.connected_to}
            </p>
          </div>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <div><b>Degree:</b> {alumnus.college} • {alumnus.course}</div>
          <div><b>Batch:</b> Class of {alumnus.batch}</div>
          <div><b>Location:</b> {alumnus.companyloc}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Your Full Name <span className="req">*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. Amit Sharma (3rd Year CSE)"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Email Address <span className="req">*</span></label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="your.email@gmail.com"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Inquiry Purpose</label>
            <select
              className="select-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Professional networking">Professional networking</option>
              <option value="Alumni connection">Alumni connection</option>
              <option value="Industry discussion">Industry discussion</option>
              <option value="Campus Guest Lecture Invitation">Campus Guest Lecture Invitation</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Your Message <span className="req">*</span></label>
            <textarea
              className="form-input"
              rows={4}
              placeholder={`Introduce yourself and share why you would like to connect with ${alumnus.firstname}...`}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
            <Send size={16} /> Send Direct Inquiry via BISTAA Network
          </button>
        </form>
      </div>
    </div>
  );
}
