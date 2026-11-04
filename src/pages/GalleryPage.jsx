import React, { useEffect, useMemo, useState } from 'react';
import { X, ZoomIn, Sparkles, Award, GraduationCap, Users, Camera, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageWithPlaceholder from '../components/ImageWithPlaceholder';
import DataLoadNotice from '../components/DataLoadNotice';

const DEFAULT_CATEGORY_METADATA = {
  'Convocation': { label: 'Convocations', icon: GraduationCap, description: 'Ceremonies and milestones from across the institute.' },
  'Reunions': { label: 'Reunions', icon: Users, description: 'Alumni returning to campus and reconnecting.' },
  'Awards': { label: 'Alumni Awards', icon: Award, description: 'Celebrating the achievements of Bansal graduates.' },
  'Campus Life': { label: 'Campus Life', icon: Sparkles, description: 'Scenes and memories from everyday campus life.' }
};

export default function GalleryPage({ galleryList, dataLoadFailed, dataLoading, onRetryData }) {
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const photoSections = useMemo(() => {
    if (!Array.isArray(galleryList)) return [];

    const categoryMap = new Map();

    galleryList.forEach(photo => {
      const rawCategory = (photo.category || 'Campus Life').trim() || 'Campus Life';
      const key = rawCategory.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { displayName: rawCategory, photos: [] });
      }
      categoryMap.get(key).photos.push(photo);
    });

    const standardKeys = ['campus life', 'convocation', 'reunions', 'awards'];
    const orderedSections = [];

    standardKeys.forEach(stdKey => {
      if (categoryMap.has(stdKey)) {
        const item = categoryMap.get(stdKey);
        const meta = Object.entries(DEFAULT_CATEGORY_METADATA).find(([k]) => k.toLowerCase() === stdKey)?.[1];
        orderedSections.push({
          id: item.displayName,
          label: meta?.label || item.displayName,
          icon: meta?.icon || Sparkles,
          description: meta?.description || `Memories and moments from ${item.displayName}.`,
          photos: item.photos,
        });
        categoryMap.delete(stdKey);
      }
    });

    categoryMap.forEach((item) => {
      orderedSections.push({
        id: item.displayName,
        label: item.displayName,
        icon: Camera,
        description: `Memories and highlights from ${item.displayName}.`,
        photos: item.photos,
      });
    });

    return orderedSections;
  }, [galleryList]);

  const visibleSections = useMemo(() => {
    if (selectedCategory === 'ALL') return photoSections;
    return photoSections.filter(sec => sec.id.toLowerCase() === selectedCategory.toLowerCase());
  }, [photoSections, selectedCategory]);
  const allPhotos = useMemo(() => photoSections.flatMap(section => section.photos), [photoSections]);
  const activePhotoIndex = activeLightboxImage
    ? allPhotos.findIndex(photo => String(photo.id) === String(activeLightboxImage.id))
    : -1;
  const moveLightbox = direction => {
    if (allPhotos.length < 2) return;
    const currentIndex = activePhotoIndex >= 0 ? activePhotoIndex : 0;
    const nextIndex = (currentIndex + direction + allPhotos.length) % allPhotos.length;
    setActiveLightboxImage(allPhotos[nextIndex]);
  };

  useEffect(() => {
    if (!activeLightboxImage) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
      if (event.key === 'Escape') setActiveLightboxImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxImage, activePhotoIndex, allPhotos]);

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

          {photoSections.length > 1 && (
            <div className="gallery-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '9999px', padding: '0.45rem 1.15rem', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                onClick={() => setSelectedCategory('ALL')}
              >
                <Filter size={14} /> All Photos ({galleryList?.length || 0})
              </button>
              {photoSections.map(sec => {
                const isSelected = selectedCategory.toLowerCase() === sec.id.toLowerCase();
                const IconComponent = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '9999px', padding: '0.45rem 1.15rem', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                    onClick={() => setSelectedCategory(isSelected ? 'ALL' : sec.id)}
                  >
                    <IconComponent size={14} /> {sec.label} ({sec.photos.length})
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="gallery-photo-sections">
            {dataLoadFailed && (!galleryList || galleryList.length === 0) ? (
              <DataLoadNotice label="Gallery photos" onRetry={onRetryData} loading={dataLoading} />
            ) : visibleSections.length > 0 ? (
              visibleSections.map(section => {
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
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
                <Camera size={44} style={{ margin: '0 auto 1rem', opacity: 0.45 }} />
                <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '0.4rem' }}>No photos found</h3>
                <p>There are no photos under this category yet.</p>
              </div>
            )}
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
                    {allPhotos.length > 1 && <>
                      <button type="button" className="gallery-lightbox-nav gallery-lightbox-prev" onClick={() => moveLightbox(-1)} aria-label="Previous photo"><ChevronLeft size={23} /></button>
                      <button type="button" className="gallery-lightbox-nav gallery-lightbox-next" onClick={() => moveLightbox(1)} aria-label="Next photo"><ChevronRight size={23} /></button>
                    </>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tag-chip tag-sector">{activeLightboxImage.category}</span>
                      {allPhotos.length > 1 && <span className="gallery-lightbox-count">{activePhotoIndex + 1} / {allPhotos.length}</span>}
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
