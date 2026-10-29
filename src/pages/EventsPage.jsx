import React from 'react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import DataLoadNotice from '../components/DataLoadNotice';
import { 
  MapPin, 
  Users, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

export default function EventsPage({ eventsList, onRsvpClick, setView, dataLoadFailed, dataLoading, onRetryData }) {
  return (
    <div style={{ minHeight: '80vh' }}>
      
      {/* Premium Hero Band */}
      <div className="page-hero-band">
        <div className="container">
          <div className="page-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event_available</span>
            Official Institutional Gatherings
          </div>
          <h1 className="page-hero-title">Events, Reunions &amp; Global Symposia</h1>
          <p className="page-hero-desc">
            Reconnect with professors, batchmates, and next-generation engineering students.
            Reserve your attendance to receive official BISTAA digital gate check-in passes.
          </p>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <div style={{ borderLeft: '2px solid var(--gold-500)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-secondary-hover)' }}>
                {dataLoadFailed && eventsList.length === 0 ? '—' : `${eventsList.length}+`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Scheduled Convocations &amp; Panels
              </div>
            </div>
            <div style={{ borderLeft: '2px solid var(--gold-500)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                100% Free
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                For Verified Alumni &amp; Faculty
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-section">
        <div className="container">

          {/* Events Grid */}
          {dataLoadFailed && eventsList.length === 0 ? <DataLoadNotice label="Events" onRetry={onRetryData} loading={dataLoading} /> : <div className="events-grid-premium">
            {eventsList.map(event => {
              const dateParts = event.date.match(/([A-Za-z]+)\s+(\d{1,2})/);
              const eventMonth = dateParts?.[1]?.slice(0, 3).toUpperCase() || 'DATE';
              const eventDay = dateParts?.[2] || '--';

              return (
              <div key={event.id} className="event-card-premium">
                
                {/* Event Visual Header */}
                <div className="event-card-img">
                  <ImageWithPlaceholder
                    src={event.image}
                    alt={event.title}
                    placeholderLabel={`${event.title} event photo`}
                  />
                  <div className="event-card-img-overlay" />
                  
                  {/* Date Badge */}
                  <div className="event-card-date-badge">
                    <span className="event-date-day">{eventDay}</span>
                    <span className="event-date-month">{eventMonth}</span>
                  </div>

                  {/* Badge */}
                  <div className="event-card-feature-badge">
                    {event.badge || event.type}
                  </div>
                </div>

                {/* Event Content Body */}
                <div className="event-card-body">
                  <span className="event-type-badge">
                    {event.type === 'CAMPUS' ? '🏛️ On-Campus Reunion' : event.type === 'VIRTUAL' ? '💻 Virtual Panel' : '🚀 Hybrid Summit'}
                  </span>
                  
                  <h3 className="event-card-title">
                    {event.title}
                  </h3>

                  {event.subtitle && (
                    <div className="event-card-subtitle">
                      {event.subtitle}
                    </div>
                  )}

                  <p className="event-card-description">
                    {event.description}
                  </p>

                  <div className="event-meta-row">
                    <Clock size={15} className="event-meta-icon" />
                    <span><b>Schedule:</b> {event.date} • {event.time}</span>
                  </div>

                  <div className="event-meta-row event-meta-row-venue">
                    <MapPin size={15} className="event-meta-icon" />
                    <span><b>Venue:</b> {event.venue}</span>
                  </div>

                  {/* Key Highlights */}
                  {event.highlights && (
                    <div className="event-highlights-box">
                      <div className="event-highlights-title">
                        Session Highlights
                      </div>
                      <div className="event-highlights-list">
                        {event.highlights.map((h, i) => (
                          <div key={i} className="event-highlight-item">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer RSVP */}
                <div className="event-card-footer">
                  <div className="event-spots-badge">
                    <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
                    <b>{event.attendee_count}</b> / {event.max_capacity} Confirmed
                  </div>

                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onRsvpClick(event)}
                  >
                    <Ticket size={14} /> RSVP Free Pass
                  </button>
                </div>

              </div>
              );
            })}
          </div>}

          {/* Nostalgia Gallery Teaser */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            padding: '2.5rem 3rem',
            marginTop: '4rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#003366', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_library</span>
                Memories &amp; Nostalgia Archive
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: '#003366', fontSize: '1.65rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Relive Moments from Convocations &amp; Grand Reunions
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', maxWidth: 600, lineHeight: 1.6 }}>
                Explore event and campus photographs shared by the Bansal alumni community.
              </p>
            </div>
            <button className="btn-solid-navy" onClick={() => setView('gallery')}>
              Explore Campus Gallery <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
