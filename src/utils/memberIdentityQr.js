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
 * Builds the QR-only verification URL for an alumnus/member.
 * The route is intentionally omitted from the site's public navigation and
 * opened directly by a phone camera or QR scanner.
 */
export function createMemberVerificationUrl(member = {}) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

  const enrollment = String(member.enrollment || member.enroll_no || '').trim();
  const membershipId = String(member.membership_id || member.bistaa_id || '').trim();
  const identifier = enrollment
    ? `enrollment=${encodeURIComponent(enrollment)}`
    : membershipId ? `membership_id=${encodeURIComponent(membershipId)}` : '';
  return `${origin}/verify-alum${identifier ? `?${identifier}` : ''}`;
}

export function createMemberIdentityPayload(member = {}) {
  // Scanning the member pass opens the hidden verification route directly.
  return createMemberVerificationUrl(member);
}

export { INSTITUTION_NAME, ASSOCIATION_NAME, QR_CREDIT };
