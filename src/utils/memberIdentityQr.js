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
 * Builds the canonical public verification URL for an alumnus/member.
 * When scanned by any smartphone camera or QR scanner app, it opens /verify-alum
 * with that member's credentials and shows their full verified profile.
 */
export function createMemberVerificationUrl(member = {}) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

  const params = new URLSearchParams();
  const enrollment = String(member.enrollment || member.enroll_no || '').trim();
  const memberId = String(member.membership_id || member.bistaa_id || '').trim();
  const id = String(member.id || '').trim();
  const name = String(member.name || [member.firstname, member.lastname].filter(Boolean).join(' ') || '').trim();
  const college = String(member.college || '').trim();
  const branch = String(member.branch || member.course || '').trim();
  const batch = String(member.batch || '').trim();

  if (enrollment) params.set('enrollment', enrollment);
  if (memberId) params.set('membership_id', memberId);
  if (id && !enrollment && !memberId) params.set('id', id);
  if (name) params.set('name', name);
  if (college) params.set('college', college);
  if (branch) params.set('branch', branch);
  if (batch) params.set('batch', batch);

  const query = params.toString();
  return `${origin}/verify-alum${query ? `?${query}` : ''}`;
}

export function createMemberIdentityPayload(member = {}) {
  // Returns direct verification link for /verify-alum so scanning the QR code
  // automatically opens the official verification page on any device
  return createMemberVerificationUrl(member);
}

export { INSTITUTION_NAME, ASSOCIATION_NAME, QR_CREDIT };
