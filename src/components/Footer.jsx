import React from 'react';
import { BGI_BHOPAL_LOGO } from '../brand';

export default function Footer({ setView }) {
  const nav = (id) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="premium-footer">
      <div className="container">
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
              <a className="footer-contact-item" href="mailto:alumni@bist.ac.in">
                <span className="material-symbols-outlined" aria-hidden="true">mail</span>
                <span>alumni@bist.ac.in</span>
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

        <div className="footer-divider" />
        <div className="footer-bottom">
          <p className="footer-bottom-left">
            &copy; {new Date().getFullYear()} Bansal Institute of Science &amp; Technology (BIST) Bhopal.
            All Rights Reserved. Bansal Group of Institutes (BGI) Network.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="footer-accred-badge">BISTAA</span>
            <span className="footer-accred-badge">Est. 2000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
