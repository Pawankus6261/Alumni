import React, { useState } from 'react';
import { ArrowRight, Users, Calendar, BookOpen, Award, MapPin, ShieldCheck } from 'lucide-react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import DataLoadNotice from '../components/DataLoadNotice';

const AVATAR_COLORS = [
  '#17365B',
  '#202A35',
  '#B8935F',
  '#364152',
  '#1b416e',
  '#697586'
];

export default function HomePage({ alumniList, membersList = [], eventsList, setView, onRsvpClick, dataLoadFailed, dataLoading, onRetryData }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setView('directory');
  };

  const verifiedMemberCount = new Set((membersList || [])
    .filter(member => member.is_bistaa_member)
    .map(member => String(member.enroll_no || member.bistaa_id || `${member.firstname || ''} ${member.lastname || ''}`).replace(/[^a-z0-9]/gi, '').toLowerCase())
    .filter(Boolean)).size;

  const featuredAlumni = (() => {
    const leadingOrganizations = [
      /nvidia/, /google|alphabet/, /microsoft/, /amazon|\baws\b/, /apple/, /meta|facebook/,
      /salesforce/, /adobe/, /servicenow/, /oracle/, /ibm/, /walmart/, /vodafone/,
      /accenture/, /deloitte/, /tata consultancy|\btcs\b/, /infosys/, /wipro/, /cognizant/, /capgemini/,
    ];
    const organizationRank = member => {
      const organization = String(member.connected_to || '').toLowerCase();
      const index = leadingOrganizations.findIndex(pattern => pattern.test(organization));
      return index < 0 ? leadingOrganizations.length : index;
    };
    const profileCompleteness = member => ['pos', 'companyloc', 'course', 'batch', 'companysector']
      .reduce((score, key) => score + (String(member[key] ?? '').trim() ? 1 : 0), 0);
    const seen = new Set();
    return (membersList || []).filter(member => member.is_bistaa_member && String(member.connected_to || '').trim())
      .slice().sort((a, b) => organizationRank(a) - organizationRank(b) || profileCompleteness(b) - profileCompleteness(a))
      .filter(member => {
      const enrollment = String(member.enroll_no || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const membershipId = String(member.bistaa_id || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const key = enrollment || membershipId || `${member.firstname || ''} ${member.lastname || ''}`.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  })();
  const upcomingEvents = eventsList ? eventsList.slice(0, 3) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', background: '#ffffff' }}>

      {/* ======================================================
          HERO SECTION — Clean White Academic Institutional
          ====================================================== */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">

            {/* Left: Editorial Text */}
            <div>
              <div className="hero-eyebrow">
                <div className="hero-eyebrow-dot" />
                <span className="hero-eyebrow-text">Bansal Alumni Network</span>
                <div className="hero-eyebrow-divider" />
                <span className="hero-eyebrow-year">Est. 2000 · Bhopal</span>
              </div>

              <h1 className="hero-title">
                The Lifelong Bond of
                <span className="hero-title-accent">Bansalites....</span>
              </h1>

              <p className="hero-subtitle">
                United by a shared experience at BIST, our alumni carry their education into a wide range of professions and communities.
                Reconnect with your batch, explore fellow graduates’ journeys, and remain part of the Bansal alumni network.
              </p>

              <div className="hero-cta-row">
                <button
                  className="btn-primary-gold"
                  onClick={() => setView('directory')}
                >
                  <Users size={16} />
                  Explore Directory
                </button>
                <button
                  className="btn-outline-white"
                  onClick={() => setView('register')}
                >
                  Join the Network
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats-row hero-stats-row-single">
                <div className="hero-stat-item">
                  <div className="hero-stat-num">25 Years</div>
                  <div className="hero-stat-label">Academic Legacy</div>
                </div>
              </div>
            </div>

            {/* Right: Campus and alumni photo bento */}
            <div className="hero-image-panel">
              <div className="hero-bento-grid">
                <div className="hero-bento-tile hero-bento-top-a">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/placement-day-202618.jpeg"
                    alt="Graduation celebration"
                    placeholderLabel="Graduation celebration"
                  />
                  <span className="hero-bento-label">Graduation</span>
                </div>
                <div className="hero-bento-tile hero-bento-top-b">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/48.jpg"
                    alt="Students walking together on campus"
                    placeholderLabel="Campus life"
                  />
                  <span className="hero-bento-label">Campus life</span>
                </div>
                <div className="hero-bento-tile hero-bento-left">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/Bansal-Bonanza17.jpg"
                    alt="University campus architecture"
                    placeholderLabel="Bansal Institute campus"
                  />
                  <span className="hero-bento-label">Campus</span>
                </div>
                <div className="hero-bento-tile hero-bento-featured">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/BIST-F.jpg"
                    alt="Students sharing a moment together"
                    placeholderLabel="Alumni community"
                  />
                  <div className="hero-bento-caption">
                    <span className="hero-bento-kicker">Bansal Institute · Bhopal</span>
                    <span className="hero-bento-title">A place to learn. A community for life.</span>
                  </div>
                </div>
                <div className="hero-bento-tile hero-bento-right">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/Picture19-1.jpg"
                    alt="Graduates celebrating together"
                    placeholderLabel="Alumni gathering"
                  />
                  <span className="hero-bento-label">Alumni</span>
                </div>
                <div className="hero-bento-tile hero-bento-bottom-a">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/17.jpg"
                    alt="A classroom on campus"
                    placeholderLabel="Learning together"
                  />
                  <span className="hero-bento-label">Learning</span>
                </div>
                <div className="hero-bento-tile hero-bento-bottom-b">
                  <ImageWithPlaceholder
                    src="https://bansalgroup-assets.s3.ap-south-1.amazonaws.com/STG/Test_BGI_Bhopal/DSC01166Bansalotsav2024.webp"
                    alt="Friends and classmates together"
                    placeholderLabel="Student community"
                  />
                  <span className="hero-bento-label">Together</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          ALUMNI DIRECTORY PREVIEW
          ====================================================== */}
      <section className="section-light">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="section-eyebrow">
                <div className="section-eyebrow-line" />
                Verified Lifetime Members
              </div>
              <h2 className="section-heading">Featured BISTAA Members</h2>
              <p className="section-desc">
                Verified lifetime members with professional details from leading organizations and companies.
              </p>
            </div>
            <button className="btn btn-secondary btn-lg" onClick={() => setView('active-members')}>
              View All Members <ArrowRight size={16} />
            </button>
          </div>

          {/* Search bar */}
          <form className="home-search-form" onSubmit={handleSearchSubmit} style={{ marginBottom: '2rem' }}>
            <div className="home-search-row" style={{ display: 'flex', gap: '0.75rem', maxWidth: '580px' }}>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search the full alumni directory by name, organization, or year..."
                className="form-input"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>

          {/* Alumni Grid */}
          {dataLoadFailed && membersList.length === 0 ? <DataLoadNotice label="Verified BISTAA members" onRetry={onRetryData} loading={dataLoading} /> : <div className="alumni-grid-premium">
            {featuredAlumni.map((alumni, idx) => {
              const initials = `${alumni.firstname?.[0] || ''}${alumni.lastname?.[0] || ''}`.toUpperCase();

              return (
                <div key={alumni.enroll_no || idx} className="alumni-card-premium home-featured-card">
                  <div className="alumni-card-top">
                    <div className="alumni-avatar-premium" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                      <ImageWithPlaceholder
                        src={alumni.photo}
                        alt={`${alumni.firstname} ${alumni.lastname}`}
                        variant="avatar"
                        className="home-alumni-photo"
                        style={{ background: alumni.avatar_color || AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                        placeholderLabel={initials}
                      />
                      {alumni.is_bistaa_member && (
                        <div className="alumni-avatar-verified-badge" title="BISTAA Lifetime Member">✓</div>
                      )}
                    </div>
                    <div className="home-featured-card-heading">
                      <div className="alumni-card-name">{alumni.firstname} {alumni.lastname}</div>
                      <div className="alumni-card-pos">{alumni.pos ? `${alumni.pos} at ${alumni.connected_to}` : alumni.connected_to}</div>
                    </div>
                  </div>
                  <div className="alumni-card-body">
                    <div className="alumni-meta-row">
                      <MapPin size={14} className="alumni-meta-icon" />
                      <span>{alumni.companyloc || alumni.companyloc_abroad || 'Location not listed'}</span>
                    </div>
                    <div className="alumni-meta-row">
                      <BookOpen size={14} className="alumni-meta-icon" />
                      <span>{[alumni.course, alumni.college].filter(Boolean).join(' · ') || 'Bansal Institute of Science & Technology'}</span>
                    </div>
                    <div className="alumni-tags">
                      {alumni.batch && <span className="tag-pill tag-batch">Batch of {alumni.batch}</span>}
                      {alumni.companysector && <span className="tag-pill tag-sector">{alumni.companysector}</span>}
                      {alumni.is_bistaa_member && <span className="tag-pill tag-bistaa">Verified Member</span>}
                    </div>
                  </div>
                  <div className="home-featured-card-footer">
                    <button className="home-featured-card-link" onClick={() => setView('active-members')}>
                      View Members <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      </section>

      {/* ======================================================
          WHY BISTAA — Clean White Institutional Grid
          ====================================================== */}
      <section style={{ background: '#f8fafc', padding: '4.5rem 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              <div className="section-eyebrow-line" />
              Institutional Association
              <div className="section-eyebrow-line" />
            </div>
            <h2 className="section-heading">Why Join the Alumni Association?</h2>
            <p className="section-desc home-benefits-intro">
              Stay connected to BIST through alumni profiles, membership services, and association events.
            </p>
          </div>

          <div className="home-benefits-grid">
            {[
              { icon: 'badge', title: 'Digital Membership Pass', desc: 'A scannable pass that displays membership details and can be checked against BISTAA records.' },
              { icon: 'handshake', title: 'Verified Graduate Directory', desc: verifiedMemberCount ? `Explore professional profiles and career pathways from ${verifiedMemberCount.toLocaleString('en-IN')} verified BISTAA members.` : 'Explore professional profiles and career pathways from verified alumni.' },
              { icon: 'event', title: 'Alumni Events', desc: 'Browse scheduled reunions, campus gatherings, and academic events, and RSVP when registration is available.' },
              { icon: 'verified', title: 'Membership Review', desc: 'BISTAA administrators review membership applications before confirming a member’s status.' },
            ].map((f, i) => (
              <div key={i} style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--navy-light)',
                  color: 'var(--navy-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{f.icon}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--navy-primary)', marginBottom: '0.45rem', fontWeight: 700 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={() => setView('register')}>
              Join the Alumni Network
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================
          EVENTS & REUNIONS PREVIEW
          ====================================================== */}
      <section className="section-light">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="section-eyebrow">
                <div className="section-eyebrow-line" />
                Institutional Calendar
              </div>
              <h2 className="section-heading">Campus Convocations &amp; Gatherings</h2>
              <p className="section-desc">
                Mark your calendar for upcoming alumni meetups, campus reunions, and technical webinars.
              </p>
            </div>
            <button className="btn btn-secondary btn-lg" onClick={() => setView('events')}>
              View All Events <Calendar size={16} />
            </button>
          </div>

          {dataLoadFailed && upcomingEvents.length === 0 ? <DataLoadNotice label="Upcoming events" onRetry={onRetryData} loading={dataLoading} /> : <div className="events-grid-premium">
            {upcomingEvents.map((ev, i) => {
              const dateStr = ev.date || '';
              const [day, month] = dateStr.split(' ');
              return (
                <div key={i} className="event-card-premium">
                  <div className="event-card-img">
                    <ImageWithPlaceholder
                      src={ev.image}
                      alt={ev.title}
                      placeholderLabel={`${ev.title} photo`}
                    />
                    <div className="event-card-date-badge">
                      <span className="event-date-day">{day || '15'}</span>
                      <span className="event-date-month">{month || 'DEC'}</span>
                    </div>
                  </div>
                  <div className="event-card-body">
                    <span className="event-type-badge">{ev.type || 'Institutional Gathering'}</span>
                    <h3 className="event-card-title">{ev.title}</h3>
                    <div className="event-meta-row">
                      <MapPin size={14} className="event-meta-icon" />
                      <span>{ev.venue || 'BIST Campus, Bhopal'}</span>
                    </div>
                    <div className="event-meta-row">
                      <Calendar size={14} className="event-meta-icon" />
                      <span>{ev.date} · {ev.time}</span>
                    </div>
                  </div>
                  <div className="event-card-footer">
                    <span className="event-spots-badge">
                      {ev.attendee_count} Registered
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => onRsvpClick && onRsvpClick(ev)}>
                      RSVP Free Pass
                    </button>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      </section>

      {/* ======================================================
          CTA CALLOUT — Clean White Card with Institutional Navy
          ====================================================== */}
      <section style={{ background: '#ffffff', padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{
            background: '#ffffff',
            border: '2px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
            maxWidth: '840px',
            margin: '0 auto'
          }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              <div className="section-eyebrow-line" />
              Institutional Membership
              <div className="section-eyebrow-line" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.35rem)', fontWeight: 400, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--navy-primary)', marginBottom: '0.85rem' }}>
              Join the Bansal Alumni Network
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-body)', maxWidth: '580px', margin: '0 auto 2rem', lineHeight: 1.65 }}>
              Connect with graduates worldwide, obtain your verified directory listing,
              and stay anchored to your alma mater.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => setView('register')}>
                Join the Alumni Network
                <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setView('bistaa')}>
                BISTAA Association Portal
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
