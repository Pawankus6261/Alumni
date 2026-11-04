const INSTITUTION_NAME = 'Bansal Group of Institutions';
const ASSOCIATION_NAME = 'BIST Alumni Association (BISTAA)';
const QR_CREDIT = 'System created by DevLinkHub Team';
let qrLibraryPromise;
const generatedQrCache = new Map();

export function preloadMemberQr() {
  qrLibraryPromise ||= import('qrcode').then(module => module.default);
  return qrLibraryPromise;
}

export async function createMemberIdentityQr(payload) {
  if (generatedQrCache.has(payload)) return generatedQrCache.get(payload);
  const QRCode = await preloadMemberQr();
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M', margin: 4, width: 480,
    color: { dark: '#17365B', light: '#FFFFFF' },
  });
  generatedQrCache.set(payload, dataUrl);
  return dataUrl;
}

/**
 * Builds the canonical public status & pass URL for an alumnus/member.
 * When scanned by any smartphone camera or QR scanner app, it opens /status
 * with that member's credentials and shows their official digital pass.
 */
export function createMemberVerificationUrl(member = {}) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

  const enrollment = String(member.enrollment || member.enroll_no || member.membership_id || member.bistaa_id || '').trim();
  const query = enrollment ? `?query=${encodeURIComponent(enrollment)}` : '';
  return `${origin}/status${query}`;
}

export function createMemberIdentityPayload(member = {}) {
  // Returns direct status link for member pass so scanning the QR code
  // automatically opens their official digital pass on any device
  return createMemberVerificationUrl(member);
}

export { INSTITUTION_NAME, ASSOCIATION_NAME, QR_CREDIT };
