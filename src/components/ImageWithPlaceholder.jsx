import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, UserRound } from 'lucide-react';

export default function ImageWithPlaceholder({
  src,
  alt = '',
  className = '',
  style,
  variant = 'photo',
  placeholderLabel,
}) {
  const normalizedSrc = (() => {
    if (!src || typeof src !== 'string') return '';
    const trimmed = src.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return `/media/profiles/${trimmed}`;
  })();

  const hasSource = normalizedSrc.length > 0;
  const [failed, setFailed] = useState(!hasSource);

  useEffect(() => {
    setFailed(!hasSource);
  }, [normalizedSrc, hasSource]);

  if (hasSource && !failed) {
    return (
      <img
        src={normalizedSrc}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  const isAvatar = variant === 'avatar';
  const PlaceholderIcon = isAvatar ? UserRound : ImageIcon;
  const label = placeholderLabel || (isAvatar ? 'Alumni photo' : 'Photo coming soon');
  const fallbackStyle = isAvatar
    ? { ...style, color: '#17365b', background: '#e8eef5' }
    : style;

  return (
    <div
      className={`image-placeholder image-placeholder--${variant} ${className}`.trim()}
      style={fallbackStyle}
      role="img"
      aria-label={alt || label}
    >
      {(!isAvatar || !placeholderLabel) && (
        <span className="image-placeholder-mark" aria-hidden="true">
          <PlaceholderIcon size={isAvatar ? 19 : 27} strokeWidth={1.6} />
        </span>
      )}
      {isAvatar && placeholderLabel ? (
        <span className="image-placeholder-initials">{placeholderLabel}</span>
      ) : (
        !isAvatar && <span className="image-placeholder-label">{label}</span>
      )}
    </div>
  );
}
