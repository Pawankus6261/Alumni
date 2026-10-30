import React, { useState } from 'react';
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';
import { BGI_BHOPAL_LOGO } from '../brand';

export default function Footer({ setView }) {
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const nav = (id) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submitSubscription = event => {
    event.preventDefault();
    const subject = encodeURIComponent('BISTAA alumni updates subscription request');
    const body = encodeURIComponent(`Hello BISTAA Alumni Office,\n\nPlease send alumni, campus, and event updates to this email address: ${subscribeEmail.trim()}\n\nThank you.`);
    window.location.href = `mailto:info@bistbpl.in?subject=${subject}&body=${body}`;
  };

  return (
    <footer className="premium-footer">
      <div className="container">
        <section className="footer-subscribe" aria-labelledby="footer-subscribe-title">
          <div>
            <h2 id="footer-subscribe-title">Get BISTAA updates</h2>
            <p>Alumni news, campus updates, and upcoming events. Subscribe opens an email request to the Alumni Office.</p>
          </div>
          <form className="footer-subscribe-form" onSubmit={submitSubscription}>
            <label className="sr-only" htmlFor="footer-subscribe-email">Email address</label>
            <input id="footer-subscribe-email" type="email" autoComplete="email" placeholder="Your email address" value={subscribeEmail} onChange={event => setSubscribeEmail(event.target.value)} required />
            <button type="submit">Subscribe</button>
          </form>
        </section>
        <div className="footer-grid">

          {/* Brand Col */}
          <div>
            <div className="footer-crest">
              <span className="footer-crest-fallback" aria-hidden="true">BGI</span>
              <img
                src={BGI_BHOPAL_LOGO}
                alt="BGI Bhopal logo"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="footer-brand-name">BGI Alumento</div>
            <div className="footer-brand-tagline">Where BIST Stories Continue</div>
            <p className="footer-brand-desc">
              The official alumni platform of Bansal Institute of Science &amp; Technology (BIST), Bhopal.
              Fostering enduring scholarly kinship, intellectual exchange, and leadership excellence
              among graduates across engineering and technology since 2000.
            </p>
            <address className="footer-contact-list">
              <span className="footer-contact-item">
                <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
                <span>Kokta, Anand Nagar, Bhopal, MP 462021</span>
              </span>
              <a className="footer-contact-item" href="http://12.173.120.123/" target="_blank" rel="noopener noreferrer">
                <span className="material-symbols-outlined" aria-hidden="true">call</span>
                <span>+91 91099 54681 · +91 91099 54642</span>
              </a>
              <a className="footer-contact-item" href="mailto:info@bistbpl.in">
                <span className="material-symbols-outlined" aria-hidden="true">mail</span>
                <span>info@bistbpl.in</span>
              </a>
            </address>
          </div>

          {/* Alumni Hub */}
          <div>
            <div className="footer-col-heading">Alumni Hub</div>
            <ul className="footer-links">
              {[
                { id: 'home',           label: 'Home' },
                { id: 'directory',      label: 'Alumni Directory' },
                { id: 'gallery',        label: 'Nostalgia Gallery' },
                { id: 'events',         label: 'Events & Reunions' },
                { id: 'active-members', label: 'BISTAA Members' },
              ].map(link => (
                <li key={link.id}>
                  <span className="footer-link" onClick={() => nav(link.id)}>{link.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Membership */}
          <div>
            <div className="footer-col-heading">Membership</div>
            <ul className="footer-links">
              {[
                { id: 'bistaa',    label: 'BISTAA Lifetime (₹300)' },
                { id: 'register',  label: 'Join Network (Free)' },
                { id: 'status',    label: 'Check Status' },
                { id: 'verify',    label: 'Verify Alumni Credential' },
              ].map(link => (
                <li key={link.id}>
                  <span className="footer-link" onClick={() => nav(link.id)}>{link.label}</span>
                </li>
              ))}
              <li><a href="https://bgibhopal.com" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>bgibhopal.com <span className="material-symbols-outlined" style={{ fontSize: 12 }}>north_east</span></a></li>
            </ul>
          </div>

          {/* Governance */}
          <div>
            <div className="footer-col-heading">Governance</div>
            <p className="footer-governance-copy">
              All records are stewarded in conformity with institutional protocols and national academic
              credential governance (AICTE / NAAC).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span className="footer-accred-badge">AICTE Approved</span>
              <span className="footer-accred-badge">NAAC Accredited</span>
              <span className="footer-accred-badge">RGPV & BU Affiliated</span>
            </div>
          </div>

        </div>

        <section className="footer-social-strip" aria-label="BGI social media">
          <div className="footer-social-block">
            <div className="footer-social-title">Follow BGI</div>
            <div className="footer-social-links">
              <a href="https://www.facebook.com/BgiBhopalOfficial" target="_blank" rel="noopener noreferrer" aria-label="BGI on Facebook" title="Facebook"><Facebook aria-hidden="true" /></a>
              <a href="https://www.instagram.com/bgibhopal/" target="_blank" rel="noopener noreferrer" aria-label="BGI on Instagram" title="Instagram"><Instagram aria-hidden="true" /></a>
              <a href="https://www.linkedin.com/company/bgibhopal/" target="_blank" rel="noopener noreferrer" aria-label="BGI on LinkedIn" title="LinkedIn"><Linkedin aria-hidden="true" /></a>
              <a href="https://www.youtube.com/@bgibhopal" target="_blank" rel="noopener noreferrer" aria-label="BGI on YouTube" title="YouTube"><Youtube aria-hidden="true" /></a>
              <a href="https://twitter.com/BGIBhopal/" target="_blank" rel="noopener noreferrer" aria-label="BGI on X" title="X"><Twitter aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <div className="footer-divider" />
        <div className="footer-bottom">
          <p className="footer-bottom-left">
            &copy; {new Date().getFullYear()} Bansal Institute of Science &amp; Technology (BIST) Bhopal.
            All Rights Reserved. Bansal Group of Institutes (BGI) Network.
          </p>
          <p className="footer-credit">Designed &amp; Developed by <a href="https://devlinkhub.in" target="_blank" rel="noopener noreferrer"><strong>DevLinkHub Team</strong></a></p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="footer-accred-badge">BISTAA</span>
            <span className="footer-accred-badge">Est. 2000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
