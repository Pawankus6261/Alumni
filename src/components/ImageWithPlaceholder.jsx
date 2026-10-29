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
  const hasSource = typeof src === 'string' && src.trim().length > 0;
  const [failed, setFailed] = useState(!hasSource);

  useEffect(() => {
    setFailed(!hasSource);
  }, [src, hasSource]);

  if (hasSource && !failed) {
    return (
      <img
        src={src}
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
