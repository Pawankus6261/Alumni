import React, { useState } from 'react';
import { X, ZoomIn, Sparkles, Award, GraduationCap, Users } from 'lucide-react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import DataLoadNotice from '../components/DataLoadNotice';

export default function GalleryPage({ galleryList, dataLoadFailed, dataLoading, onRetryData }) {
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const categories = [
    { id: 'Convocation', label: 'Convocations', icon: GraduationCap, description: 'Ceremonies and milestones from across the institute.' },
    { id: 'Reunions', label: 'Reunions', icon: Users, description: 'Alumni returning to campus and reconnecting.' },
    { id: 'Awards', label: 'Alumni Awards', icon: Award, description: 'Celebrating the achievements of Bansal graduates.' },
    { id: 'Campus Life', label: 'Campus Life', icon: Sparkles, description: 'Scenes and memories from everyday campus life.' }
  ];

  const photoSections = categories
    .map(category => ({
      ...category,
      photos: galleryList.filter(photo => photo.category === category.id),
    }))
    .filter(section => section.photos.length > 0);

  return (
    <div style={{ minHeight: '80vh' }}>
      
      {/* Premium Hero Band */}
      <div className="page-hero-band">
        <div className="container">
          <div className="page-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
            Historical Archives &amp; Nostalgia
          </div>
          <h1 className="page-hero-title">Campus &amp; Alumni Gallery</h1>
          <p className="page-hero-desc">
            Capturing convocations, alumni felicitations, technical symposiums, and vibrant student
            life at Bansal Institute of Science &amp; Technology across two and a half decades.
          </p>

        </div>
      </div>

      <div className="page-content-section">
        <div className="container">
          
          <div className="gallery-photo-sections">
            {dataLoadFailed && galleryList.length === 0 ? <DataLoadNotice label="Gallery photos" onRetry={onRetryData} loading={dataLoading} /> : photoSections.map(section => {
              const Icon = section.icon;
              return (
                <section key={section.id} className="gallery-photo-section" aria-labelledby={`gallery-section-${section.id}`}>
                  <header className="gallery-section-heading">
                    <div className="gallery-section-icon"><Icon size={19} aria-hidden="true" /></div>
                    <div>
                      <h2 id={`gallery-section-${section.id}`}>{section.label}</h2>
                      <p>{section.description}</p>
                    </div>
                  </header>

                  <div className="gallery-photo-grid">
                    {section.photos.map(photo => (
                      <button
                        key={photo.id}
                        type="button"
                        className="gallery-photo-card"
                        aria-label={`View photo: ${photo.title}`}
                        onClick={() => setActiveLightboxImage(photo)}
                      >
                        <span className="gallery-photo-frame">
                          <ImageWithPlaceholder
                            src={photo.image}
                            alt={photo.title}
                            placeholderLabel={`${photo.title} photo`}
                          />
                          <span className="gallery-photo-zoom" aria-hidden="true"><ZoomIn size={17} /></span>
                        </span>
                        <span className="gallery-photo-caption">
                          <strong>{photo.title}</strong>
                          <span>{photo.subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Lightbox Modal */}
          {activeLightboxImage && (
            <div className="modal-backdrop" onClick={() => setActiveLightboxImage(null)}>
              <div 
                className="modal-box gallery-lightbox" 
                style={{ maxWidth: 840, background: '#ffffff', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-modal)' }} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
                  <div>
                    <h3 className="modal-title" style={{ color: '#003366', fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>{activeLightboxImage.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      {activeLightboxImage.subtitle} • Category: {activeLightboxImage.category}
                    </p>
                  </div>
                  <button 
                    className="modal-close-btn" 
                    onClick={() => setActiveLightboxImage(null)}
                    aria-label="Close photo details"
                    style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  <div className="gallery-lightbox-image">
                    <ImageWithPlaceholder
                      src={activeLightboxImage.image} 
                      alt={activeLightboxImage.title} 
                      placeholderLabel={`${activeLightboxImage.title} photo`}
                      style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tag-chip tag-sector">{activeLightboxImage.category}</span>
                    </div>

                    <a 
                      href={activeLightboxImage.image} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--navy-800)' }}
                    >
                      <ZoomIn size={14} /> View Original Full Image
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
