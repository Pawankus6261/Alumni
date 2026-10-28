import React, { useRef, useState } from 'react';
import { Check, Image as ImageIcon, RefreshCw, Trash2, Upload } from 'lucide-react';
import ImageWithPlaceholder from './ImageWithPlaceholder';

export default function ImageUploadField({
  id,
  value,
  onChange,
  onRemove,
  onError,
  variant = 'profile',
  title,
  description = 'JPG, PNG or WebP · Up to 5 MB',
  maxSizeMB = 5,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Choose an image file such as JPG, PNG, or WebP.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`Image size must be under ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      onChange?.({ file, preview: reader.result });
    };
    reader.onerror = () => onError?.('This image could not be opened. Try another file.');
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event) => {
    processFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={`image-upload image-upload--${variant}`}>
      <input
        ref={inputRef}
        id={id}
        className="image-upload-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        aria-label={title || 'Choose an image'}
      />

      {value ? (
        <div className="image-upload-preview">
          <div className="image-upload-preview-image">
            <ImageWithPlaceholder
              src={value}
              alt={title || 'Uploaded image preview'}
              variant={variant === 'profile' ? 'avatar' : 'photo'}
              placeholderLabel={variant === 'profile' ? 'You' : 'Image preview'}
            />
          </div>
          <div className="image-upload-preview-copy">
            <span className="image-upload-success"><Check size={14} /> Image ready</span>
            <strong>{fileName || title || 'Image selected'}</strong>
            <span className="image-upload-hint">You can replace or remove it before submitting.</span>
            <div className="image-upload-preview-actions">
              <button type="button" onClick={() => inputRef.current?.click()}>
                <RefreshCw size={14} /> Replace
              </button>
              <button type="button" className="image-upload-remove" onClick={() => { setFileName(''); onRemove?.(); }}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`image-upload-dropzone ${dragging ? 'is-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <span className="image-upload-icon"><Upload size={20} /></span>
          <span className="image-upload-copy">
            <strong>{title || 'Add an image'}</strong>
            <span><b>Choose a file</b> or drag it here</span>
            <small>{description}</small>
          </span>
          <ImageIcon className="image-upload-decoration" size={22} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
